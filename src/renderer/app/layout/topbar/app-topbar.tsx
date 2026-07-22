import type { ReactNode } from 'react';

type AppTopbarProps = {
  tabs: ReactNode;
  children?: ReactNode;
};

export const AppTopbar = ({ tabs, children }: AppTopbarProps) => {
  return (
    <div className="flex h-full min-w-0 items-stretch">
      <div className="flex min-w-0 flex-1">{tabs}</div>
      {children ? (
        <div className="flex shrink-0 items-center border-l px-4 text-sm text-muted-foreground">
          {children}
        </div>
      ) : null}
    </div>
  );
};
