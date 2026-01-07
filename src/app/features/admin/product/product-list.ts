import { ChangeDetectionStrategy, Component, Input, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductModel } from '../product/model/product.model';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdateProductModal } from './product-update.modal';
import { ProductStore } from './product-store';
import { FormatPricePipe } from './pipe/formatPrice.pipe';
import { FormatDatePipe } from './pipe/formatDate.pipe';
@Component({
  selector: 'ngrx-pro-list',
  standalone: true,
  imports: [CommonModule, UpdateProductModal, FormatPricePipe, FormatDatePipe, NgbModule],
  template: `
    <div class="products-container">
      <div *ngIf="isLoading" class="loading">
        <p>Loading products...</p>
      </div>
      <div *ngIf="!isLoading && product.length === 0" class="empty-state">
        <p>No products found. Try a different search.</p>
      </div>
      <div *ngIf="!isLoading && product.length > 0" class="products-grid">
        <table class="products-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên Sản Phẩm</th>
              <th>Thương Hiệu</th>
              <th>Ngày Ra Mắt</th>
              <th>Giá</th>
              <th>Số Lượng</th>
              <th>Tình Trạng</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr
              [ngClass]="'status-' + (product.quantity > 0 ? 'available' : 'out')"
              *ngFor="let product of product"
            >
              <td class="col-id">{{ product.id }}</td>
              <td class="col-image">
                <img [src]="product.imageUrl" [alt]="product.name" class="product-image" />
              </td>
              <td class="col-name">{{ product.name }}</td>
              <td class="col-brand">{{ product.brand }}</td>
              <td class="col-date">{{ product.releaseDate | formatDate}}</td>
              <td class="col-price">{{ product.price | formatPrice }}</td>
              <td class="col-quantity">
                <span [ngClass]="product.quantity > 0 ? 'qty-available' : 'qty-empty'">
                  {{ product.quantity }}
                </span>
              </td>
              <td class="col-status">
                <span [ngClass]="'badge-' + product.status.toLowerCase().replace(/\\s+/g, '-')">
                  @if(product.status === '1' && product.quantity > 10)
                    {
                      Đang Bán
                    }
                  @else if(product.status === '1' && product.quantity <= 10 && product.quantity > 0)
                    {
                      Sắp hết hàng
                    }
                  @else if(product.quantity== 0 && product.status === '1')
                    {
                      Hết Hàng
                    }
                  @else
                    {
                      Ngừng Bán
                    }
                </span>
              </td>
              <td class="col-actions">
                <div class="action-dropdown">
                  <button class="btn-actions-menu" (click)="toggleMenu($event)">⋮</button>
                  <div class="dropdown-menu" style="display: none">
                    <button class="dropdown-item edit" (click)="openUpdateModal(product)">
                      Sửa
                    </button>
                    <button class="dropdown-item toggle" (click)="toggleProductStatus(product.id)">
                      @if(product.status === '1')
                        {
                          Ngừng Bán
                        }
                      @else
                        {
                          Mở Bán
                        }
                    </button>
                    <button class="dropdown-item delete">Xóa</button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <table></table>
  `,
  styleUrls: ['./css/productTable.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class productList {
  @Input() product: ProductModel[] = [];
  @Input() isLoading: boolean = false;
  private readonly modalService = inject(NgbModal);
  private readonly productStore = inject(ProductStore);
  openUpdateModal(product: ProductModel) {
    const modalRef = this.modalService.open(UpdateProductModal, {
      centered: true,
      size: 'lg',
    });
    console.log(product)
    modalRef.componentInstance.product = product;
    modalRef.result.then(
      (result) => console.log('Updated:', result),
      (reason) => console.log('Dismissed:', reason)
    );
  }
  toggleMenu(event: Event): void {
    const button = event.currentTarget as HTMLElement;
    const menu = button.nextElementSibling as HTMLElement;
    if (menu.style.display === 'block') {
      menu.style.display = 'none';
    } else {
      menu.style.display = 'block';
    }
  }
  toggleProductStatus(id: string): void {
    this.productStore.updateStatus({ id });
  }
}
