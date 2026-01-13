import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductStore } from '../../admin/product/product-store';
import { ProductModel } from '../../admin/product/model/product.model';
import { FormatPricePipe } from '../../../shared/pipe/format/formatPrice.pipe';
import { FormatDatePipe } from '../../../shared/pipe/format/formatDate.pipe';
import { ProductFilter } from '../../admin/product/product-filter';
import { TranslatePipe } from '../../../shared/pipe/translate/translate.pipe';
@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormatPricePipe, FormatDatePipe, ProductFilter, TranslatePipe],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class ProductComponent {
  private productStore = inject(ProductStore);
  private router = inject(Router);
  readonly Math = Math;
  products = this.productStore.paginationProduct;
  totalPages = this.productStore.totalPages;
  pageNumber = this.productStore.pageNumber;
  itemPerPage = this.productStore.itemPerPage;
  isLoading = this.productStore.isLoading;
  brands = this.productStore.brands;
  searchQuery = this.productStore.searchQuery;
  sortPriceOrder = this.productStore.sortPriceOrder;
  sortNameOrder = this.productStore.sortNameOrder;
  rangeDateFilter = this.productStore.rangeDateFilter;
  rangePriceFilter = this.productStore.rangePriceFilter;
  brandFilter = this.productStore.brandFilter;
  currentPage = computed(() => this.pageNumber());
  itemsPerPage = computed(() => this.itemPerPage());
  productsCount = computed(() => this.productStore.productsCount());
  constructor() {
     const query = this.productStore.filter().find((f) => f.type === 'search')?.query;
      this.productStore.loadProducts(query || '');
  }
  getProductImage(product: ProductModel): string {
    return product.imageUrl || '/assets/images/no-product.jpg';
  }
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/no-product.jpg';
    img.onerror = null;
  }

  getStatusText(product: ProductModel): string {
    if (product.status !== '1') return 'Ngừng kinh doanh';
    if (product.quantity === 0) return 'Hết hàng';
    if (product.quantity < 10) return 'Sắp hết';
    return 'Còn hàng';
  }

  getStatusClass(product: ProductModel): string {
    if (product.status !== '1') return 'status-unavailable';
    if (product.quantity === 0) return 'status-out';
    if (product.quantity < 10) return 'status-low';
    return 'status-available';
  }

  viewDetail(product: ProductModel): void {
    this.router.navigate(['/products', product.id]);
  }
  onQueryChange(query: string): void {
    this.productStore.updateQuery(query);
  }

  onOrderPriceChange(order: 'asc' | 'desc'): void {
    this.productStore.updatePriceOrder(order);
  }

  onOrderNameChange(order: 'asc' | 'desc'): void {
    this.productStore.updateNameOrder(order);
  }

  onReleaseDateChange(dates: string[]): void {
    if (dates && dates.length === 2) {
      this.productStore.updateReleaseDateRange(dates[0], dates[1]);
    }
  }

  onPriceRangeChange(prices: string[]): void {
    if (prices && prices.length === 2) {
      this.productStore.updatePriceRange(prices[0], prices[1]);
    }
  }

  onBrandChange(brand: string): void {
    this.productStore.updateBrand(brand);
  }

  onItemsPerPageChange(size: number): void {
    this.productStore.updateItemsPerPage(size);
  }

  onCurrentPageChange(page: number): void {
    this.productStore.updatePageNumber(page);
  }

  previousPage(): void {
    this.productStore.previousPage();
  }

  nextPage(): void {
    this.productStore.nextPage();
  }
}
