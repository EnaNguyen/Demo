import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  FilterGroup,
  DataInput,
  DataObject,
  FilterOption,
} from '../../../shared/type/filter/filter';
import { onFilterSelect, parseUrlFilters } from '../../../shared/pipe/hooks/onFilterSelect';
import { FilterWrapperComponent } from '../../../shared/components/ui/organisms/filter/filter-wrapper';
import { ProductContext } from '../../../shared/pipe/contexts/productContext';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, FilterWrapperComponent],
  templateUrl: '../products/products.html',
  styleUrls: ['../products/products.css'],
  providers: [ProductContext],
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
  
  // Filter toggle state
  showFilter: boolean = false;
  
  Math = Math;
  private destroy$ = new Subject<void>();

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

  /**
   * Toggle filter visibility
   */
  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  /**
   * Handle image loading error
   */
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

    this.productContext.getUniqueBrands().subscribe((brands) => {
      this.brands = brands;
    });

    this.productContext.getPriceRange().subscribe((range) => {
      this.priceRange = range;
    });

    this.productContext.getDateRange().subscribe((range) => {
      this.dateRange = range;
    });

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
            value: this.brands.slice(0, 2), 
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
        {
          title: 'Pagination',
          type: 'page',
          target: 'pagination',
          request: {
            type: 'number',
            page: this.currentPage,
            pageSize: this.pageSize,
          },
        },
      ],
    };

    this.applyFilter();
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

      // Update URL with current filter state
      this.updateUrlWithFilters();

      
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  }

  applyFiltersFromUrl(params: any): void {
    if (!this.filterConfig.request || this.filterConfig.request.length === 0) {
      return;
    }

    parseUrlFilters(params, this.filterConfig);
    this.applyFilter();
  }

  updateUrlWithFilters(): void {
    const queryParams: any = {};

    for (let option of this.filterConfig.request) {
      const paramName = option.title.toLowerCase().replace(/\s+/g, '');

      switch (option.type) {
        case 'checkbox': {
          const values = option.request.value as Array<string | number | boolean>;
          if (values && Array.isArray(values) && values.length > 0) {
            queryParams[paramName] = values.join(',');
          }
          break;
        }
        case 'range': {
          const rqType = option.request.type;
          const range = option.request.range as any;
          if (rqType === 'number') {
            queryParams[paramName + 'Min'] = range.min;
            queryParams[paramName + 'Max'] = range.max;
          } else {
            const minDate = new Date(range.min);
            const maxDate = new Date(range.max);
            queryParams[paramName + 'Min'] = minDate.toISOString().split('T')[0];
            queryParams[paramName + 'Max'] = maxDate.toISOString().split('T')[0];
          }
          break;
        }
        case 'search': {
          const value = option.request.value as string;
          if (value) {
            queryParams[paramName] = value;
          }
          break;
        }
        case 'page': {
          queryParams['page'] = option.request.page;
          queryParams['pageSize'] = option.request.pageSize;
          break;
        }
      }
    }
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });
  }

  onFilterChange(event: any): void {
    
    const filterIndex = this.filterConfig.request.findIndex(
      (f) => f.title === event.title
    );
    
    if (filterIndex !== -1) {
      if (event.type === 'range') {
        this.filterConfig.request[filterIndex].request.range = event.range;
      } else if (event.type === 'page') {
        this.currentPage = event.page;
        this.pageSize = event.pageSize;
        this.filterConfig.request[filterIndex].request.page = event.page;
        this.filterConfig.request[filterIndex].request.pageSize = event.pageSize;
      } else {
        this.filterConfig.request[filterIndex].request.value = event.value;
      }
      if (event.type !== 'page') {
        this.currentPage = 1;
        const pageFilterIndex = this.filterConfig.request.findIndex(
          (f) => f.type === 'page'
        );
        if (pageFilterIndex !== -1) {
          this.filterConfig.request[pageFilterIndex].request.page = 1;
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
      this.updateFilterPageAndApply();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateFilterPageAndApply();
    }
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.currentPage = 1;
    this.calculateTotalPages();
    this.updateFilterPageAndApply();
  }

  private updateFilterPageAndApply(): void {
    const pageFilterIndex = this.filterConfig.request.findIndex(
      (f) => f.type === 'page'
    );
    if (pageFilterIndex !== -1) {
      this.filterConfig.request[pageFilterIndex].request.page = this.currentPage;
      this.filterConfig.request[pageFilterIndex].request.pageSize = this.pageSize;
    }
    this.applyFilter();
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  viewDetail(product: DataObject): void {
    alert(`Chi tiết sản phẩm ${product.label}`);
  }
}