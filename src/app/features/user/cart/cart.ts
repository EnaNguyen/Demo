import { Component, OnInit, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../../shared/pipe/contexts/cartContext';
import { ProductStore } from '../../../shared/pipe/contexts/productContext';
import { CartPersonalView, CartDetailPersonalView } from '../../../shared/data/viewModels/cartPersonalView';
import { DataObject } from '../../../shared/type/filter/filter';
import { FormatPricePipe } from '../../../shared/pipe/format/formatPrice.pipe';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, RouterLink, FormatPricePipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cart = signal<CartPersonalView | null>(null);
  products = signal<DataObject[]>([]);
  private productStore = inject(ProductStore);
  private cartStore = inject(CartStore);

  constructor() {
    effect(() => {
      const storeProducts = this.productStore.products();
      this.products.set(storeProducts);
    });

    effect(() => {
      const cartView = (this.cartStore as any)['cartView']();
      this.cart.set(cartView);
    });
  }

  ngOnInit(): void {
    this.productStore.loadProducts();
  }

  getProductById(productId: number): DataObject | undefined {
    return this.products().find(p => p.key == productId);
  }

  getPropertyValue(product: DataObject, label: string): any {
    return product.properties?.find(p => p.label === label)?.value;
  }

  getTotalPrice(): number {
    const cartValue = this.cart();
    return cartValue?.totalPrice || 0;
  }

  getTotalQuantity(): number {
    const cartValue = this.cart();
    return cartValue?.items?.reduce((sum: number, item: CartDetailPersonalView) => sum + item.quantity, 0) || 0;
  }

  increaseQuantity(item: CartDetailPersonalView): void {
    const product = this.getProductById(item.productId);
    if (product) {
      const maxQuantity = this.getPropertyValue(product, 'quantity');
      const storeTyped = this.cartStore as any;
      storeTyped.increaseQuantity(item.id, maxQuantity);
    }
  }

  decreaseQuantity(item: CartDetailPersonalView): void {
    const storeTyped = this.cartStore as any;
    storeTyped.decreaseQuantity(item.id);
  }

  removeItem(item: CartDetailPersonalView): void {
    const storeTyped = this.cartStore as any;
    storeTyped.removeItem(item.id);
  }

  checkout(): void {
    alert('Proceeding to checkout');
  }
}
