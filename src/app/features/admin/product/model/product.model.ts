export interface ProductModel {
    id: string;
    key: string;
    name: string;
    description: string;
    price: number;
    brand: string;
    imageUrl: string;
    quantity: number;
    status: string;
    releaseDate: string;
}
export interface updateProduct
{
    id?: string,
    name: string,
    imageUrl?: string,
    imageLocate?: string,
    price?: number,
    brand: string,
    quantity : number,
    status: number,
    description?: string,
    releaseDate?: string
}
export interface DataObject {
  key: string| number;
  label: string;
  properties?: PropertiesObject[];
  id?: string | number; 
}
export interface PropertiesObject{
  label: string;
  value: any;
}