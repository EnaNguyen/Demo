import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withComputed, withHooks, patchState, getState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { switchMap, tap, catchError, of } from 'rxjs';
import { CartPersonalView, CartDetailPersonalView } from '../../data/viewModels/cartPersonalView';
import { AddItemToCartModel } from '../../data/createModels/cartAdding';
import { AuthorizeContext } from './authorizeContext';
import { computed } from '@angular/core';

const initialCartState: CartPersonalView = {
  id: undefined,
  items: [],
  totalPrice: 0,
  userId: 1,
};

function updateCartOnServer(
  items: CartDetailPersonalView[],
  totalPrice: number,
  cartId: number | undefined,
  userId: number,
  http: HttpClient,
  platformId: Object
): void {
  if (!isPlatformBrowser(platformId)) return;

  const state = { id: cartId, userId, items, totalPrice };
  localStorage.setItem('carts', JSON.stringify(state));

  items.forEach((item) => {
    http.put(`http://localhost:3000/cartItems/${item.id}`, {
      id: item.id,
      detailId: item.id,
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }).subscribe({
      next: () => {},
      error: (error) => console.error('Error updating cart item:', error),
    });
  });

  if (cartId) {
    http.put(`http://localhost:3000/carts/${cartId}`, {
      id: cartId,
      cartId: cartId,
      userId: userId,
      totalPrice: totalPrice,
    }).subscribe({
      next: () => console.log('Cart updated successfully'),
      error: (error) => console.error('Error updating cart:', error),
    });
  }
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialCartState),
  withMethods((store) => {
    const http = inject(HttpClient);
    const auth = inject(AuthorizeContext);
    const platformId = inject(PLATFORM_ID);

    return {
      loadCart: rxMethod<number>((userId$) =>
        userId$.pipe(
          switchMap((userId) =>
            http.get<any>('http://localhost:3000/carts').pipe(
              switchMap((carts) => {
                const userCart = carts.find((c: any) => c.userId.toString() === userId.toString());
                if (!userCart) {
                  return of(null);
                }
                return http.get<any>('http://localhost:3000/cartItems').pipe(
                  tap((cartItems) => {
                    let items = cartItems
                      .filter((ci: any) => ci.cartId.toString() === userCart.cartId.toString())
                      .map((item: any) => ({
                        id: item.id,
                        cartId: item.cartId,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                      }));
                    
                    if (!items || items.length === 0) {
                      items = [];
                    }                   
                    const totalPrice = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
                    patchState(store, {
                      id: userCart.id,
                      userId: userCart.userId,
                      items: items,
                      totalPrice: totalPrice,
                    } as CartPersonalView);
                    if (isPlatformBrowser(platformId)) {
                      localStorage.setItem('carts', JSON.stringify(getState(store)));
                    }
                  }),
                  catchError((err) => {
                    console.error('Failed to load cart items', err);
                    return of(null);
                  })
                );
              }),
              catchError((err) => {
                console.error('Failed to load carts', err);
                return of(null);
              })
            )
          )
        )
      ),

      increaseQuantity(itemId: number, maxQuantity: number): void {
        const state = getState(store);
        const item = state.items?.find((i) => i.id === itemId);
        if (item && item.quantity < maxQuantity) {
          const updatedItems = state.items!.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
          );
          const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          patchState(store, { items: updatedItems, totalPrice } as CartPersonalView);
          updateCartOnServer(updatedItems, totalPrice, state.id, state.userId, http, platformId);
        }
      },

      decreaseQuantity(itemId: number): void {
        const state = getState(store);
        const item = state.items?.find((i) => i.id === itemId);
        if (item && item.quantity > 1) {
          const updatedItems = state.items!.map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          );
          const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          patchState(store, { items: updatedItems, totalPrice } as CartPersonalView);
          updateCartOnServer(updatedItems, totalPrice, state.id, state.userId, http, platformId);
        }
      },

      removeItem(itemId: number): void {
        const state = getState(store);
        const updatedItems = state.items!.filter((i) => i.id !== itemId);
        const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        patchState(store, { items: updatedItems, totalPrice } as CartPersonalView);
        updateCartOnServer(updatedItems, totalPrice, state.id, state.userId, http, platformId);
      },

      addItemToCart(newItem: AddItemToCartModel): void {
        const state = getState(store);
        const existingItem = state.items?.find((item) => item.productId === newItem.cartDetailId);

        if (existingItem) {
          const updatedItems = state.items!.map((item) =>
            item.productId === newItem.cartDetailId
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          );
          const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          patchState(store, { items: updatedItems, totalPrice } as CartPersonalView);
          updateCartOnServer(updatedItems, totalPrice, state.id, state.userId, http, platformId);
        } else {
          http.get<any>(`http://localhost:3000/products/${newItem.cartDetailId}`).pipe(
            switchMap((product) => {
              const productPrice = product.price;
              const newCartItem: CartDetailPersonalView = {
                id: new Date().getTime(),
                cartId: state.id || 1,
                productId: newItem.cartDetailId || 0,
                quantity: newItem.quantity,
                price: productPrice,
              };
              const currentState = getState(store);
              const updatedItems = [...(currentState.items || []), newCartItem];
              const totalPrice = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
              patchState(store, { items: updatedItems, totalPrice } as CartPersonalView);
              
              if (isPlatformBrowser(platformId)) {
                return http.post(`http://localhost:3000/cartItems`, {
                  id: newCartItem.id,
                  cartId: newCartItem.cartId,
                  productId: newCartItem.productId,
                  quantity: newCartItem.quantity,
                  price: newCartItem.price,
                });
              }
              return of(null);
            }),
            tap(() => {
              const finalState = getState(store);
              updateCartOnServer(finalState.items || [], finalState.totalPrice, finalState.id, finalState.userId, http, platformId);
            }),
            catchError((error) => {
              console.error('Error adding item to cart:', error);
              return of(null);
            })
          ).subscribe({
            next: (response) => {
              if (response) {
                console.log('CartItem tạo mới thành công:', response);
              }
            }
          });
        }
      },
    };
  }),
  withComputed((store: any) => {
    return {
      cartView: computed((): CartPersonalView => {
        const state: CartPersonalView = getState(store);
        return {
          id: state.id,
          userId: state.userId,
          items: state.items || [],
          totalPrice: state.totalPrice,
        };
      }),
    };
  }),
  withHooks({
    onInit(store) {
      const auth = inject(AuthorizeContext);
      const userId = auth.getUser()?.id || 1;
      const storeTyped = store as any;
      storeTyped.loadCart(userId);
    },
  })
);

