export interface DataObjectUpdate {
  key: number;
  properties: 
    { label: string; value: any }[]
}
export interface updateProduct
{
    id?: number,
    name: string,
    imageUrl?: string,
    imageLocate?: string,
    price?: number,
    brand: string,
    quantity : number,
    status: number,
    description?: string
}