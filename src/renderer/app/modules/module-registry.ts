import { connectionsModuleDefinition } from './connections/connections-module';
import type { AppModuleDefinition } from './module-types';

export const APP_MODULES: AppModuleDefinition[] = [connectionsModuleDefinition];

export const APP_MODULES_BY_ID = new Map(APP_MODULES.map((module) => [module.id, module]));
export const APP_MODULES_BY_ROUTE = new Map(APP_MODULES.map((module) => [module.route, module]));
