import { signalStore, withState, withMethods, patchState, withHooks, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Injectable, Inject, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { DataObject } from '../../type/filter/filter';
import { DataObjectUpdate, updateProduct } from '../../data/updateModels/product/product';
type ProductState = {
  products: DataObject[];
  loading: boolean;
  loaded: boolean;
  error: any;
};
const initialState: ProductState = {
  products: [],
  loading: false,
  loaded: false,
  error: null,
};
const API_URL = 'http://localhost:3000/products';

export const ProductStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withMethods((store, http = inject(HttpClient)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        switchMap(() =>
          http.get<any[]>(API_URL).pipe(
            map((raw) => transformRawToProducts(raw)),
            tap((products) => patchState(store, { products, loaded: true, loading: false })),
            catchError((error) => {
              console.error('Load from server failed, trying fallback:', error);
              return http.get<{ products: any[] }>('/data.json').pipe(
                map((data) => transformRawToProducts(data.products || [])),
                tap((products) => patchState(store, { products, loaded: true, loading: false })),
                catchError((fallbackError) => {
                  console.error('Fallback failed:', fallbackError);
                  patchState(store, { error: fallbackError, loaded: true, loading: false });
                  return of([]);
                })
              );
            })
          )
        ),
        tap(() => patchState(store, { loading: true }))
      )
    ),
    createProduct: rxMethod<updateProduct>(
      pipe(
        switchMap((newProduct) => {
          const payload = buildCreatePayload(newProduct);
          return http.post<DataObject>(API_URL, payload).pipe(
            tap((createdProduct) => {
              const transformed = transformRawToProducts([createdProduct])[0];
              patchState(store, (state) => ({
                products: [...state.products, transformed],
              }));
            })
          );
        })
      )
    ),
    updateProduct: rxMethod<{ serverId: number | string; update: updateProduct }>(
      pipe(
        switchMap(({ serverId, update }) => {
          const currentProducts = store.products();
          const currentProduct = currentProducts.find((p) => p.id === serverId);
          const currentReleaseDate = currentProduct?.properties?.find(
            (p) => p.label === 'releaseDate'
          )?.value;

          const payload = buildUpdatePayload(serverId, update, currentReleaseDate);

          return http.put<DataObject>(`${API_URL}/${serverId}`, payload).pipe(
            tap((updatedProduct) => {
              const transformed = transformRawToProducts([updatedProduct])[0];
              patchState(store, (state) => ({
                products: state.products.map((p) => (p.id === serverId ? transformed : p)),
              }));
            })
          );
        })
      )
    ),
    clearError: () => patchState(store, { error: null }),
  })),
  withComputed(({ products }) => ({
    uniqueBrands: computed(() => {
      const brands = new Set<string>();
      products().forEach((product) => {
        const brand = getPropertyValue(product.properties || [], 'brand');
        if (brand) brands.add(String(brand));
      });
      return Array.from(brands).sort();
    }),

    priceRange: computed(() => {
      let min = Number.MAX_VALUE;
      let max = 0;
      products().forEach((product) => {
        const price = Number(getPropertyValue(product.properties || [], 'price'));
        if (!isNaN(price)) {
          min = Math.min(min, price);
          max = Math.max(max, price);
        }
      });
      return { min: min === Number.MAX_VALUE ? 0 : min, max: max === 0 ? 0 : max };
    }),

    dateRange: computed(() => {
      let min = new Date();
      let max = new Date('1900-01-01');
      let hasValidDate = false;

      products().forEach((product) => {
        const dateStr = getPropertyValue(product.properties || [], 'releaseDate');
        if (dateStr) {
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            hasValidDate = true;
            if (dateObj < min) min = dateObj;
            if (dateObj > max) max = dateObj;
          }
        }
      });

      if (!hasValidDate) return { min: new Date(), max: new Date() };
      return { min, max };
    }),
  })),
  withHooks(
    {
    onInit(store) {
      store.loadProducts();
    },
  }
  )
);
function transformRawToProducts(raw: any[]): DataObject[] {
  return raw.map((product) => ({
    key: product.key,
    id: product.id,
    label: getPropertyValue(product.properties, 'name') || `Product ${product.key}`,
    properties: product.properties || [],
  }));
}

function getPropertyValue(properties: Array<{ label: string; value: any }>, label: string): any {
  return properties?.find((p) => p.label === label)?.value ?? null;
}

function buildCreatePayload(newProduct: updateProduct): any {
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

function buildUpdatePayload(id: number | string, product: updateProduct, releaseDate?: any): any {
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

