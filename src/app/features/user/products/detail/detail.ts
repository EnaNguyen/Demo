import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductContext } from '../../../../shared/pipe/contexts/productContext';
import { DataObject } from '../../../../shared/type/filter/filter';
import { FormsModule } from '@angular/forms';
import { CartContext } from '../../../../shared/pipe/contexts/cartContext';
import {
  CartPersonalView,
  CartDetailPersonalView,
} from '../../../../shared/data/viewModels/cartPersonalView';
import { UserContext } from '../../../../shared/pipe/contexts/userContext';
import { userInfoView } from '../../../../shared/data/viewModels/userView';
import { AuthorizeContext } from '../../../../shared/pipe/contexts/authorizeContext';
@Component({
  selector: 'app-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class Detail implements OnInit {
  product: DataObject | null = null;
  quantity: number = 1;
  selectedImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productContext: ProductContext,
    private cartContext: CartContext,
    private userContext: UserContext,
    private authorizeContext: AuthorizeContext
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productContext.products$.subscribe((products) => {
        this.product = products.find((p) => p.key == id) || null;
        if (this.product) {
          this.selectedImage = this.getPropertyValue(this.product, 'imageUrl');
        }
      });
    }
  }

  getPropertyValue(product: DataObject, label: string): any {
    return product.properties?.find((p) => p.label === label)?.value;
  }

  getMaxQuantity(): number {
    if (!this.product) return 0;
    const productQuantity = this.getPropertyValue(this.product, 'quantity') || 0;
    const cart = this.cartContext.getCurrentCart();
    if (cart && cart.items) {
      const cartItem = cart.items.find((item) => item.productId == this.product!.key);
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
    // Kiểm tra xem user đã login chưa
    if (!this.authorizeContext.checkAuthenticationForAction(this.router)) {
      return;
    }

    if (!this.product) return;
    const cart = this.cartContext.getCurrentCart();
    if (!cart || !cart.items) return;
    const existingItem = cart.items.find((item) => item.productId == this.product!.key);
    const maxQty = this.getMaxQuantity();
    let addedQuantity = 0;
    if (existingItem) {
      const possibleNewQty = existingItem.quantity + this.quantity;

      if (possibleNewQty > maxQty) {
        if (existingItem.quantity < maxQty) {
          addedQuantity = maxQty - existingItem.quantity; 
          existingItem.quantity = maxQty;
        }
        alert(`Chỉ có thể thêm tối đa ${maxQty} sản phẩm vào giỏ hàng!`);
      } else {
        addedQuantity = this.quantity;
        existingItem.quantity += this.quantity;
      }
    } else {
      if (this.quantity > maxQty) {
        alert(`Chỉ có thể thêm tối đa ${maxQty} sản phẩm vào giỏ hàng!`);
        if (maxQty > 0) {
          addedQuantity = maxQty;
          const newItem: CartDetailPersonalView = {
            id: Date.now(),
            cartId: cart.id || 1,
            productId: this.product.key as number,
            quantity: maxQty,
            price: this.getPropertyValue(this.product, 'price'),
          };
          cart.items.push(newItem);
        }
      } else {
        addedQuantity = this.quantity;
        const newItem: CartDetailPersonalView = {
          id: Date.now(),
          cartId: cart.id || 1,
          productId: this.product.key as number,
          quantity: this.quantity,
          price: this.getPropertyValue(this.product, 'price'),
        };
        cart.items.push(newItem);
      }
    }
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    localStorage.setItem('carts', JSON.stringify(cart));
    this.cartContext.reloadCart();
    if (addedQuantity > 0) {
      alert(`Đã thêm ${addedQuantity} sản phẩm vào giỏ hàng!`);
    }
    console.log('Thêm vào giỏ hàng:', {
      product: this.product,
      requested: this.quantity,
      actuallyAdded: addedQuantity,
    });
  }

  formatPrice(price: any): string {
    if (!price) return '0';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  }
}
