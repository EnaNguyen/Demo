export interface HeaderLeft {
  imgSrc?: string;
  title?: string;
  url?: string;
}

export interface HeaderRightItem {
  title: string;
  url: string;
  iconSrc?: string;
}

export interface HeaderRightGroup {
  icons?: HeaderRightItem[];
  dropdownList?: HeaderRightItem[];
}

export interface HeaderCenter {
  menu: Array<{
    title: string;
    url: string;
  }>;
}

export interface HeaderConfig {
  left?: HeaderLeft;
  right: HeaderRightGroup[];
  center?: HeaderCenter;
}
