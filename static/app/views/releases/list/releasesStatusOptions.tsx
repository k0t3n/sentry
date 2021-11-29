import styled from '@emotion/styled';

import {t} from 'sentry/locale';

import ReleasesDropdown from './releasesDropdown';

export enum ReleasesStatusOption {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

const options = {
  [ReleasesStatusOption.ACTIVE]: {label: t('Active')},
  [ReleasesStatusOption.ARCHIVED]: {label: t('Archived')},
};

type Props = {
  selected: ReleasesStatusOption;
  onSelect: (key: string) => void;
};

function ReleasesStatusOptions({selected, onSelect}: Props) {
  return (
    <StyledReleasesDropdown
      label={t('Status')}
      options={options}
      selected={selected}
      onSelect={onSelect}
    />
  );
}

export default ReleasesStatusOptions;

const StyledReleasesDropdown = styled(ReleasesDropdown)`
  z-index: 3;
  @media (max-width: ${p => p.theme.breakpoints[2]}) {
    order: 1;
  }
`;
