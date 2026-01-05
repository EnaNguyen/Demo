import { Component, OnInit, OnDestroy, ViewChild, inject, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormatPricePipe } from '../../../shared/pipe/format/formatPrice.pipe';
import { FormatDatePipe } from '../../../shared/pipe/format/formatDate.pipe';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UpdateProductComponent } from '../../../shared/components/ui/templates/modal/product/updateProduct/updateProduct';
import { CreateProductComponent } from '../../../shared/components/ui/templates/modal/product/createProduct/createProduct';
import { ReactiveFormsModule } from '@angular/forms';
import { DataObjectUpdate, updateProduct } from '../../../shared/data/updateModels/product/product';

@Component({
  selector: 'app-admin-product',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    FilterWrapperComponent,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    UpdateProductComponent,
    CreateProductComponent,
    FormatPricePipe,
    FormatDatePipe,
  ],
  templateUrl: './product.html',
  styleUrls: ['./product.css'],
})
export class ProductComponent implements OnInit, OnDestroy {
  private productStore = inject(ProductStore);
  
  products = this.productStore.products;        
  uniqueBrands = this.productStore.uniqueBrands; 
  priceRange = this.productStore.priceRange;     
  dateRange = this.productStore.dateRange;       

  filteredProducts = signal<DataObject[]>([]);
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
  
  @ViewChild(UpdateProductComponent) updateProductModal!: UpdateProductComponent;
  @ViewChild(CreateProductComponent) createProductModal!: CreateProductComponent;
  
  private destroy$ = new Subject<void>();
  private isInitialLoad = true;
  private hasUrlParams = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
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
        this.products().filter((p) =>
          filteredKeys.includes(p.key as string | number)
        )
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

  applyFiltersFromUrl(params: any): void {
    if (!this.filterConfig().request || this.filterConfig().request.length === 0) {
      return;
    }

    const hasParams = Object.keys(params).length > 0;
    
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

    this.currentPage.set(Number(params['page']) || 1);
    this.pageSize.set(Number(params['pageSize']) || 5);
    if (hasParams) {
      this.applyFilter();
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

  onFilterChange(event: any): void {
    const filterIndex = this.filterConfig().request.findIndex((f) => f.title === event.title);

    if (filterIndex !== -1) {
      const updatedRequest = [...this.filterConfig().request];
      if (event.type === 'range') {
        updatedRequest[filterIndex].request.range = event.range;
      } else {
        if (event.type === 'checkbox' || event.type === 'select' || event.type === 'radio') {
          updatedRequest[filterIndex].request.selected = event.value;
        } else {
          updatedRequest[filterIndex].request.value = event.value;
        }
      }
      this.filterConfig.update(config => ({ ...config, request: updatedRequest }));
      this.applyFilter();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getProductImage(product: DataObject): string {
    const imageUrl = this.getPropertyValue(product, 'imageUrl');
    return imageUrl || '/assets/placeholder.png';
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

  editProduct(product: DataObject): void {
    if (this.updateProductModal) {
      this.updateProductModal.editProduct(product as any);
    }
  }

  openCreateModal(): void {
    if (this.createProductModal) {
      this.createProductModal.openModal();
    }
  }

  toggleDropdown(productId: string | number): void {
    const id = String(productId);
    this.dropdownOpenId.update(openId => openId === id ? null : id);
  }

  closeDropdown(): void {
    this.dropdownOpenId.set(null);
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }

  toggleFilter(): void {
    this.showFilter.update(show => !show);
  }

  toggleProductStatus(product: DataObject): void {
    const currentStatus = Number(this.getPropertyValue(product, 'status'));
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    const updatedProduct: updateProduct = {
      id: product.id as number,
      name: this.getPropertyValue(product, 'name'),
      brand: this.getPropertyValue(product, 'brand'),
      quantity: this.getProductQuantity(product),
      status: newStatus,
      price: this.getPropertyValue(product, 'price'),
      imageUrl: this.getProductImage(product),
      description: this.getPropertyValue(product, 'description'),
    };

    this.productStore.updateProduct({ serverId: product.id as string | number, update: updatedProduct });
  }
}