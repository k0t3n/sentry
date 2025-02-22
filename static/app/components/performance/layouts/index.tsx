import styled from '@emotion/styled';

import space from 'sentry/styles/space';

/**
 * Common performance layouts
 */

export const PerformanceLayoutBodyRow = styled('div')<{
  columns?: number;
  minSize: number;
}>`
  display: grid;
  grid-template-columns: 1fr;
  grid-column-gap: ${space(2)};
  grid-row-gap: ${space(2)};

  @media (min-width: ${p => p.theme.breakpoints[0]}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${p => p.theme.breakpoints[2]}) {
    ${p =>
      p.columns
        ? `
    grid-template-columns: repeat(${p.columns}, 1fr);
    `
        : `
    grid-template-columns: repeat(auto-fit, minmax(${p.minSize}px, 1fr));
    `}
  }
`;
