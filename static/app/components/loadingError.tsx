import * as React from 'react';
import styled from '@emotion/styled';

import Alert from 'sentry/components/alert';
import Button from 'sentry/components/button';
import {Panel} from 'sentry/components/panels';
import {IconInfo} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';

type DefaultProps = {
  message: React.ReactNode;
};

type Props = DefaultProps & {
  onRetry?: () => void;
};

/**
 * Renders an Alert box of type "error". Renders a "Retry" button only if a `onRetry` callback is defined.
 */
class LoadingError extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    message: t('There was an error loading data.'),
  };

  shouldComponentUpdate() {
    return false;
  }

  render() {
    const {message, onRetry} = this.props;
    return (
      <StyledAlert type="error">
        <Content>
          <IconInfo size="lg" />
          <div data-test-id="loading-error-message">{message}</div>
          {onRetry && (
            <Button onClick={onRetry} type="button" priority="default" size="small">
              {t('Retry')}
            </Button>
          )}
        </Content>
      </StyledAlert>
    );
  }
}

export default LoadingError;

const StyledAlert = styled(Alert)`
  ${/* sc-selector */ Panel} & {
    border-radius: 0;
    border-width: 1px 0;
  }
`;

const Content = styled('div')`
  display: grid;
  grid-gap: ${space(1)};
  grid-template-columns: min-content auto max-content;
  align-items: center;
`;
