import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  FilterGroup,
  DataInput,
  DataObject,
  FilterOption,
} from '../../../shared/type/filter/filter';
import {
  onFilterSelect,
  parseUrlFilters,
  buildUrlFromFilters,
  applyUrlChanges,
} from '../../../shared/pipe/hooks/onFilterSelect';
import { FilterWrapperComponent } from '../../../shared/components/ui/organisms/filter/filter-wrapper';
import { ProductStore } from '../../../shared/pipe/contexts/productContext';
import { I18nService } from '../../../shared/services/i18n.service';
import { TranslatePipe } from './../../../shared/pipe/translate/translate.pipe';
@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, FilterWrapperComponent, TranslatePipe],
  templateUrl: '../products/products.html',
  styleUrls: ['../products/products.css'],
})
export class ProductComponent implements OnInit, OnDestroy {
  private productStore = inject(ProductStore);
  products = this.productStore.products;
  uniqueBrands = this.productStore.uniqueBrands;
  priceRange = this.productStore.priceRange;
  dateRange = this.productStore.dateRange;
  filteredProducts = signal<DataObject[]>([]);
  filterResult: any = null;
  brands: string[] = [];
  currentPage = signal(1);
  pageSize = signal(5);
  pageSizeOptions: number[] = [1, 5, 10, 20];
  totalItems = computed(() => this.filteredProducts().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);
  displayedProducts = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return this.filteredProducts().slice(startIndex, endIndex);
  });

  filterConfig = signal<FilterGroup>({
    label: 'Product Filters',
    DataInput: { dataSource: [] },
    request: [],
  });

  showFilter = signal(false);
  dropdownOpenId = signal<string | null>(null);
  Math = Math;
  private destroy$ = new Subject<void>();
  private isInitialLoad = true;
  private hasUrlParams = false;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.hasUrlParams = Object.keys(params).length > 0;
    });

    effect(() => {
      const products = this.products();
      if (products.length > 0) {
        this.initializeFilters(products);
      }
    });
  }

  ngOnInit(): void {
    this.productStore.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFilter(): void {
    this.showFilter.update((show) => !show);
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  listenToUrlChanges(): void {
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.applyFiltersFromUrl(params);
    });
  }

  private initializeFilters(products: DataObject[]): void {
    const brands = this.uniqueBrands();
    const priceRange = this.priceRange();
    const dateRange = this.dateRange();

    const config: FilterGroup = {
      label: 'Product Filters',
      DataInput: { dataSource: products },
      request: [
        {
          title: 'Brand (Checkbox)',
          type: 'checkbox',
          target: 'brand',
          request: { type: 'string', value: brands, selected: [] },
        },
        {
          title: 'Price Range',
          type: 'range',
          target: 'price',
          request: { type: 'number', range: { min: priceRange.min, max: priceRange.max } },
        },
        {
          title: 'Release Date',
          type: 'range',
          target: 'releaseDate',
          request: { type: 'date', range: { min: dateRange.min, max: dateRange.max } },
        },
        {
          title: 'Search (Name)',
          type: 'search',
          target: 'label', 
          request: { type: 'string', value: '' },
        },
      ],
    };

    this.filterConfig.set(config);
  
    if (!this.hasUrlParams) {
      this.applyFilter();
    }
  }
  applyFilter(): void {
    const config = this.filterConfig();
    try {
      const filterResult = onFilterSelect(config);
      const filteredKeys = filterResult.results.key;

      this.filteredProducts.set(
        this.products().filter((p) => filteredKeys.includes(p.key as string | number))
      );
      
      this.currentPage.set(1);

      if (!this.isInitialLoad) {
        const queryParams = buildUrlFromFilters(config);
        queryParams['page'] = 1;
        queryParams['pageSize'] = this.pageSize();
        const cleanedParams = this.cleanDefaultQueryParams(queryParams);
        applyUrlChanges(cleanedParams, this.router, this.activatedRoute);
      }
      this.isInitialLoad = false;
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  }

  private cleanDefaultQueryParams(queryParams: any): any {
    const priceParam = 'pricerange';
    if (
      queryParams[priceParam + 'Min'] == this.priceRange().min &&
      queryParams[priceParam + 'Max'] == this.priceRange().max
    ) {
      delete queryParams[priceParam + 'Min'];
      delete queryParams[priceParam + 'Max'];
    }

    const dateParam = 'releasedate';
    const fullDateMin = this.dateRange().min.toISOString().split('T')[0];
    const fullDateMax = this.dateRange().max.toISOString().split('T')[0];
    if (
      queryParams[dateParam + 'Min'] === fullDateMin &&
      queryParams[dateParam + 'Max'] === fullDateMax
    ) {
      delete queryParams[dateParam + 'Min'];
      delete queryParams[dateParam + 'Max'];
    }
    if (queryParams['page'] == 1) {
      delete queryParams['page'];
    }
    if (queryParams['pageSize'] == 5) {
      delete queryParams['pageSize'];
    }

    return queryParams;
  }

  applyFiltersFromUrl(params: any): void {
    if (!this.filterConfig().request || this.filterConfig().request.length === 0) {
      return;
    }

    this.filterConfig.update((currentConfig) => {
      const newRequest = currentConfig.request.map((option) => {
        const paramName = option.title.toLowerCase().replace(/\s+/g, '');
        let newOption = { ...option };
        let newReq = { ...option.request };

        try {
          switch (option.type) {
            case 'checkbox': {
              const paramValue = params[paramName];
              if (paramValue) {
                const values = Array.isArray(paramValue)
                  ? paramValue
                  : paramValue.split(',').map((v: string) => {
                      const num = Number(v);
                      return isNaN(num) ? v.trim() : num;
                    });
                newReq.selected = values;
              } else {
                newReq.selected = [];
              }
              break;
            }
            case 'select':
            case 'radio': {
              const paramValue = params[paramName];
              if (paramValue !== undefined) {
                const num = Number(paramValue);
                newReq.selected = isNaN(num) ? paramValue : num;
              }
              break;
            }
            case 'range': {
              const minParam = paramName + 'Min';
              const maxParam = paramName + 'Max';
              const min = params[minParam];
              const max = params[maxParam];

              if (min !== undefined && max !== undefined) {
                if (option.request.type === 'number') {
                  newReq.range = { min: Number(min), max: Number(max) };
                } else if (option.request.type === 'date') {
                  newReq.range = { min: new Date(min), max: new Date(max) };
                }
              }
              break;
            }
            case 'search': {
              const paramValue = params[paramName];
              if (paramValue) {
                newReq.value = paramValue;
              }
              break;
            }
          }
        } catch (error) {
          console.error(`Error parsing filter '${option.title}':`, error);
        }

        newOption.request = newReq;
        return newOption;
      });

      return { ...currentConfig, request: newRequest };
    });

    const pageFromUrl = Number(params['page']) || 1;
    const pageSizeFromUrl = Number(params['pageSize']) || 5;
    
    this.currentPage.set(pageFromUrl);
    this.pageSize.set(pageSizeFromUrl);

    const hasParams = Object.keys(params).length > 0;
    if (hasParams) {
      this.applyFilter();
    }
  }

  onFilterChange(event: any): void {
    this.filterConfig.update((currentConfig) => {
      const newRequest = [...currentConfig.request];
      const filterIndex = newRequest.findIndex((f) => f.title === event.title);

      if (filterIndex === -1) return currentConfig;

      const updatedFilter = { ...newRequest[filterIndex] };
      const updatedRequest = { ...updatedFilter.request };

      if (event.type === 'range') {
        updatedRequest.range = event.range;
      } else if (event.type === 'checkbox' || event.type === 'select' || event.type === 'radio') {
        updatedRequest.selected = event.value;
      } else {
        updatedRequest.value = event.value;
      }

      updatedFilter.request = updatedRequest;
      newRequest[filterIndex] = updatedFilter;

      return { ...currentConfig, request: newRequest };
    });

    this.applyFilter();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
    }
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize.set(newPageSize);
    this.currentPage.set(1);
  }

  getPropertyValue(product: DataObject, propertyLabel: string): any {
    const property = product.properties?.find((p) => p.label === propertyLabel);
    return property ? property.value : null;
  }
  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
  }
  getProductQuantity(product: DataObject): number {
    const quantity = this.getPropertyValue(product, 'quantity');
    return quantity ? Number(quantity) : 0;
  }
  getProductStatus(product: DataObject): string {
    const quantity = this.getProductQuantity(product);
    const status = this.getPropertyValue(product, 'status');
    if (status == 1) {
      if (quantity === 0) return 'Hết hàng';
      if (quantity < 10) return 'Sắp hết';
      return 'Còn hàng';
    }
    return 'Ngừng Kinh Doanh';
  }
  getStatusClass(product: DataObject): string {
    const status = this.getProductStatus(product);
    if (status === 'Hết hàng') return 'status-out';
    if (status === 'Sắp hết') return 'status-low';
    if (status === 'Ngừng Kinh Doanh') return 'status-unvailable';
    return 'status-available';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  viewDetail(product: DataObject): void {
    console.log('Viewing details for product:', product);
    this.router.navigate(['products', product.key]);
  }
}