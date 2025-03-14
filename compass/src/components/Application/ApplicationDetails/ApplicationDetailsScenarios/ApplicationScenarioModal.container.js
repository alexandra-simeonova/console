import { compose, graphql } from 'react-apollo';
import AssignScenarioModal from '../../../Shared/AssignScenario/AssignScenarioModal.component';
import { SET_APPLICATION_SCENARIOS } from './../../gql';
import { SEND_NOTIFICATION } from '../../../../gql';

export default compose(
  graphql(SET_APPLICATION_SCENARIOS, {
    props: props => ({
      updateScenarios: async (applicationId, scenarios) => {
        await props.mutate({
          variables: {
            id: applicationId,
            scenarios: scenarios,
          },
        });
      },
    }),
  }),
  graphql(SEND_NOTIFICATION, {
    name: 'sendNotification',
  }),
)(AssignScenarioModal);
