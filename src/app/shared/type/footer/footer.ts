export interface iconLink{
    iconSrc?: string;
    url?: string;
    hoverText?: string;
}
export interface Info{
    Name?: string;
    Email?: string;
    Phone?: string;
    Address?: string;
}
export interface titleLink{
    title: string;
    url: string;
}
export interface FooterConfig{
    info: Info;
    iconLinks: iconLink[];
    column : number;
    titlesLinks: titleLink[];
}