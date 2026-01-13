import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductModel } from '../model/product.model';
import { filter, map, Observable } from 'rxjs';
import { updateProduct } from '../model/product.model';
import { DataObject, PropertiesObject } from '../model/product.model';
import { environment } from '../../../../../environments/environment.development';
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = environment.apiUrl + '/product';
  constructor(private http: HttpClient) {}
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    const fullYear = year < 100 ? 2000 + year : year;
    const date = new Date(fullYear, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return date;
  }
  getProducts(filter: string = ''): Observable<ProductModel[]> {
    const url = filter ? `${this.apiUrl}/ProductList?name=${filter}` : `${this.apiUrl}/ProductList`;

    return this.http.get<any[]>(url).pipe(
      map((response: any[]) => {
        return response.map((item: any) => ({
        id: item.id || 0,
        key: item.id || '',            
        name: item.name || '',
        description: item.description || '',
        price: Number(item.price) || 0,
        brand: item.brand || '',
        imageUrl: item.img || item.imageUrl || '', 
        quantity: Number(item.quantity) || 0,
        status: String(item.status ?? 1),     
        releaseDate: item.releaseDate || '',
      } as ProductModel));
      })
    );
  }
  searchBooks(query: string): Observable<ProductModel[]> {
    if (!query.trim()) {
      return this.getProducts('');
    }
    return this.getProducts('').pipe(
      map((products) =>
        products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
      )
    );
  }
  getPropertyValue(properties: Array<{ label: string; value: any }>, label: string): any {
    return properties?.find((p) => p.label === label)?.value ?? null;
  }
  buildCreatePayload(newProduct: updateProduct): any {
    return {
      name: newProduct.name,
      description: newProduct.description || '',
      brand: newProduct.brand,
      price: newProduct.price || 0,
      quantity: newProduct.quantity || 0,
      status: newProduct.status !== undefined ? Number(newProduct.status) : 1,
      img: newProduct.imageUrl || newProduct.imageLocate || null,
    };
  }
  transformToProductModel(raw: any): ProductModel {
    const isApiResponse = raw.name && raw.description;    
    if (isApiResponse) {
      return {
        id: raw.id || '',
        key: raw.id || '',
        name: raw.name || '',
        description: raw.description || '',
        price: Number(raw.price) || 0,
        brand: raw.brand || '',
        imageUrl: raw.img || raw.imageUrl || '',
        quantity: Number(raw.quantity) || 0,
        status: String(raw.status) || 'active',
        releaseDate: raw.releaseDate || new Date().toISOString().split('T')[0],
      };
    }
    const properties = raw.properties || [];
    const getProp = (label: string) => {
      const prop = properties.find((p: PropertiesObject) => p.label === label);
      return prop ? prop.value : null;
    };
    return {
      id: raw.id,
      key: raw.key || raw.id,
      name: getProp('name') || `Product ${raw.key}`,
      description: getProp('description') || '',
      price: Number(getProp('price')) || 0,
      brand: getProp('brand') || '',
      imageUrl: getProp('imageUrl') || '',
      quantity: Number(getProp('quantity')) || 0,
      status: getProp('status') || 'active',
      releaseDate: getProp('releaseDate') || new Date().toISOString().split('T')[0],
    };
  }
  buildUpdatePayload(id: number | string, product: updateProduct, releaseDate?: any): any {
    return {
      id,
      key: id,
      properties: [
        { label: 'name', value: product.name },
        { label: 'price', value: product.price },
        { label: 'releaseDate', value: releaseDate || new Date().toISOString().split('T')[0] },
        { label: 'brand', value: product.brand },
        { label: 'imageUrl', value: product.imageUrl || product.imageLocate || '' },
        { label: 'description', value: product.description || '' },
        { label: 'quantity', value: product.quantity },
        { label: 'status', value: product.status !== undefined ? Number(product.status) : 1 },
      ],
    };
  }
  transformRawToProducts(raw: any[]): ProductModel[] {
    return raw.map((product) => {
      const properties = product.properties || [];
      const getProp = (label: string) => {
        const prop = properties.find((p: PropertiesObject) => p.label === label);
        return prop ? prop.value : null;
      };
      return {
        id: product.id,
        key: product.key || product.id,
        name: getProp('name') || `Product ${product.key || product.id}`,
        description: getProp('description') || '',
        price: Number(getProp('price')) || 0,
        brand: getProp('brand') || '',
        imageUrl: getProp('imageUrl') || '',
        quantity: Number(getProp('quantity')) || 0,
        status: getProp('status') || 'active',
        releaseDate: getProp('releaseDate') || new Date().toISOString().split('T')[0],
      };
    });
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  statusUpdate(id: string ,product: ProductModel): any {
    return {
      id,
      key: id,
      properties: [
        { label: 'name', value: product.name },
        { label: 'price', value: product.price },
        { label: 'releaseDate', value: product.releaseDate || new Date().toISOString().split('T')[0] },
        { label: 'brand', value: product.brand },
        { label: 'imageUrl', value: product.imageUrl || '' },
        { label: 'description', value: product.description || '' },
        { label: 'quantity', value: product.quantity },
        { label: 'status', value: product.status === "1" ? "0" : "1" },
      ],
    };
  }
}
