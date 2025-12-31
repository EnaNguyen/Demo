import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataObject } from '../../type/filter/filter';
import { DataObjectUpdate, updateProduct } from '../../data/updateModels/product/product';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ProductContext {
  private productsSubject = new BehaviorSubject<DataObject[]>([]);
  public products$ = this.productsSubject.asObservable();

  private readonly STORAGE_KEY = 'products';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadProducts();
  }

  private loadProducts(): void {
    // 1. Try to load from localStorage only in browser
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.setProductsFromRawData(data.products || []);
          return;
        } catch (e) {
          console.error('Failed to parse products from localStorage', e);
        }
      }
    }

    // 2. Fallback: load from server / data.json
    this.http
      .get<{ products: any[] }>('/data.json')
      .pipe(
        map(data => {
          // Save to localStorage only in browser
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
          }
          return data.products || [];
        })
      )
      .subscribe({
        next: (rawProducts) => this.setProductsFromRawData(rawProducts),
        error: () => this.productsSubject.next([])
      });
  }

  private setProductsFromRawData(raw: any[]): void {
    const products = raw.map(product => ({
      key: product.key,
      label: this.getPropertyValue(product.properties, 'name') || `Product ${product.key}`,
      properties: product.properties || []
    } as DataObject));

    this.productsSubject.next(products);
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

  // Helper method to save current state (call this after every change)
  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const current = this.productsSubject.getValue();
    const dataToStore = {
      products: current.map(p => ({
        key: p.key,
        properties: p.properties || []
      }))
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
  }

  updateProducts(newProduct: updateProduct): void {
    const currentProducts = this.productsSubject.getValue();

    const updatedList: DataObjectUpdate[] = currentProducts.map((product) => {
      if (product.key !== newProduct.id) {
        return { key: product.key as number, properties: product.properties || [] }; // loại bỏ label và cast key
      }
      const oldProperties = product.properties || [];
      const getOldValue = (label: string, defaultValue: any = '') => {
        return oldProperties.find((p) => p.label === label)?.value ?? defaultValue;
      };

      return {
        key: newProduct.id,
        properties: [
          { label: 'name', value: newProduct.name },
          { label: 'brand', value: newProduct.brand },
          { label: 'quantity', value: newProduct.quantity },
          { label: 'status', value: newProduct.status },
          {
            label: 'imageUrl',
            value: newProduct.imageUrl || newProduct.imageLocate || getOldValue('imageUrl'),
          },
          { label: 'releaseDate', value: getOldValue('releaseDate', '') },
          { label: 'price', value: getOldValue('price', 0) },
          { label: 'description', value: getOldValue('description', '') },
        ],
      };
    });
    const dataToStore = { products: updatedList };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
    }

    this.productsSubject.next(
      updatedList.map((item) => ({
        key: item.key,
        label: this.getPropertyValue(item.properties, 'name') || `Product ${item.key}`,
        properties: item.properties,
      }))
    );
  }

  createProduct(newProduct: updateProduct): void {

    const currentProducts = this.productsSubject.getValue();

    const now = new Date();
    const newProductData: DataObjectUpdate = {
      key: Date.now(),
      properties: [
        { label: 'name', value: newProduct.name },
        { label: 'brand', value: newProduct.brand },
        { label: 'quantity', value: newProduct.quantity },
        { label: 'status', value: newProduct.status },
        { label: 'price', value: newProduct.price },
        { label: 'imageUrl', value: newProduct.imageUrl || '' },
        { label: 'releaseDate', value: now.toISOString().split('T')[0] },
        { label: 'description', value: newProduct.description || '' },
      ]
    };

    const updatedList = [newProductData, ...currentProducts.map(item => ({ key: item.key as number, properties: item.properties || [] }))];


    const dataToStore = { products: updatedList };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));

    }
    const newProducts = updatedList.map(item => ({
      key: item.key,
      label: this.getPropertyValue(item.properties, 'name') || `Product ${item.key}`,
      properties: item.properties
    }));

    this.productsSubject.next(newProducts);

    this.http.post('/data.json', dataToStore).subscribe({
      next: (response) => {
        console.log('Product created on server');
      },
      error: (error) => {
        console.log('Server create failed, but local create succeeded');
      }
    });
  }
}