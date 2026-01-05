import { Component, OnInit, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductStore } from '../../../../shared/pipe/contexts/productContext';
import { CartStore } from '../../../../shared/pipe/contexts/cartContext';
import { DataObject } from '../../../../shared/type/filter/filter';
import { FormsModule } from '@angular/forms';
import {
  CartDetailPersonalView,
} from '../../../../shared/data/viewModels/cartPersonalView';
import { AuthorizeContext } from '../../../../shared/pipe/contexts/authorizeContext';
import { FormatDatePipe } from '../../../../shared/pipe/format/formatDate.pipe';
import { FormatPricePipe } from '../../../../shared/pipe/format/formatPrice.pipe';
import { AddItemToCartModel } from '../../../../shared/data/createModels/cartAdding';
@Component({
  selector: 'app-detail',
  imports: [CommonModule, FormsModule, FormatDatePipe, FormatPricePipe],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class Detail implements OnInit {
  product = signal<DataObject | null>(null);
  quantity: number = 1;
  selectedImage: string = '';
  private productStore = inject(ProductStore);
  private cartStore = inject(CartStore);
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authorizeContext: AuthorizeContext
  ) {
    effect(() => {
      const products = this.productStore.products();
      const id = this.route.snapshot.paramMap.get('id');
      if (id && products.length > 0) {
        const foundProduct = products.find((p: DataObject) => p.key == id) || null;
        this.product.set(foundProduct);
        console.log('Loaded product detail:', foundProduct);
        if (foundProduct) {
          this.selectedImage = this.getPropertyValue(foundProduct, 'imageUrl');
        }
      }
    });
  }

  ngOnInit(): void {
    this.productStore.loadProducts();
  }

  getPropertyValue(product: DataObject, label: string): any {
    return product.properties?.find((p) => p.label === label)?.value;
  }

  getMaxQuantity(): number {
    const product = this.product();
    if (!product) return 0;
    const productQuantity = this.getPropertyValue(product, 'quantity') || 0;
    const cartView = (this.cartStore as any)['cartView']();
    if (cartView && cartView.items) {
      const cartItem = cartView.items.find((item: CartDetailPersonalView) => item.productId == product.key);
      if (cartItem) {
        return Math.max(0, productQuantity - cartItem.quantity);
      }
    }
    return productQuantity;
  }

  increaseQuantity(): void {
    if (this.quantity < this.getMaxQuantity()) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.authorizeContext.checkAuthenticationForAction(this.router)) {
      console.log('User not authenticated. Redirecting to login.');
      return;
    }
    const product = this.product();
    if (!product) {
      alert('Sản phẩm không tồn tại');
      return;
    }

    const newItem: AddItemToCartModel = {
      cartDetailId: product.key as number,
      quantity: this.quantity,
    };

    const storeTyped = this.cartStore as any;
    storeTyped.addItemToCart(newItem);
    alert(`Đã thêm ${this.quantity} sản phẩm vào giỏ hàng!`);
    console.log('Thêm vào giỏ hàng:', { product, quantity: this.quantity });
  }
}
