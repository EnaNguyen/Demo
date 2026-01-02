import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartContext } from '../../../shared/pipe/contexts/cartContext';
import { ProductContext } from '../../../shared/pipe/contexts/productContext';
import { CartPersonalView, CartDetailPersonalView } from '../../../shared/data/viewModels/cartPersonalView';
import { DataObject } from '../../../shared/type/filter/filter';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit, OnDestroy {
  cart: CartPersonalView | null = null;
  products: DataObject[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private cartContext: CartContext,
    private productContext: ProductContext
  ) {}

  ngOnInit(): void {
    this.cartContext.cart$.pipe(takeUntil(this.destroy$)).subscribe(cart => {
      this.cart = cart;
    });

    this.productContext.products$.pipe(takeUntil(this.destroy$)).subscribe(products => {
      this.products = products;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getProductById(productId: number): DataObject | undefined {
    return this.products.find(p => p.key == productId);
  }

  getPropertyValue(product: DataObject, label: string): any {
    return product.properties?.find(p => p.label === label)?.value;
  }

  getTotalPrice(): number {
    return this.cart?.totalPrice || 0;
  }

  getTotalQuantity(): number {
    return this.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  increaseQuantity(item: CartDetailPersonalView): void {
    const product = this.getProductById(item.productId);
    if (product) {
      const maxQuantity = this.getPropertyValue(product, 'quantity');
      this.cartContext.increaseQuantity(item, maxQuantity);
    }
  }

  decreaseQuantity(item: CartDetailPersonalView): void {
    this.cartContext.decreaseQuantity(item);
  }

  removeItem(item: CartDetailPersonalView): void {
    this.cartContext.removeItem(item);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  checkout(): void {
    alert('Proceeding to checkout');
  }
}
