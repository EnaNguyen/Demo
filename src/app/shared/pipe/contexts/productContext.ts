import {
  signalStore,
  withState,
  withMethods,
  patchState,
  withComputed,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Injectable, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, pipe, switchMap, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Product {
  id: number;
  key?: string;
  name: string;
  description: string;
  releaseDate: string;
  brand: string;
  price: number;
  quantity: number;
  status: number;
  img: string | null;
}

type ProductState = {
  products: Product[];
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

const API_URL = environment.apiUrl + '/Product';

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          http.get<Product[]>(`${API_URL}/ProductList`).pipe(
            map((products) => products || []),
            tap((products) =>
              patchState(store, {
                products,
                loaded: true,
                loading: false,
              })
            ),
            catchError((error) => {
              console.error('Load products failed:', error);
              patchState(store, {
                error,
                loaded: true,
                loading: false,
              });
              return of([]);
            })
          )
        )
      )
    ),
    createProduct: rxMethod<Product>(
      pipe(
        switchMap((newProduct) =>
          http.post<Product>(API_URL, newProduct).pipe(
            tap((created) => {
              patchState(store, (state) => ({
                products: [...state.products, created],
              }));
            })
          )
        )
      )
    ),
    updateProduct: rxMethod<{ id: number; update: Partial<Product> }>(
      pipe(
        switchMap(({ id, update }) =>
          http.put<Product>(`${API_URL}/${id}`, update).pipe(
            tap((updated) => {
              patchState(store, (state) => ({
                products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
              }));
            })
          )
        )
      )
    ),
    clearError: () => patchState(store, { error: null }),
  })),
  withComputed(({ products }) => ({
    uniqueBrands: computed(() => {
      const brands = new Set<string>();
      products().forEach((p) => {
        if (p.brand) brands.add(p.brand);
      });
      return Array.from(brands).sort();
    }),

    priceRange: computed(() => {
      const prices = products()
        .map((p) => p.price)
        .filter((price) => typeof price === 'number' && !isNaN(price));

      if (prices.length === 0) return { min: 0, max: 0 };

      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    }),

    dateRange: computed(() => {
      const dates = products()
        .map((p) => (p.releaseDate ? new Date(p.releaseDate) : null))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

      if (dates.length === 0) {
        return { min: new Date(), max: new Date() };
      }

      return {
        min: new Date(Math.min(...dates.map((d) => d.getTime()))),
        max: new Date(Math.max(...dates.map((d) => d.getTime()))),
      };
    }),
  })),

  withHooks({
    onInit(store) {
      store.loadProducts();
    },
  })
);
export function getProductImageUrl(product: Product): string {
  return product.img || ''
}
