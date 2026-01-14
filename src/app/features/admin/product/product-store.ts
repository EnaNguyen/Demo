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
import { updateProduct } from '../product/model/product.model';
import { HttpClient } from '@angular/common/http';
import { DataObject } from './model/product.model';
import { Data } from '@angular/router';
import { access } from 'fs';
import { Store } from '@ngrx/store';
import { compileFunction } from 'vm';
import { environment } from '../../../../environments/environment.development';
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
  activeSortTarget: string;
  pageNumber: number;
  itemPerPage: number;
};

const initialState: ProductSearchState = {
  products: [],
  isLoading: false,
  activeSortTarget: '',
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
  pageNumber: 1,
  itemPerPage: 10,
};
const API_URL = `${environment.apiUrl}/Product`;
export const ProductStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ products, filter, activeSortTarget }) => ({
    brands: computed(() => {
      const brandSet = new Set<string>();
      products().forEach((product) => brandSet.add(product.brand));
      return Array.from(brandSet);
    }),
    searchQuery: computed(() => filter().find((f) => f.type === 'search')?.query ?? ''),
    sortOrder: computed(() => filter().find((f) => f.type === 'sort')?.query ?? 'asc'),
    sortNameOrder: computed(() => {
      const sortFilter = filter().find((f) => f.type === 'sort' && f.target[0] === 'name');
      return sortFilter?.query ?? 'asc';
    }),
    sortPriceOrder: computed(() => {
      const sortFilter = filter().find((f) => f.type === 'sort' && f.target[0] === 'price');
      return sortFilter?.query ?? 'asc';
    }),
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

      if (sortFilter) {
        const currentTarget = activeSortTarget() as string;
        const direction = sortFilter.query === 'asc' ? 1 : -1;

        filtered = filtered.toSorted((a: ProductModel, b: ProductModel) => {
          if (currentTarget === 'name') {
            return direction * a.name.localeCompare(b.name);
          }
          if (currentTarget === 'price') {
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
  withComputed((store) => ({
    totalPages: computed(() => {
      const totalItems = store.productsCount();
      const itemsPerPage = store.itemPerPage();
      return Math.ceil(totalItems / itemsPerPage) || 1;
    }),
    paginationProduct: computed(() => {
      const startIndex = (store.pageNumber() - 1) & store.itemPerPage();
      const endIndex = startIndex + store.itemPerPage();
      store.filteredProducts().slice(startIndex, endIndex);
      return store.filteredProducts().slice(startIndex, endIndex);
    }),
  })),

  withMethods((store, productService = inject(ProductService), http = inject(HttpClient)) => ({
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
    updateNameOrder(order: 'asc' | 'desc'): void {
      patchState(store, (state) => ({
        activeSortTarget: 'name',
        filter: state.filter.map((f) =>
          f.type === 'sort' && f.target[0] === 'name' ? { ...f, query: order } : f
        ),
      }));
    },
    updatePriceOrder(order: 'asc' | 'desc'): void {
      patchState(store, (state) => ({
        activeSortTarget: 'price',
        filter: state.filter.map((f) =>
          f.type === 'sort' && f.target[0] === 'price' ? { ...f, query: order } : f
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
    updatePageNumber(pageNumber: number): void {
      const total = store.totalPages();
      const validPage = Math.max(1, Math.min(pageNumber, total));
      patchState(store, { pageNumber: validPage });
    },
    updateItemsPerPage(itemPerPage: number): void {
      patchState(store, { itemPerPage, pageNumber: 1 });
    },
    nextPage(): void {
      if (store.pageNumber() < store.totalPages()) {
        patchState(store, { pageNumber: store.pageNumber() + 1 });
      }
    },
    previousPage(): void {
      if (store.pageNumber() >= 2) {
        patchState(store, { pageNumber: store.pageNumber() - 1 });
      }
    },
    createProduct: rxMethod<updateProduct>(
      pipe(
        switchMap((newProduct) => {
          const mappingData = productService.buildCreatePayload(newProduct);
          console.log('Create Payload:', mappingData);
          const createUrl = `${API_URL}/AddNewProduct`;
          return http.post<DataObject>(createUrl, mappingData).pipe(
            tapResponse(
              (createdProduct) => {
                console.log('Created Product:', createdProduct);
                const newProductModel: ProductModel =
                  productService.transformToProductModel(createdProduct);
                patchState(store, (state) => ({
                  products: [...state.products, newProductModel],
                }));
              },
              (error: any) => {
                console.error('Error creating product:', error);
              }
            )
          );
        })
      )
    ),
    updateProduct: rxMethod<{ id: string; product: updateProduct }>(
      pipe(
        switchMap(({ id, product }) => {
          const payload = {
            name: product.name,
            description: product.description,
            brand: product.brand,
            status: product.status,
            price: product.price,
            quantity: product.quantity,
            image: product.imageUrl ? product.imageUrl : product.imageLocate,
          };
          console.log('Update Payload:', payload);
          return http.put<DataObject>(`${API_URL}/EditProduct?id=${id}`, payload ).pipe(
            tapResponse(
              (updatedProduct) => {
                const transformed = productService.transformRawToProducts([updatedProduct])[0];
                patchState(store, (state) => ({
                  products: state.products.map((p) => (p.id === id ? transformed : p)),
                }));
              },
              (error: any) => {
                console.error('Error updating product:', error);
              }
            )
          );
        })
      )
    ),
    updateStatus: rxMethod<{ id: string }>(
      pipe(
        switchMap(({ id }) => {
          const currentProducts = store.products();
          const currentProduct = currentProducts.find((p) => p.id === id) as ProductModel;
          const updateData = productService.statusUpdate(id, currentProduct);
          return http.put<DataObject>(`${API_URL}/${id}`, updateData).pipe(
            tap((updatedProduct) => {
              const transformed = productService.transformRawToProducts([updatedProduct])[0];
              patchState(store, (state) => ({
                products: state.products.map((p) => (p.id === id ? transformed : p)),
              }));
            })
          );
        })
      )
    ),
  }))
);
