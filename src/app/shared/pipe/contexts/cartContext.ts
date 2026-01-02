import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CartPersonalView,CartDetailPersonalView } from '../../data/viewModels/cartPersonalView';
import { AddItemToCartModel } from '../../data/createModels/cartAdding';
@Injectable({
  providedIn: 'root',
})
export class CartContext {
  private readonly STORAGE_KEY = 'carts'; 
  private currentUserId = 1;
  private cartSubject = new BehaviorSubject<CartPersonalView | null>(null);
  public cart$: Observable<CartPersonalView | null> = this.cartSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadCart();
  }
  private saveToLocalStorage(data: any): void {
     if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  } 
  private loadCart(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const cart = JSON.parse(stored) as CartPersonalView;
          this.cartSubject.next(cart);
          return;
        } catch (e) {
          console.error('Failed to parse cart from localStorage', e);
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    }

    this.http.get<any>('/data.json').subscribe({
      next: (data) => {
        const cart = this.buildCartForUser(data);
        if (cart && isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        }
        this.cartSubject.next(cart);
      },
      error: (err) => {
        console.error('Failed to load data.json', err);
        this.cartSubject.next(null);
      },
    });
  }

  private buildCartForUser(data: any): CartPersonalView | null {
    const carts = data.carts || [];
    const cartItems = data.cartItems || [];

    const userCart = carts.find((c: any) => c.userId === this.currentUserId);

    if (!userCart) {
      return null; 
    }

    const items: CartDetailPersonalView[] = cartItems
      .filter((item: any) => item.cartId === userCart.cartId) 
      .map((item: any) => ({
        id: item.detailId,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

    return {
      id: userCart.cartId || userCart.id,
      userId: userCart.userId,
      totalPrice: userCart.totalPrice,
      items: items,
    };
  }

  getCurrentCart(): CartPersonalView | null {
    return this.cartSubject.value;
  }

  increaseQuantity(item: CartDetailPersonalView, maxQuantity: number): void {
    if (item.quantity < maxQuantity) {
      item.quantity++;
      this.updateCart();
    }
  }

  decreaseQuantity(item: CartDetailPersonalView): void {
    if (item.quantity > 1) {
      item.quantity--;
      this.updateCart();
    }
  }

  removeItem(item: CartDetailPersonalView): void {
    const currentCart = this.cartSubject.value;
    if (currentCart && currentCart.items) {
      currentCart.items = currentCart.items.filter(i => i.id !== item.id);
      this.updateCart();
    }
  }

  private updateCart(): void {
    const currentCart = this.cartSubject.value;
    if (currentCart && currentCart.items) {
      currentCart.totalPrice = currentCart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentCart));
      }
      this.cartSubject.next(currentCart);
    }
  }

  addItemToCart(newItem: AddItemToCartModel): void {
    const currentCart = this.cartSubject.value;
    if (currentCart && currentCart.items) {
      const existingItem = currentCart.items.find(item => item.productId === newItem.cartDetailId);
      if (existingItem) {
        const updatedItems = currentCart.items.map(item =>
          item.productId === newItem.cartDetailId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
        currentCart.items = updatedItems;
        this.updateCart();
      } else {
        const newCartItem: CartDetailPersonalView = {
          id: new Date().getTime(),
          cartId: currentCart.id || 1,
          productId: newItem.cartDetailId || 0,
          quantity: newItem.quantity,
          price: 0,
        };
        currentCart.items.push(newCartItem);
        this.updateCart();
      }
    }
  }
  reloadCart(): void {
    this.loadCart();
  }
}