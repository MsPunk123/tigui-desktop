import type { ReactNode } from 'react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/renderer/shared/components/ui';

type WorkbenchPlaceholderProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export const WorkbenchPlaceholder = ({ title, description, icon }: WorkbenchPlaceholderProps) => {
  return (
    <Empty className="min-h-[280px]">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
