import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/renderer/shared/lib/cn';

function Sidebar({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar"
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-sidebar text-sidebar-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SidebarContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function SidebarGroup({ className, children, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      data-slot="sidebar-group"
      className={cn('flex w-full min-w-0 flex-col gap-2 p-3', className)}
      {...props}
    >
      {children}
    </section>
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="sidebar-group-label"
      className={cn(
        'flex items-center gap-2 text-xs font-medium tracking-wide text-sidebar-foreground/70 uppercase',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-group-action"
      className={cn(
        'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-sidebar-border bg-sidebar text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn('flex min-w-0 flex-col gap-1', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function SidebarMenu({ className, children, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn('flex min-w-0 flex-col gap-1', className)}
      {...props}
    >
      {children}
    </ul>
  );
}

function SidebarMenuItem({ className, children, ...props }: React.ComponentProps<'li'>) {
  return (
    <li data-slot="sidebar-menu-item" className={cn('relative min-w-0', className)} {...props}>
      {children}
    </li>
  );
}

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground [&_svg]:shrink-0',
  {
    variants: {
      size: {
        default: 'min-h-11',
        sm: 'min-h-9 py-2 text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

function SidebarMenuButton({
  className,
  asChild = false,
  isActive = false,
  size = 'default',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    asChild?: boolean;
    isActive?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ size, className }))}
      {...props}
    />
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-action"
      className={cn(
        'absolute top-2 right-2 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
};
