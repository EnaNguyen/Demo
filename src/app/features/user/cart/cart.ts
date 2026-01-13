import { Component, OnInit, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartStore } from '../../../shared/pipe/contexts/cartContext';
import { ProductStore, Product } from '../../../shared/pipe/contexts/productContext';
import { CartPersonalView, CartDetailPersonalView } from '../../../shared/data/viewModels/cartPersonalView';
import { FormatPricePipe } from '../../../shared/pipe/format/formatPrice.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatPricePipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cart = signal<CartPersonalView | null>(null);
  private productStore = inject(ProductStore);
  private cartStore = inject(CartStore);
  cartItems = computed(() => this.cart()?.items || []);
  totalPrice = computed(() => this.cart()?.totalPrice || 0);
  totalQuantity = computed(() => 
    this.cart()?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  );

  private productMap = computed(() => {
    const map = new Map<number, Product>();
    this.productStore.products().forEach(p => {
      map.set(p.id, p);
    });
    return map;
  });

  constructor() {
    effect(() => {
      const cartView = (this.cartStore as any)['cartView']();
      this.cart.set(cartView);
    });
  }

  ngOnInit(): void {
    this.productStore.loadProducts();
  }

  getProduct(productId: number): Product | undefined {
    return this.productMap().get(productId);
  }

  getProductName(item: CartDetailPersonalView): string {
    return this.getProduct(item.productId)?.name || 'Sản phẩm không xác định';
  }

  getProductImage(item: CartDetailPersonalView): string {
    const product = this.getProduct(item.productId);
    return product?.img || '/assets/images/no-product.jpg';
  }

  getProductPrice(item: CartDetailPersonalView): number {
    return this.getProduct(item.productId)?.price || item.price || 0;
  }

  getMaxAvailableForItem(item: CartDetailPersonalView): number {
    const product = this.getProduct(item.productId);
    if (!product) return item.quantity; 
    
    const stock = product.quantity;
    return stock;
  }

  increaseQuantity(item: CartDetailPersonalView): void {
    const maxAvailable = this.getMaxAvailableForItem(item);
    if (item.quantity >= maxAvailable) {
      alert(`Chỉ còn ${maxAvailable} sản phẩm trong kho!`);
      return;
    }
    
    const storeTyped = this.cartStore as any;
    storeTyped.increaseQuantity(item.id, maxAvailable);
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
    if (!this.cart()?.items?.length) {
      alert('Giỏ hàng trống!');
      return;
    }
    alert('Tiến hành thanh toán...');
  }
  getItemSubtotal(item: CartDetailPersonalView): number {
    return item.quantity * this.getProductPrice(item);
  }
}