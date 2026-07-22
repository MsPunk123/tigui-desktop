import type { AppModuleDefinition } from '@/renderer/app/modules/module-types';
import { Button } from '@/renderer/shared/components/ui';

type ModuleNavProps = {
  modules: AppModuleDefinition[];
  activeModuleId: string;
  onNavigate: (route: string) => void;
};

export const ModuleNav = ({ modules, activeModuleId, onNavigate }: ModuleNavProps) => {
  return (
    <nav className="space-y-1 px-3 py-3" aria-label="Modules">
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = module.id === activeModuleId;
        return (
          <Button
            key={module.id}
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => onNavigate(module.route)}
          >
            <Icon />
            <span>{module.label}</span>
          </Button>
        );
      })}
    </nav>
  );
};
