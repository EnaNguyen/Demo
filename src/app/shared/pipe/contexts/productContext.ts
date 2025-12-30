import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataObject } from '../../type/filter/filter';

@Injectable({
  providedIn: 'root'
})
export class ProductContext {
  private productsSubject = new BehaviorSubject<DataObject[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadProducts();
  }


  private loadProducts(): void {
    this.http
      .get<{ products: any[] }>('/data.json')
      .pipe(
        map((data) => {

          return data.products.map((product: any) => ({
            key: product.key,
            label: this.getPropertyValue(product.properties, 'name') || `Product ${product.key}`,
            properties: product.properties
          } as DataObject));
        })
      )
      .subscribe({
        next: (products) => {

          this.productsSubject.next(products);
        },
        error: (error) => {

          this.productsSubject.next([]);
        }
      });
  }

  private getPropertyValue(properties: Array<{ label: string; value: any }>, label: string): any {
    const property = properties?.find((p) => p.label === label);
    return property ? property.value : null;
  }

  getUniqueBrands(): Observable<string[]> {
    return this.products$.pipe(
      map((products) => {
        const brands = new Set<string>();
        products.forEach((product) => {
          const brand = this.getPropertyValue(product.properties || [], 'brand');
          if (brand) {
            brands.add(String(brand));
          }
        });
        return Array.from(brands).sort();
      })
    );
  }

  getPriceRange(): Observable<{ min: number; max: number }> {
    return this.products$.pipe(
      map((products) => {
        let min = Number.MAX_VALUE;
        let max = 0;
        products.forEach((product) => {
          const price = this.getPropertyValue(product.properties || [], 'price');
          if (price) {
            const numPrice = Number(price);
            min = Math.min(min, numPrice);
            max = Math.max(max, numPrice);
          }
        });
        return { min: min === Number.MAX_VALUE ? 0 : min, max: max === 0 ? 0 : max };
      })
    );
  }


  getDateRange(): Observable<{ min: Date; max: Date }> {
    return this.products$.pipe(
      map((products) => {
        let min = new Date();
        let max = new Date('1900-01-01');
        let hasValidDate = false;

        products.forEach((product) => {
          const date = this.getPropertyValue(product.properties || [], 'releaseDate');
          if (date) {
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              hasValidDate = true;
              min = dateObj < min ? dateObj : min;
              max = dateObj > max ? dateObj : max;
            }
          }
        });

        if (!hasValidDate) {
          min = new Date();
          max = new Date();
        }

        return { min, max };
      })
    );
  }
}
