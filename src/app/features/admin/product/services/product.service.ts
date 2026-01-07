import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductModel } from '../model/product.model';
import { filter, map, Observable } from 'rxjs';
import { updateProduct } from '../model/product.model';
import { DataObject, PropertiesObject } from '../model/product.model';
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = 'http://localhost:3000/products';
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
    const url = filter ? `${this.apiUrl}?filter=${filter}` : this.apiUrl;

    return this.http.get<any[]>(url).pipe(
      map((response: any[]) => {
        return response.map((item: any) => {
          const props = item.properties as { label: string; value: any }[];

          const getValue = (label: string): any => {
            return props
              .filter((p: { label: string; value: any }) => p.label === label)
              .map((p: { label: string; value: any }) => p.value)[0];
          };

          return {
            id: item.id,
            key: item.key,
            name: getValue('name') || '',
            description: getValue('description') || '',
            price: Number(getValue('price') || 0),
            brand: getValue('brand') || '',
            imageUrl: getValue('imageUrl') || '',
            quantity: Number(getValue('quantity') || 0),
            status: getValue('status')?.toString() || '0',
            releaseDate: getValue('releaseDate') || '',
          } as ProductModel;
        });
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
  // checkboxesFilter(filters: { name: string; values: string[] }[]): Observable<ProductModel[]> {
  //   return this.getProducts('').pipe(
  //     map((products) => {
  //       const activeFilters = filters.filter((f) => f.values.length > 0);
  //       if (activeFilters.length === 0) {
  //         return products;
  //       }
  //       return products.filter((product) => {
  //         return activeFilters.every((filter) => {
  //           if (filter.name === 'brand') {
  //             return filter.values.includes(product.brand);
  //           }
  //           return true;
  //         });
  //       });
  //     })
  //   );
  // }
  // radioFilter(filter: { name: string; value: string }): Observable<ProductModel[]> {
  //   return this.getProducts('').pipe(
  //     map((products) => {
  //       if (filter.name === 'status') {
  //         return products.filter((product) => product.status === filter.value);
  //       }
  //       return products;
  //     })
  //   );
  // }
  // rangeFilter(filter: { name: string; min: string; max: string }): Observable<ProductModel[]> {
  //   return this.getProducts('').pipe(
  //     map((products) => {
  //       if (filter.name === 'price') {
  //         return products.filter(
  //           (product) =>
  //             product.price >= parseFloat(filter.min) && product.price <= parseFloat(filter.max)
  //         );
  //       } else {
  //         return products.filter((product) => {
  //           const productDate = this.parseDate(product.releaseDate);
  //           if (!productDate) return false;
  //           const minDate = this.parseDate(filter.min);
  //           const maxDate = this.parseDate(filter.max);
  //           if (!minDate && maxDate) {
  //             return productDate <= maxDate;
  //           }
  //           if (minDate && !maxDate) {
  //             return productDate >= minDate;
  //           }
  //           if (minDate && maxDate) {
  //             return productDate >= minDate && productDate <= maxDate;
  //           }
  //           return true;
  //         });
  //       }
  //     })
  //   );
  // }
  getPropertyValue(properties: Array<{ label: string; value: any }>, label: string): any {
    return properties?.find((p) => p.label === label)?.value ?? null;
  }
  buildCreatePayload(newProduct: updateProduct): any {
    return {
      key: Date.now(),
      properties: [
        { label: 'name', value: newProduct.name },
        { label: 'price', value: newProduct.price },
        {
          label: 'releaseDate',
          value: newProduct.releaseDate || new Date().toISOString().split('T')[0],
        },
        { label: 'brand', value: newProduct.brand },
        { label: 'imageUrl', value: newProduct.imageUrl || newProduct.imageLocate || '' },
        { label: 'description', value: newProduct.description || '' },
        { label: 'quantity', value: newProduct.quantity },
        { label: 'status', value: newProduct.status !== undefined ? Number(newProduct.status) : 1 },
      ],
    };
  }
  transformToProductModel(raw: any): ProductModel {
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
