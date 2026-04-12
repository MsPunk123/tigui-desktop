import type { ReactNode } from 'react';

import {
  DEFAULT_PLATFORM_LAYOUT_CONFIG,
  type PlatformLayoutConfig,
} from '@/renderer/shared/layout/platform-layout';
import { cn } from '@/renderer/shared/lib/cn';

type AppShellProps = {
  appHeader: ReactNode;
  sidebar: ReactNode;
  topbar: ReactNode;
  content: ReactNode;
  config?: PlatformLayoutConfig;
  className?: string;
};

export const AppShell = ({
  appHeader,
  sidebar,
  topbar,
  content,
  config,
  className,
}: AppShellProps) => {
  const resolved = {
    ...DEFAULT_PLATFORM_LAYOUT_CONFIG,
    ...config,
  };

  return (
    <main className={cn('h-screen w-screen', resolved.rootPaddingClassName, className)}>
      <section
        className="grid h-full overflow-hidden border bg-card"
        style={{ gridTemplateColumns: `${resolved.sidebarWidthPx}px 1fr` }}
      >
        <aside className="flex h-full flex-col border-r">
          <div
            className="flex items-center justify-center border-b px-4"
            style={{ minHeight: `${resolved.topbarHeightPx}px` }}
          >
            {appHeader}
          </div>
          <div
            className={cn(
              'flex h-full flex-col',
              resolved.sidebarScrollable ? 'overflow-y-auto' : 'overflow-hidden',
            )}
          >
            {sidebar}
          </div>
        </aside>

        <section
          className="grid h-full min-w-0"
          style={{ gridTemplateRows: `${resolved.topbarHeightPx}px 1fr` }}
        >
          <header className="min-w-0 border-b">{topbar}</header>
          <div
            className={cn(
              'min-w-0 p-2 sm:p-3 lg:p-4',
              resolved.contentScrollable ? 'overflow-y-auto overflow-x-auto' : 'overflow-hidden',
            )}
          >
            {content}
          </div>
        </section>
      </section>
    </main>
  );
};

export type { AppShellProps };
