export type PlatformLayoutConfig = {
  sidebarWidthPx?: number;
  topbarHeightPx?: number;
  sidebarScrollable?: boolean;
  contentScrollable?: boolean;
  rootPaddingClassName?: string;
};

export const DEFAULT_PLATFORM_LAYOUT_CONFIG: Required<PlatformLayoutConfig> = {
  sidebarWidthPx: 280,
  topbarHeightPx: 68,
  sidebarScrollable: true,
  contentScrollable: true,
  rootPaddingClassName: '',
};
