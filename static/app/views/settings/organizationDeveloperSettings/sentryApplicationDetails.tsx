import * as React from 'react';
import {browserHistory, RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import omit from 'lodash/omit';
import {Observer} from 'mobx-react';
import scrollToElement from 'scroll-to-element';

import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';
import {
  addSentryAppToken,
  removeSentryAppToken,
} from 'app/actionCreators/sentryAppTokens';
import Feature from 'app/components/acl/feature';
import Avatar from 'app/components/avatar';
import AvatarChooser, {Model} from 'app/components/avatarChooser';
import Button from 'app/components/button';
import DateTime from 'app/components/dateTime';
import {Panel, PanelBody, PanelHeader, PanelItem} from 'app/components/panels';
import Tooltip from 'app/components/tooltip';
import {SENTRY_APP_PERMISSIONS} from 'app/constants';
import {
  internalIntegrationForms,
  publicIntegrationForms,
} from 'app/data/forms/sentryApplication';
import {IconAdd, IconDelete} from 'app/icons';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {InternalAppApiToken, Scope, SentryApp} from 'app/types';
import getDynamicText from 'app/utils/getDynamicText';
import AsyncView from 'app/views/asyncView';
import EmptyMessage from 'app/views/settings/components/emptyMessage';
import Form from 'app/views/settings/components/forms/form';
import FormField from 'app/views/settings/components/forms/formField';
import JsonForm from 'app/views/settings/components/forms/jsonForm';
import FormModel, {FieldValue} from 'app/views/settings/components/forms/model';
import TextCopyInput from 'app/views/settings/components/forms/textCopyInput';
import SettingsPageHeader from 'app/views/settings/components/settingsPageHeader';
import PermissionsObserver from 'app/views/settings/organizationDeveloperSettings/permissionsObserver';

type Resource = 'Project' | 'Team' | 'Release' | 'Event' | 'Organization' | 'Member';

/**
 * Finds the resource in SENTRY_APP_PERMISSIONS that contains a given scope
 * We should always find a match unless there is a bug
 * @param {Scope} scope
 * @return {Resource | undefined}
 */
const getResourceFromScope = (scope: Scope): Resource | undefined => {
  for (const permObj of SENTRY_APP_PERMISSIONS) {
    const allChoices = Object.values(permObj.choices);

    const allScopes = allChoices.reduce(
      (_allScopes: string[], choice) => _allScopes.concat(choice?.scopes ?? []),
      []
    );

    if (allScopes.includes(scope)) {
      return permObj.resource as Resource;
    }
  }
  return undefined;
};

class SentryAppFormModel extends FormModel {
  /**
   * Filter out Permission input field values.
   *
   * Permissions (API Scopes) are presented as a list of SelectFields.
   * Instead of them being submitted individually, we want them rolled
   * up into a single list of scopes (this is done in `PermissionSelection`).
   *
   * Because they are all individual inputs, we end up with attributes
   * in the JSON we send to the API that we don't want.
   *
   * This function filters those attributes out of the data that is
   * ultimately sent to the API.
   */
  getData() {
    return this.fields.toJSON().reduce((data, [k, v]) => {
      if (!k.endsWith('--permission')) {
        data[k] = v;
      }
      return data;
    }, {});
  }

  /**
   * We need to map the API response errors to the actual form fields.
   * We do this by pulling out scopes and mapping each scope error to the correct input.
   * @param {Object} responseJSON
   */
  mapFormErrors(responseJSON?: any) {
    if (!responseJSON) {
      return responseJSON;
    }
    const formErrors = omit(responseJSON, ['scopes']);
    if (responseJSON.scopes) {
      responseJSON.scopes.forEach((message: string) => {
        // find the scope from the error message of a specific format
        const matches = message.match(/Requested permission of (\w+:\w+)/);
        if (matches) {
          const scope = matches[1];
          const resource = getResourceFromScope(scope as Scope);
          // should always match but technically resource can be undefined
          if (resource) {
            formErrors[`${resource}--permission`] = [message];
          }
        }
      });
    }
    return formErrors;
  }
}

type Props = RouteComponentProps<{orgId: string; appSlug?: string}, {}>;

type State = AsyncView['state'] & {
  app: SentryApp | null;
  tokens: InternalAppApiToken[];
};

export default class SentryApplicationDetails extends AsyncView<Props, State> {
  form = new SentryAppFormModel();

  getDefaultState(): State {
    return {
      ...super.getDefaultState(),
      app: null,
      tokens: [],
    };
  }

  getEndpoints(): ReturnType<AsyncView['getEndpoints']> {
    const {appSlug} = this.props.params;
    if (appSlug) {
      return [
        ['app', `/sentry-apps/${appSlug}/`],
        ['tokens', `/sentry-apps/${appSlug}/api-tokens/`],
      ];
    }

    return [];
  }

  getTitle() {
    const {app} = this.state;
    const integrationAction = app ? 'Edit' : 'Create';
    const integrationType = this.isInternal ? 'Internal' : 'Public';
    return t('%s %s Integration', integrationAction, integrationType);
  }

  // Events may come from the API as "issue.created" when we just want "issue" here.
  normalize(events) {
    if (events.length === 0) {
      return events;
    }

    return events.map(e => e.split('.').shift());
  }

  handleSubmitSuccess = (data: SentryApp) => {
    const {app} = this.state;
    const {orgId} = this.props.params;
    const baseUrl = `/settings/${orgId}/developer-settings/`;
    const url = app ? baseUrl : `${baseUrl}${data.slug}/`;
    addSuccessMessage(t('%s successfully %s.', data.name, app ? 'saved' : 'created'));
    browserHistory.push(url);
  };

  handleSubmitError = err => {
    let errorMessage = t('Unknown Error');
    if (err.status >= 400 && err.status < 500) {
      errorMessage = err?.responseJSON.detail ?? errorMessage;
    }
    addErrorMessage(errorMessage);

    if (this.form.formErrors) {
      const firstErrorFieldId = Object.keys(this.form.formErrors)[0];

      if (firstErrorFieldId) {
        scrollToElement(`#${firstErrorFieldId}`, {
          align: 'middle',
          offset: 0,
        });
      }
    }
  };

  get isInternal() {
    const {app} = this.state;
    if (app) {
      // if we are editing an existing app, check the status of the app
      return app.status === 'internal';
    }
    return this.props.route.path === 'new-internal/';
  }

  get showAuthInfo() {
    const {app} = this.state;
    return !(app && app.clientSecret && app.clientSecret[0] === '*');
  }

  onAddToken = async (evt: React.MouseEvent): Promise<void> => {
    evt.preventDefault();
    const {app, tokens} = this.state;
    if (!app) {
      return;
    }

    const api = this.api;

    const token = await addSentryAppToken(api, app);
    const newTokens = tokens.concat(token);
    this.setState({tokens: newTokens});
  };

  onRemoveToken = async (token: InternalAppApiToken, evt: React.MouseEvent) => {
    evt.preventDefault();
    const {app, tokens} = this.state;
    if (!app) {
      return;
    }

    const api = this.api;
    const newTokens = tokens.filter(tok => tok.token !== token.token);

    await removeSentryAppToken(api, app, token.token);
    this.setState({tokens: newTokens});
  };

  renderTokens = () => {
    const {tokens} = this.state;
    if (tokens.length > 0) {
      return tokens.map(token => (
        <StyledPanelItem key={token.token}>
          <TokenItem>
            <Tooltip
              disabled={this.showAuthInfo}
              position="right"
              containerDisplayMode="inline"
              title={t(
                'You do not have access to view these credentials because the permissions for this integration exceed those of your role.'
              )}
            >
              <TextCopyInput>
                {getDynamicText({value: token.token, fixed: 'xxxxxx'})}
              </TextCopyInput>
            </Tooltip>
          </TokenItem>
          <CreatedDate>
            <CreatedTitle>Created:</CreatedTitle>
            <DateTime
              date={getDynamicText({
                value: token.dateCreated,
                fixed: new Date(1508208080000),
              })}
            />
          </CreatedDate>
          <Button
            onClick={this.onRemoveToken.bind(this, token)}
            size="small"
            icon={<IconDelete />}
            data-test-id="token-delete"
            type="button"
          >
            {t('Revoke')}
          </Button>
        </StyledPanelItem>
      ));
    }
    return <EmptyMessage description={t('No tokens created yet.')} />;
  };

  onFieldChange = (name: string, value: FieldValue): void => {
    if (name === 'webhookUrl' && !value && this.isInternal) {
      // if no webhook, then set isAlertable to false
      this.form.setValue('isAlertable', false);
    }
  };

  getAvatarPreview = (avatarStyle: 'color' | 'simple') => {
    const {app} = this.state;
    const styleMap = {
      color: {
        size: 50,
        title: t('Default Logo'),
        description: t('The default icon for integrations'),
      },
      simple: {
        size: 20,
        title: t('Default Icon'),
        description: t('This is an optional icon used for Issue Linking'),
      },
    };
    return (
      app && (
        <AvatarPreview>
          <StyledPreviewAvatar
            size={styleMap[avatarStyle].size}
            sentryApp={app}
            isDefault
          />
          <AvatarPreviewTitle>{styleMap[avatarStyle].title}</AvatarPreviewTitle>
          <AvatarPreviewText>{styleMap[avatarStyle].description}</AvatarPreviewText>
        </AvatarPreview>
      )
    );
  };

  getAvatarModel = (avatarStyle: 'color' | 'simple'): Model => {
    const {app} = this.state;
    const defaultModel: Model = {
      avatar: {
        avatarType: 'default',
        avatarUuid: null,
      },
    };
    const isColor = avatarStyle === 'color';
    return !app
      ? defaultModel
      : {avatar: (app?.avatars || []).find(({color}) => color === isColor)} ||
          defaultModel;
  };

  getAvatarChooser = (avatarStyle: 'color' | 'simple') => {
    const {app} = this.state;
    if (!app) {
      return null;
    }
    const isColor = avatarStyle === 'color';

    return (
      <Feature features={['organizations:sentry-app-logo-uplokad']}>
        <AvatarChooser
          type={isColor ? 'sentryAppColor' : 'sentryAppSimple'}
          allowGravatar={false}
          allowLetter={false}
          endpoint={`/sentry-apps/${app.slug}/avatar/`}
          model={this.getAvatarModel(avatarStyle)}
          onSave={({avatar}) => {
            if (avatar) {
              const prevAvatars = app?.avatars ?? [];
              const avatars = prevAvatars.filter(
                prevAvatar => prevAvatar.color !== avatar.color
              );
              avatars.push(avatar);
              this.setState({app: {...app, avatars}});
            }
          }}
          title={isColor ? t('Logo') : t('Small Icon')}
          defaultChoice={{
            allowDefault: true,
            choiceText: isColor ? t('Default logo') : t('Default small icon'),
            avatar: this.getAvatarPreview(avatarStyle),
          }}
        />
      </Feature>
    );
  };

  renderBody() {
    const {orgId} = this.props.params;
    const {app} = this.state;
    const scopes = (app && [...app.scopes]) || [];
    const events = (app && this.normalize(app.events)) || [];
    const method = app ? 'PUT' : 'POST';
    const endpoint = app ? `/sentry-apps/${app.slug}/` : '/sentry-apps/';

    const forms = this.isInternal ? internalIntegrationForms : publicIntegrationForms;
    let verifyInstall: boolean;
    if (this.isInternal) {
      // force verifyInstall to false for all internal apps
      verifyInstall = false;
    } else {
      // use the existing value for verifyInstall if the app exists, otherwise default to true
      verifyInstall = app ? app.verifyInstall : true;
    }

    return (
      <div>
        <SettingsPageHeader title={this.getTitle()} />
        <Form
          apiMethod={method}
          apiEndpoint={endpoint}
          allowUndo
          initialData={{
            organization: orgId,
            isAlertable: false,
            isInternal: this.isInternal,
            schema: {},
            scopes: [],
            ...app,
            verifyInstall, // need to overwrite the value in app for internal if it is true
          }}
          model={this.form}
          onSubmitSuccess={this.handleSubmitSuccess}
          onSubmitError={this.handleSubmitError}
          onFieldChange={this.onFieldChange}
        >
          <Observer>
            {() => {
              const webhookDisabled =
                this.isInternal && !this.form.getValue('webhookUrl');
              return (
                <React.Fragment>
                  <JsonForm additionalFieldProps={{webhookDisabled}} forms={forms} />
                  {this.getAvatarChooser('color')}
                  {this.getAvatarChooser('simple')}
                  <PermissionsObserver
                    webhookDisabled={webhookDisabled}
                    appPublished={app ? app.status === 'published' : false}
                    scopes={scopes}
                    events={events}
                  />
                </React.Fragment>
              );
            }}
          </Observer>

          {app && app.status === 'internal' && (
            <Panel>
              <PanelHeader hasButtons>
                {t('Tokens')}
                <Button
                  size="xsmall"
                  icon={<IconAdd size="xs" isCircled />}
                  onClick={evt => this.onAddToken(evt)}
                  data-test-id="token-add"
                  type="button"
                >
                  {t('New Token')}
                </Button>
              </PanelHeader>
              <PanelBody>{this.renderTokens()}</PanelBody>
            </Panel>
          )}

          {app && (
            <Panel>
              <PanelHeader>{t('Credentials')}</PanelHeader>
              <PanelBody>
                {app.status !== 'internal' && (
                  <FormField name="clientId" label="Client ID">
                    {({value}) => (
                      <TextCopyInput>
                        {getDynamicText({value, fixed: 'CI_CLIENT_ID'})}
                      </TextCopyInput>
                    )}
                  </FormField>
                )}
                <FormField name="clientSecret" label="Client Secret">
                  {({value}) =>
                    value ? (
                      <Tooltip
                        disabled={this.showAuthInfo}
                        position="right"
                        containerDisplayMode="inline"
                        title={t(
                          'You do not have access to view these credentials because the permissions for this integration exceed those of your role.'
                        )}
                      >
                        <TextCopyInput>
                          {getDynamicText({value, fixed: 'CI_CLIENT_SECRET'})}
                        </TextCopyInput>
                      </Tooltip>
                    ) : (
                      <em>hidden</em>
                    )
                  }
                </FormField>
              </PanelBody>
            </Panel>
          )}
        </Form>
      </div>
    );
  }
}

const StyledPanelItem = styled(PanelItem)`
  display: flex;
  justify-content: space-between;
`;

const TokenItem = styled('div')`
  width: 70%;
`;

const CreatedTitle = styled('span')`
  color: ${p => p.theme.gray300};
  margin-bottom: 2px;
`;

const CreatedDate = styled('div')`
  display: flex;
  flex-direction: column;
  font-size: 14px;
  margin: 0 10px;
`;

const AvatarPreview = styled('div')`
  flex: 1;
  display: grid;
  grid: 25px 25px / 50px 1fr;
`;

const StyledPreviewAvatar = styled(Avatar)`
  grid-area: 1 / 1 / 3 / 2;
  justify-self: end;
`;

const AvatarPreviewTitle = styled('span')`
  display: block;
  grid-area: 1 / 2 / 2 / 3;
  padding-left: ${space(2)};
  font-weight: bold;
`;

const AvatarPreviewText = styled('span')`
  display: block;
  grid-area: 2 / 2 / 3 / 3;
  padding-left: ${space(2)};
`;
