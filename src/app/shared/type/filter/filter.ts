export interface FilterGroup {
  DataInput?: DataInput;    
  label: string;
  request : FilterOption[];
}
export interface DataInput {
  dataSource: DataObject[];
}
export interface DataObject {
  key: string| number;
  label: string;
  properties?: PropertiesObject[]; 
}
export interface PropertiesObject{
  label: string;
  value: any;
}
export interface FilterOption {
  title: string;
  type: 'checkbox' | 'range' | 'select'| 'search' | 'page' | 'radio';
  request: FilterRequest;
  target: string;
}
export interface FilterRequest {
    type: string;
    value?: string | number | boolean | Array<string | number | boolean>;
    range?: { min: number|Date; max: number |Date};
    page?: number;
    pageSize?: number;
}
export interface Result{
    key: (string| number)[];
}
export interface FilterResult {
    results: Result[];
    url: string;
}
