import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { patchState} from '@ngrx/signals';
import { ProductService } from './services/product.service';
import { ProductStore } from './product-store';
import { ProductFilter } from './product-filter';
import { productList } from './product-list'
import { ActivatedRoute, Router } from '@angular/router';
import { ProductModel } from '../product/model/product.model';

type FilterState = {
  name: string;
  target: string[];
  query: string;
  min: string;
  max: string;
  type: string;
};

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [ProductFilter, productList],
  template: `
    <h1>Product ({{ productStore.productsCount() }})</h1>
    <ngrx-product-filter
      [query]="productStore.searchQuery()"
      [orderPrice]="productStore.sortOrder() ? productStore.sortOrder() : 'asc'"
      [orderName]="productStore.sortOrder() ? productStore.sortOrder() : 'asc'"
      [dateReleaseBegin]="productStore.rangeDateFilter().min"
      [dateReleaseEnd]="productStore.rangeDateFilter().max"
      [priceRangeMin]="productStore.rangePriceFilter().min"
      [priceRangeMax]="productStore.rangePriceFilter().max"
      [brandSelected]="productStore.brandFilter()"
      (queryChange)="productStore.updateQuery($event)"
      (orderPriceChange)="productStore.updateOrder('price', $event)"
      (orderNameChange)="productStore.updateOrder('name', $event)"
      (releaseDateChange)="productStore.updateReleaseDateRange($event[0], $event[1])"
      (priceRangeChange)="productStore.updatePriceRange($event[0], $event[1])"
      (brandSelectedChange)="productStore.updateBrand($event)"
    />
    <ngrx-pro-list
      [product]="productStore.filteredProducts()"
      [isLoading]="productStore.isLoading()"
    />
  `,
  providers: [ProductStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductComponent {
  readonly productService = inject(ProductService);
  readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  constructor() {
    effect(() => {
      const query = this.productStore.filter().find((f) => f.type === 'search')?.query;
      this.productStore.loadProducts(query || '');
      const filters = this.productStore.filter();

      const search = filters.find((f) => f.type === 'search')?.query || null;
      const brand = filters.find((f) => f.type === 'select')?.query || null;
      const price = filters.find((f) => f.type === 'priceRange');
      const date = filters.find((f) => f.type === 'dateRange');
      const sort = filters.find((f) => f.type === 'sort');

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          search: search,
          brand: brand,
          priceMin: price?.min || null,
          priceMax: price?.max || null,
          dateMin: date?.min || null,
          dateMax: date?.max || null,
          sort: sort?.target[0] || null,
          order: sort?.query || null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
    this.route.queryParams.subscribe((params) => {
      const current = this.productStore.filter();

      const newFilters = current.map((f): FilterState => {
        switch (f.type) {
          case 'search':
            return { ...f, query: params['search'] || '' };
          case 'select':
            return { ...f, query: params['brand'] || '' };
          case 'priceRange':
            return {
              ...f,
              min: params['priceMin'] || '',
              max: params['priceMax'] || '',
            };
          case 'dateRange':
            return {
              ...f,
              min: params['dateMin'] || '',
              max: params['dateMax'] || '',
            };
          case 'sort':
            return {
              ...f,
              target: params['sort'] ? [params['sort']] : ['price'],
              query: params['order'] === 'desc' ? 'desc' : 'asc',
            };
          default:
            return f;
        }
      });
      const query = newFilters.find((f) => f.type === 'search')?.query || '';
      this.productStore.loadProducts(query);
    });
  }
}
