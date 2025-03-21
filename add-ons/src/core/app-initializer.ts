import LuigiClient from '@kyma-project/luigi-client';
import { BackendModule } from '../types';

class AppInitializer {
  private currentNamespace: string = '';
  private token: string | null = '';
  private backendModules: BackendModule[] = [];

  init() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, 1000);

      LuigiClient.addInitListener((e: any) => {
        this.currentNamespace = e.namespaceId;
        this.token = e.idToken;
        this.backendModules = e.backendModules;

        clearTimeout(timeout);
        resolve();
      });
    });
  }

  getBearerToken(): string | null {
    if (!this.token) {
      return null;
    }
    return `Bearer ${this.token}`;
  }

  getCurrentNamespace(): string {
    return this.currentNamespace;
  }

  getBackendModules(): BackendModule[] {
    return this.backendModules;
  }

  backendModuleExists = (name: string) => this.backendModules.includes(name);
}

export default new AppInitializer();
