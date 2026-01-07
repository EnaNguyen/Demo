import { computed, effect, inject } from '@angular/core';
import { debounceTime, distinctUntilChanged, pipe, range, switchMap, tap } from 'rxjs';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
  withHooks,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { ProductModel } from '../product/model/product.model';
import { ProductService } from './services/product.service';
import { Router } from 'express';

type FilterState = {
  name: string;
  target: string[];
  query: string;
  min: string;
  max: string;
  type: string;
};

type ProductSearchState = {
  products: ProductModel[];
  isLoading: boolean;
  filter: FilterState[];
};

const initialState: ProductSearchState = {
  products: [],
  isLoading: false,
  filter: [
    {
      name: 'Search',
      target: [],
      query: '',
      min: '',
      max: '',
      type: 'search',
    },
    {
      name: 'Price Sort',
      target: ['price'],
      query: 'asc',
      min: '',
      max: '',
      type: 'sort',
    },
    {
      name: 'Name Sort',
      target: ['name'],
      query: 'asc',
      min: '',
      max: '',
      type: 'sort',
    },
    {
      name: 'Date Range',
      target: [],
      query: '',
      min: '',
      max: '',
      type: 'dateRange',
    },
    {
      name: 'Price Range',
      target: [],
      query: '',
      min: '',
      max: '',
      type: 'priceRange',
    },
    {
      name: 'Brand',
      target: ['brand'],
      query: '',
      min: '',
      max: '',
      type: 'select',
    },
  ],
};

export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ products, filter }) => ({
    brands: computed(() => {
      const brandSet = new Set<string>();
      products().forEach((product) => brandSet.add(product.brand));
      return Array.from(brandSet);
    }),
    searchQuery: computed(() => filter().find((f) => f.type === 'search')?.query ?? ''),
    sortOrder: computed(() => filter().find((f) => f.type === 'sort')?.query ?? 'asc'),
    rangeDateFilter: computed(() => {
      const dateFilter = filter().find((f) => f.type === 'dateRange');
      return {
        min: dateFilter?.min ?? '',
        max: dateFilter?.max ?? '',
      };
    }),
    rangePriceFilter: computed(() => {
      const priceFilter = filter().find((f) => f.type === 'priceRange');
      return {
        min: priceFilter?.min ?? '',
        max: priceFilter?.max ?? '',
      };
    }),
    brandFilter: computed(() => {
      const brandFilter = filter().find((f) => f.type === 'select');
      return brandFilter?.query ?? '';
    }),
    filteredProducts: computed(() => {
      let filtered = [...products()];
      const dateFilter = filter().find((f) => f.type === 'dateRange');
      if (dateFilter && dateFilter.min && dateFilter.max) {
        filtered = filtered.filter((product) => {
          return product.releaseDate >= dateFilter.min && product.releaseDate <= dateFilter.max;
        });
      }
      const priceFilter = filter().find((f) => f.type === 'priceRange');
      if (priceFilter && priceFilter.min && priceFilter.max) {
        filtered = filtered.filter((product) => {
          return (
            product.price >= parseFloat(priceFilter.min) &&
            product.price <= parseFloat(priceFilter.max)
          );
        });
      }
      const brandFilter = filter().find((f) => f.type === 'select');
      if (brandFilter && brandFilter.query) {
        filtered = filtered.filter((product) => product.brand === brandFilter.query);
      }
      const sortFilter = filter().find((f) => f.type === 'sort');
      const direction = sortFilter?.query === 'asc' ? 1 : -1;
      if (sortFilter && sortFilter.target[0]) {
        const target = sortFilter.target[0];
        filtered = filtered.toSorted((a: ProductModel, b: ProductModel) => {
          if (target === 'name') {
            return direction * a.name.localeCompare(b.name);
          }
          if (target === 'price') {
            return direction * (a.price - b.price);
          }
          return 0;
        });
      }

      return filtered;
    }),
  })),
  withComputed((store) => ({
    productsCount: computed(() => store.filteredProducts().length),
  })),
  withMethods((store, productService = inject(ProductService)) => ({
    loadProducts: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) => {
          return productService.searchBooks(query).pipe(
            tapResponse(
              (products) => {
                patchState(store, { products, isLoading: false });
              },
              (error: any) => {
                console.error('Error loading products:', error);
                patchState(store, { isLoading: false });
              }
            )
          );
        })
      )
    ),
    updateQuery(query: string): void {
      patchState(store, (state) => ({
        filter: state.filter.map((f) => (f.type === 'search' ? { ...f, query } : f)),
      }));
    },
    updateOrder(target: 'price' | 'name', order: 'asc' | 'desc'): void {
      patchState(store, (state) => ({
        filter: state.filter.map((f) =>
          f.type === 'sort' ? { ...f, target: [target], query: order } : f
        ),
      }));
    },
    updateReleaseDateRange(min: string, max: string): void {
      console.log('Updating date range:', min, max);
      patchState(store, (state) => ({
        filter: state.filter.map((f) => (f.type === 'dateRange' ? { ...f, min, max } : f)),
      }));
    },
    updatePriceRange(min: string, max: string): void {
      console.log('Updating price range:', min, max);
      patchState(store, (state) => ({
        filter: state.filter.map((f) => (f.type === 'priceRange' ? { ...f, min, max } : f)),
      }));
    },
    updateBrand(brand: string): void {
      patchState(store, (state) => ({
        filter: state.filter.map((f) => (f.type === 'select' ? { ...f, query: brand } : f)),
      }));
    },
  }))
);
