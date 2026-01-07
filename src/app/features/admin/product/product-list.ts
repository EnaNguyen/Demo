import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductModel } from '../product/model/product.model';

@Component({
  selector: 'ngrx-pro-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="products-container">
      <div *ngIf="isLoading" class="loading">
        <p>Loading products...</p>
      </div>
      <div *ngIf="!isLoading && product.length === 0" class="empty-state">
        <p>No products found. Try a different search.</p>
      </div>
      <div *ngIf="!isLoading && product.length > 0" class="products-grid">
        <div *ngFor="let product of product" class="product-card">
          <h3>{{ product.name }}</h3>
          <p class="brand">{{ product.brand }}</p>
          <p class="price">{{ product.price }}</p>
          <p class="release-date">{{ product.releaseDate }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .products-container {
      padding: 1rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #999;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .product-card {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s;
    }

    .product-card:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      color: #333;
    }

    .author {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.875rem;
    }

    .year {
      margin: 0;
      color: #999;
      font-size: 0.875rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class productList {
  @Input() product: ProductModel[] = [];
  @Input() isLoading: boolean = false;
}
