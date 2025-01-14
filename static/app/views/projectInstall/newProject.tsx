import DocumentTitle from 'react-document-title';
import styled from '@emotion/styled';

import space from 'sentry/styles/space';
import CreateProject from 'sentry/views/projectInstall/createProject';

const NewProject = () => (
  <Container>
    <div className="container">
      <Content>
        <DocumentTitle title="Sentry" />
        <CreateProject />
      </Content>
    </div>
  </Container>
);

const Container = styled('div')`
  flex: 1;
  background: ${p => p.theme.background};
  margin-bottom: -${space(3)}; /* cleans up a bg gap at bottom */
`;

const Content = styled('div')`
  margin-top: ${space(3)};
`;

export default NewProject;
