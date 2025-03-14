import { useContext } from 'react';
import gql from 'graphql-tag';
import createContainer from 'constate';
import { useSubscription } from 'react-apollo-hooks';

import { NotificationsService, ConfigurationsService } from './index';

import appInitializer from '../core//app-initializer';
import { Configuration, Notification } from '../types';
import { SubscriptionType } from './types';
import {
  KYMA_SYSTEM_ENV,
  NOTIFICATION,
  CONFIGURATION_VARIABLE,
  ERRORS,
} from '../constants';

const subscriptionFields = `
  name
  urls
  labels
`;

export const CLUSTER_ADDONS_CONFIGURATION_EVENT_SUBSCRIPTION = gql`
  subscription clusterAddonsConfigurationEvent {
    clusterAddonsConfigurationEvent {
      type
      addonsConfiguration {
        ${subscriptionFields}
      }
    }
  }
`;

export const ADDONS_CONFIGURATION_EVENT_SUBSCRIPTION = gql`
  subscription addonsConfigurationEvent(
    $namespace: String!
  ) {
    addonsConfigurationEvent(
      namespace: $namespace
    ) {
      type
      addonsConfiguration {
        ${subscriptionFields}
      }
    }
  }
`;

interface SubscriptionPayload {
  clusterAddonsConfigurationEvent?: {
    type: SubscriptionType;
    addonsConfiguration: Configuration;
  };
  addonsConfigurationEvent?: {
    type: SubscriptionType;
    addonsConfiguration: Configuration;
  };
}

interface AddonsConfigurationsSubscriptionVariables {
  namespace?: string;
}

const useSubscriptions = () => {
  const currentNamespace = appInitializer.getCurrentNamespace();
  const query = currentNamespace
    ? ADDONS_CONFIGURATION_EVENT_SUBSCRIPTION
    : CLUSTER_ADDONS_CONFIGURATION_EVENT_SUBSCRIPTION;

  const { successNotification, errorNotification } = useContext(
    NotificationsService,
  );
  const { configurationsExist, setOriginalConfigs } = useContext(
    ConfigurationsService,
  );

  const onAdd = (config: Configuration) => {
    const title = NOTIFICATION.ADD_CONFIGURATION.TITLE;
    const content = NOTIFICATION.ADD_CONFIGURATION.CONTENT.replace(
      CONFIGURATION_VARIABLE,
      config.name,
    );

    successNotification(title, content);
    setOriginalConfigs(configs => [...configs, config]);
  };

  const onUpdate = (config: Configuration) => {
    const title = NOTIFICATION.UPDATE_CONFIGURATION.TITLE;
    const content = NOTIFICATION.UPDATE_CONFIGURATION.CONTENT.replace(
      CONFIGURATION_VARIABLE,
      config.name,
    );

    successNotification(title, content);
    setOriginalConfigs(configs =>
      configs.map(c => (c.name === config.name ? { ...c, ...config } : c)),
    );
  };

  const onDelete = (config: Configuration) => {
    const title = NOTIFICATION.DELETE_CONFIGURATION.TITLE;
    const content = NOTIFICATION.DELETE_CONFIGURATION.CONTENT.replace(
      CONFIGURATION_VARIABLE,
      config.name,
    );

    successNotification(title, content);
    setOriginalConfigs(configs => configs.filter(c => c.name !== config.name));
  };

  const _ = useSubscription<
    SubscriptionPayload,
    AddonsConfigurationsSubscriptionVariables
  >(query, {
    variables: {
      namespace: currentNamespace,
    },
    onSubscriptionData: ({ subscriptionData }) => {
      const { data, error } = subscriptionData;

      if (error) {
        errorNotification('Error', ERRORS.SERVER);
        return;
      }
      if (!data) {
        return;
      }

      const {
        clusterAddonsConfigurationEvent,
        addonsConfigurationEvent,
      } = data;
      const event = currentNamespace
        ? addonsConfigurationEvent
        : clusterAddonsConfigurationEvent;
      if (!event) {
        return;
      }
      const type = event.type;
      const addonsConfiguration = event.addonsConfiguration;

      if (!type || !addonsConfiguration) {
        return;
      }

      switch (type) {
        case SubscriptionType.ADD: {
          onAdd(addonsConfiguration);
          break;
        }
        case SubscriptionType.UPDATE: {
          onUpdate(addonsConfiguration);
          break;
        }
        case SubscriptionType.DELETE: {
          onDelete(addonsConfiguration);
          break;
        }
        default:
          break;
      }
    },
  });
};

const { Provider, Context } = createContainer(useSubscriptions);
export { Provider as SubscriptionsProvider, Context as SubscriptionsService };
