import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataObject } from '../../type/filter/filter';
import { DataObjectUpdate, updateProduct } from '../../data/updateModels/product/product';

@Injectable({
  providedIn: 'root',
})
export class ProductContext {
  private productsSubject = new BehaviorSubject<DataObject[]>([]);
  public products$ = this.productsSubject.asObservable();

  private readonly STORAGE_KEY = 'products';
  private readonly API_URL = 'http://localhost:3000/products';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.loadProducts();
  }

  private loadProducts(): void {
    console.log('Loading products from:', this.API_URL);
    this.http
      .get<any[]>(this.API_URL)
      .subscribe({
        next: (products) => {
          console.log('Products loaded successfully:', products);
          this.setProductsFromRawData(products);
        },
        error: (error) => {
          console.error('Error loading products from server:', error);
          this.http
            .get<{ products: any[] }>('/data.json')
            .subscribe({
              next: (data) => {
                console.log('Fallback to data.json:', data.products);
                this.setProductsFromRawData(data.products || []);
              },
              error: (fallbackError) => {
                console.error('Fallback failed:', fallbackError);
                this.productsSubject.next([]);
              },
            });
        },
      });
  }

  private setProductsFromRawData(raw: any[]): void {
    const products = raw.map(
      (product) =>
        ({
          key: product.key,
          id: product.id, 
          label: this.getPropertyValue(product.properties, 'name') || `Product ${product.key}`,
          properties: product.properties || [],
        } as DataObject)
    );
 
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
  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const current = this.productsSubject.getValue();
    const dataToStore = {
      products: current.map((p) => ({
        key: p.key,
        properties: p.properties || [],
      })),
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
  }

  updateProducts(newProduct: updateProduct, serverId?: string | number): void {
    const currentProducts = this.productsSubject.getValue();
    let serverIdForUpdate = serverId;
    if (!serverIdForUpdate && newProduct.id) {
      const productToUpdateData = currentProducts.find(p => p.key === newProduct.id);
      serverIdForUpdate = productToUpdateData?.id;
    }

    if (serverIdForUpdate) {
      const currentProduct = currentProducts.find(p => p.id === serverIdForUpdate);
      const currentReleaseDate = currentProduct?.properties?.find(p => p.label === 'releaseDate')?.value;
      
      const productToUpdate = this.buildProductPayload(
        serverIdForUpdate,
        newProduct,
        currentReleaseDate
      );
      

      
      this.http.put(`${this.API_URL}/${serverIdForUpdate}`, productToUpdate).subscribe({
        next: (response) => {

        },
        error: (error) => {
          console.error(' Error:', error.status, error.message);
          alert('Lỗi cập nhật: ' + (error.message || 'Unknown error'));
        },
      });
    } else {
      console.warn('Product not found');
      alert('Không tìm thấy sản phẩm');
    }
  }

  createProduct(newProduct: updateProduct): void {
    const productPayload = {
      key: Date.now(),
      properties: [
        { label: 'name', value: newProduct.name },
        { label: 'price', value: newProduct.price },
        { label: 'releaseDate', value: newProduct.releaseDate || new Date().toISOString().split('T')[0] },
        { label: 'brand', value: newProduct.brand },
        { label: 'imageUrl', value: newProduct.imageUrl || newProduct.imageLocate || '' },
        { label: 'description', value: newProduct.description || '' },
        { label: 'quantity', value: newProduct.quantity },
        { label: 'status', value: newProduct.status !== undefined && newProduct.status !== null ? Number(newProduct.status) : 1 },
      ],
    };
    
    this.http.post(this.API_URL, productPayload).subscribe({
      next: (response: any) => {
        console.log('Product created on server successfully:', response);
        setTimeout(() => {
          this.loadProducts();
        }, 500);
      },
      error: (error) => {
        console.error('Error creating product on server:', error);
        alert('Lỗi tạo sản phẩm: ' + (error.message || 'Unknown error'));
      },
    });
  }

  private buildProductPayload(id: number | string, product: updateProduct, releaseDate?: any): any {
    const now = new Date();
    const products = {
      id: id,
      key: id,
      properties: [
        { label: 'name', value: product.name },
        { label: 'price', value: product.price },
        { label: 'releaseDate', value: releaseDate || now.toISOString().split('T')[0] },
        { label: 'brand', value: product.brand },
        { label: 'imageUrl', value: product.imageUrl || product.imageLocate || '' },
        { label: 'description', value: product.description || '' },
        { label: 'quantity', value: product.quantity },
        { label: 'status', value: product.status !== undefined && product.status !== null ? Number(product.status) : 1 },
      ],
    };
    console.log(products);
    return products;
  }
}
