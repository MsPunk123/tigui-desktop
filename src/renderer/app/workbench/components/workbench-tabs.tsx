import { X } from 'lucide-react';

import type { WorkbenchTab } from '@/renderer/app/workbench/workbench-types';
import { Button } from '@/renderer/shared/components/ui/button';
import { cn } from '@/renderer/shared/lib/cn';

type WorkbenchTabsProps = {
  tabs: WorkbenchTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
};

export const WorkbenchTabs = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: WorkbenchTabsProps) => {
  return (
    <div
      className="flex min-w-0 flex-1 items-end overflow-x-auto"
      role="tablist"
      aria-label="Workbench tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const TabIcon = tab.icon;

        return (
          <div
            key={tab.id}
            className={cn(
              'group flex min-w-0 max-w-64 items-center gap-1 border-r border-border/70 px-2',
              isActive ? 'bg-background' : 'bg-muted/35',
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={isActive}
              className={cn(
                'h-auto min-w-0 flex-1 justify-start gap-2 rounded-none border-0 px-0 py-3 text-left text-sm shadow-none focus-visible:ring-2',
                isActive
                  ? 'bg-transparent text-foreground hover:bg-transparent'
                  : 'bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground',
              )}
              onClick={() => onSelectTab(tab.id)}
            >
              <TabIcon
                className={cn(
                  'size-3.5 shrink-0',
                  isActive ? 'text-foreground/80' : 'text-muted-foreground',
                )}
              />
              <span className="truncate font-medium">{tab.title}</span>
              {tab.subtitle ? (
                <span className="truncate text-xs text-muted-foreground">{tab.subtitle}</span>
              ) : null}
            </Button>

            {tab.closable ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Close ${tab.title}`}
                className={cn(
                  'text-muted-foreground shadow-none hover:text-foreground',
                  !isActive && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
