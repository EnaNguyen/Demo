import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CartStore } from '../../../shared/pipe/contexts/cartContext';
import { CartPersonalView, CartDetailPersonalView } from '../../../shared/data/viewModels/cartPersonalView';
import { FormatPricePipe } from '../../../shared/pipe/format/formatPrice.pipe';
import { ProductStore} from '../../admin/product/product-store';
import { ProductModel } from '../../admin/product/model/product.model';
import { AddItemToCartModel } from '../../../shared/data/createModels/cartAdding';
import { PaymentRequest } from '../../../shared/data/createModels/paymentRequest';
import { CheckoutModalComponent } from './checkout-modal';
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatPricePipe, CheckoutModalComponent],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})   
export class Cart implements OnInit {
  private cartStore = inject(CartStore);
  private readonly productStore = inject(ProductStore);
  private readonly modalService = inject(NgbModal);
  private readonly username = localStorage.getItem('username') || '';
  cart = computed(() => {
    return (this.cartStore as any).cartView();
  });
  cartItems = computed(() => {
    return this.cart()?.items || [];
  });
  totalPrice = computed(() => {
    return this.cart()?.totalPrice || 0;
  });
  totalQuantity = computed(() => {
    return this.cart()?.items?.reduce((sum: number, item: CartDetailPersonalView) => sum + item.quantity, 0) || 0;
  });

  ngOnInit(): void {
    if (this.username) {
      this.cartStore.loadCart(this.username);
      this.productStore.loadProducts('');
    }
  }

  getProductName(item: CartDetailPersonalView): string {
    return item.productName || 'Sản phẩm không xác định';
  }

  getProductImage(item: CartDetailPersonalView): string {
    const products = this.productStore.products();
    const product = products.find(p => p.id == item.productId.toString());
    return product?.imageUrl || '/assets/images/no-product.jpg';
  }

  getProductPrice(item: CartDetailPersonalView): number {
    return item.price || 0;
  }

  getMaxAvailableForItem(item: CartDetailPersonalView): number {
    return item.quantity;
  }

  increaseQuantity(item: CartDetailPersonalView): void {
    const storeTyped = this.cartStore as any;
    storeTyped.increaseQuantity(item.id);
  }

  decreaseQuantity(item: CartDetailPersonalView): void {
    const storeTyped = this.cartStore as any;
    storeTyped.decreaseQuantity(item.id);
  }

  removeItem(item: CartDetailPersonalView): void {
    const storeTyped = this.cartStore as any;
    storeTyped.removeItem(item.id);
  }

  checkOut(item: CartPersonalView): void {
    const modalRef = this.modalService.open(CheckoutModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    const componentInstance = modalRef.componentInstance as CheckoutModalComponent;
    componentInstance.setModalRef(modalRef);
    modalRef.result.then(
      (formData) => {
        const request: PaymentRequest = {
          CartId: item.id as number,
          PaymentMethod: formData.method,
          Receiver: formData.receiverName,
          Phone: formData.phone,
          Address: formData.address,
          TotalPrice: item.totalPrice,
        };
        console.log('Checkout request:', request);
        const storeTyped = this.cartStore as any;
        storeTyped.checkOut(request);
      },
      (reason) => {
        console.log('Checkout modal dismissed:', reason);
      }
    );
  }
}