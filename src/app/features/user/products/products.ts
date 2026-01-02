import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { onFilterSelect, parseUrlFilters, buildUrlFromFilters, applyUrlChanges } from '../../../shared/pipe/hooks/onFilterSelect';
import { FilterWrapperComponent } from '../../../shared/components/ui/organisms/filter/filter-wrapper';
import { ProductContext } from '../../../shared/pipe/contexts/productContext';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, FilterWrapperComponent],
  templateUrl: '../products/products.html',
  styleUrls: ['../products/products.css'],
})
export class ProductComponent implements OnInit, OnDestroy {
  products: DataObject[] = [];
  filteredProducts: DataObject[] = [];
  displayedProducts: DataObject[] = [];
  
  filterConfig: FilterGroup = {
    label: 'Product Filters',
    DataInput: { dataSource: [] },
    request: []
  };
  
  filterResult: any = null;
  brands: string[] = [];
  priceRange: { min: number; max: number } = { min: 0, max: 0 };
  dateRange: { min: Date; max: Date } = { min: new Date(), max: new Date() };

  currentPage: number = 1;
  pageSize: number = 5;
  pageSizeOptions: number[] = [1, 5, 10, 20];
  totalItems: number = 0;
  totalPages: number = 0;

  showFilter: boolean = false;
  
  Math = Math;
  private destroy$ = new Subject<void>();
  private isInitialLoad = true;

  constructor(
    private productContext: ProductContext,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.productContext.products$.subscribe((products) => {
      this.products = products;
      this.initializeFilters();
      this.listenToUrlChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  listenToUrlChanges(): void {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.applyFiltersFromUrl(params);
      });
  }

  initializeFilters(): void {
    if (this.products.length === 0) return;

    combineLatest([
      this.productContext.getUniqueBrands(),
      this.productContext.getPriceRange(),
      this.productContext.getDateRange()
    ]).subscribe(([brands, priceRange, dateRange]) => {
      this.brands = brands;
      this.priceRange = priceRange;
      this.dateRange = dateRange;

      this.filterConfig = {
        label: 'Product Filters',
        DataInput: {
          dataSource: this.products,
        },
        request: [
          {
            title: 'Brand (Checkbox)',
            type: 'checkbox',
            target: 'brand',
            request: {
              type: 'string',          
              value: this.brands,
              selected: []
            },
          },
          {
            title: 'Price Range',
            type: 'range',
            target: 'price',
            request: {
              type: 'number',
              range: { min: this.priceRange.min, max: this.priceRange.max },
            },
          },
          {
            title: 'Release Date',
            type: 'range',
            target: 'releaseDate',
            request: {
              type: 'date',
              range: { min: this.dateRange.min, max: this.dateRange.max },
            },
          },
          {
            title: 'Search (Name)',
            type: 'search',
            target: 'name',
            request: {
              type: 'string',
              value: '',
            },
          },
        ],
      };

      this.applyFilter();
    });
  }

  applyFilter(): void {
    try {

      this.filterResult = onFilterSelect(this.filterConfig);
      
      const filteredKeys = this.filterResult.results.key;

      this.filteredProducts = this.products.filter((p) =>
        filteredKeys.includes(p.key as string | number)
      );


      this.totalItems = this.filteredProducts.length;
      this.calculateTotalPages();
      this.updateDisplayedProducts();

      if (!this.isInitialLoad) {
        let queryParams = buildUrlFromFilters(this.filterConfig);
        queryParams = this.cleanDefaultQueryParams(queryParams);
        applyUrlChanges(queryParams, this.router, this.activatedRoute);
      }
      this.isInitialLoad = false;
      
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  }

  private cleanDefaultQueryParams(queryParams: any): any {
    const priceParam = 'pricerange';
    if (queryParams[priceParam + 'Min'] == this.priceRange.min && queryParams[priceParam + 'Max'] == this.priceRange.max) {
      delete queryParams[priceParam + 'Min'];
      delete queryParams[priceParam + 'Max'];
    }

    const dateParam = 'releasedate';
    const fullDateMin = this.dateRange.min.toISOString().split('T')[0];
    const fullDateMax = this.dateRange.max.toISOString().split('T')[0];
    if (queryParams[dateParam + 'Min'] === fullDateMin && queryParams[dateParam + 'Max'] === fullDateMax) {
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
    if (!this.filterConfig.request || this.filterConfig.request.length === 0) {
      return;
    }

    parseUrlFilters(params, this.filterConfig);
    this.applyFilter();
  }

  onFilterChange(event: any): void {
    
    const filterIndex = this.filterConfig.request.findIndex(
      (f) => f.title === event.title
    );
    
    if (filterIndex !== -1) {
      if (event.type === 'range') {
        this.filterConfig.request[filterIndex].request.range = event.range;
      } else {
        if (event.type === 'checkbox' || event.type === 'select' || event.type === 'radio') {
          this.filterConfig.request[filterIndex].request.selected = event.value;
        } else {
          this.filterConfig.request[filterIndex].request.value = event.value;
        }
      }

      this.applyFilter();
    }
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  updateDisplayedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedProducts();
    }
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.currentPage = 1;
    this.calculateTotalPages();
    this.updateDisplayedProducts();
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
    return 'Ngừng Kinh Doanh'
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