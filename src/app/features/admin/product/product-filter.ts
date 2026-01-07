import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductStore } from './product-store';
@Component({
  selector: 'ngrx-product-filter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filter-container">
      <div class="filter-group">
        <label for="query">Search:</label>
        <input
          id="query"
          type="text"
          [value]="query"
          (input)="onQueryChange($event)"
          placeholder="Search by title..."
        />
      </div>
      <div class="filter-group">
        <label for="orderPrice">Sort Order By Price:</label>
        <select id="orderPrice" [value]="orderPrice" (change)="onOrderPriceChange($event)">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="orderName">Sort Order By Name:</label>
        <select id="orderName" [value]="orderName" (change)="onOrderNameChange($event)">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="dateReleaes">Date Release:</label>
        <input
          id="dateReleaseBegin"
          type="date"
          [value]="dateReleaseBegin"
          (change)="onReleaseDateChange($event)"
        />
        <input
          id="dateReleaseEnd"
          type="date"
          [value]="dateReleaseEnd"
          (change)="onReleaseDateChange($event)"
        />
      </div>
      <div class="filter-group">
        <label for="priceRange">Price:</label>
        <input
          id="priceRangeMin"
          type="number"
          [value]="priceRangeMin"
          (change)="onPriceRangeChange($event)"
        />
        <input
          id="priceRangeMax"
          type="number"
          [value]="priceRangeMax"
          (change)="onPriceRangeChange($event)"
        />
      </div>
      <div class="filter-group">
        <label for="brandFilter">Brand:</label>
        <select id="brandFilter" (change)="onBrandChange($event)">
          <option value="">All Brands</option>
          @for (brand of productStore.brands(); track brand) {
          <option [value]="brand" [selected]="brandSelected === brand">
            {{ brand }}
          </option>
          }
        </select>
      </div>
    </div>
  `,
  styles: [
    `
      .filter-container {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      label {
        font-weight: 600;
        font-size: 0.875rem;
      }

      input,
      select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.875rem;
      }

      input:focus,
      select:focus {
        outline: none;
        border-color: #4285f4;
        box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFilter {
  readonly productStore = inject(ProductStore);
  @Input() query: string = '';
  @Input() orderPrice: string = '';
  @Input() orderName: string = '';
  @Input() dateReleaseBegin: string = '';
  @Input() dateReleaseEnd: string = '';
  @Input() priceRangeMin: string = '';
  @Input() priceRangeMax: string = '';
  @Input() brandSelected: string = '';
  @Output() queryChange = new EventEmitter<string>();
  @Output() orderPriceChange = new EventEmitter<'asc' | 'desc'>();
  @Output() orderNameChange = new EventEmitter<'asc' | 'desc'>();
  @Output() releaseDateChange = new EventEmitter<string[]>();
  @Output() priceRangeChange = new EventEmitter<string[]>();
  @Output() brandSelectedChange = new EventEmitter<string>();
  onQueryChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.queryChange.emit(target.value);
  }

  onOrderPriceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.orderPriceChange.emit(target.value as 'asc' | 'desc');
  }

  onOrderNameChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.orderNameChange.emit(target.value as 'asc' | 'desc');
  }
  onReleaseDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.id === 'dateReleaseBegin') {
      this.dateReleaseBegin = target.value;
    } else if (target.id === 'dateReleaseEnd') {
      this.dateReleaseEnd = target.value;
    }
    this.releaseDateChange.emit([this.dateReleaseBegin, this.dateReleaseEnd]);
  }
  onPriceRangeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.id === 'priceRangeMin') {
      this.priceRangeMin = target.value;
    } else if (target.id === 'priceRangeMax') {
      this.priceRangeMax = target.value;
    }
    this.priceRangeChange.emit([this.priceRangeMin, this.priceRangeMax]);
  }
  onBrandChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const brand = select.value;
    this.brandSelectedChange.emit(brand);
  }
  isBrandSelected(brand: string): boolean {
    const current = this.productStore.filter().find((f) => f.type === 'brand')?.query;
    return current === brand;
  }
}
