import { Component, inject, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductStore } from '../../../../shared/pipe/contexts/productContext';
import { CartStore } from '../../../../shared/pipe/contexts/cartContext';
import { AuthorizeContext } from '../../../../shared/pipe/contexts/authorizeContext';

import { FormatDatePipe } from '../../../../shared/pipe/format/formatDate.pipe';
import { FormatPricePipe } from '../../../../shared/pipe/format/formatPrice.pipe';

import { Product } from '../../../../shared/pipe/contexts/productContext'; // import interface Product
import { AddItemToCartModel } from '../../../../shared/data/createModels/cartAdding';
import { CartDetailPersonalView } from '../../../../shared/data/viewModels/cartPersonalView';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatDatePipe, FormatPricePipe],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class DetailComponent {
  product = signal<Product | null>(null);

  quantity = signal(1);
  selectedImage = signal<string>('');

  private productStore = inject(ProductStore);
  private cartStore = inject(CartStore);
  private authorizeContext = inject(AuthorizeContext);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  maxQuantity = computed(() => {
    const prod = this.product();
    if (!prod) return 0;

    const cartView = (this.cartStore as any)['cartView']() as any;
    if (!cartView?.items) return prod.quantity;

    const cartItem = cartView.items.find(
      (item: CartDetailPersonalView) => item.productId === prod.id
    );

    if (cartItem) {
      return Math.max(0, prod.quantity - cartItem.quantity);
    }
    return prod.quantity;
  });

  constructor() {
    effect(() => {
      const products = this.productStore.products();
      const idStr = this.route.snapshot.paramMap.get('id');
      const id = idStr ? Number(idStr) : null;

      if (id && products.length > 0) {
        const found = products.find((p: Product) => p.id === id) || null;
        this.product.set(found);

        if (found) {
          this.selectedImage.set(found.img || '/assets/images/no-product.jpg');
          this.quantity.set(1);
        }
      }
    });
  }

  ngOnInit(): void {
    if (!this.productStore.loaded()) {
      this.productStore.loadProducts();
    }
  }

  increaseQuantity(): void {
    if (this.quantity() < this.maxQuantity()) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  addToCart(): void {
    if (!this.authorizeContext.checkAuthenticationForAction(this.router)) {
      console.log('User not authenticated. Redirecting to login.');
      return;
    }

    const prod = this.product();
    if (!prod) {
      alert('Sản phẩm không tồn tại');
      return;
    }

    if (this.quantity() > this.maxQuantity()) {
      alert('Số lượng vượt quá số lượng có sẵn trong kho!');
      return;
    }

    const newItem: AddItemToCartModel = {
      cartDetailId: prod.id,
      quantity: this.quantity(),
      price: prod.price,
    };

    (this.cartStore as any).addItemToCart(newItem);
    alert(`Đã thêm ${this.quantity()} sản phẩm vào giỏ hàng!`);
    this.quantity.set(1);
  }
}