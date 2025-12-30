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
  value: string | number | boolean;
}
export interface FilterOption {
  title: string;
  type: 'checkbox' | 'radio' | 'range' | 'select'| 'search';
  request: FilterRequest;
}
export interface FilterRequest {
    value?: string | number | boolean | Array<string | number | boolean>;
    range?: { min: number; max: number };
}
export interface Result{
    key: string[]| number[];
}
export interface FilterResult {
    results: Result[];
    url: string;
}
