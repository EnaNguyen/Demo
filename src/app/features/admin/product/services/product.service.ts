import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductModel } from '../model/product.model';
import { filter, map, Observable } from 'rxjs';
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
            id: Number(item.id),
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
}
