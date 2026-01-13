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
import { environment } from '../../../../environments/environment';
const initialCartState: CartPersonalView = {
  id: undefined,
  items: [],
  totalPrice: 0,
  userId: 0,
};
const API_URL = environment.apiUrl+"/Cart";

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialCartState),
  withMethods((store) => {
    const http = inject(HttpClient);
    const auth = inject(AuthorizeContext);
    const platformId = inject(PLATFORM_ID);

    return {
      loadCart: rxMethod<string | number>((userId$) =>
        userId$.pipe(
          switchMap((userId) =>
            http.get<any>(`${API_URL}/GetCartList?id=${encodeURIComponent(userId.toString())}`).pipe(
              tap((response) => {
                const userCart = response;
                console.log('Loaded cart data:', userCart);
                if (!userCart || !userCart.details) {
                  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
                  patchState(store, {
                    id: undefined,
                    userId: userIdNum,
                    items: [],
                    totalPrice: 0,
                  } as CartPersonalView);
                } else {
                  const items = userCart.details.map((item: any) => ({
                    id: item.productId,
                    detailId: item.id,
                    cartId: userCart.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                  }));
                  
                  patchState(store, {
                    id: userCart.id,
                    userId: userCart.userId,
                    items: items,
                    totalPrice: userCart.totalPrice,
                  } as CartPersonalView);
                  
                  if (isPlatformBrowser(platformId)) {
                    localStorage.setItem('carts', JSON.stringify(getState(store)));
                  }
                }
              }),
              catchError((err) => {
                console.error('Failed to load cart', err);
                return of(null);
              })
            )
          )
        )
      ),

      increaseQuantity(itemId: number): void {
        const state = getState(store);
        const user = auth.getUser();
        const item = state.items?.find((i) => i.id === itemId);
        
        if (item && user) {
          http.put<any>(`${API_URL}/IncreaseAmount?userId=${encodeURIComponent(user.id)}&productId=${item.productId}`, {}).pipe(
            tap((response) => {
              if (response && response.details) {
                const updatedItems = response.details.map((detail: any) => ({
                  id: detail.productId,
                  detailId: detail.id,
                  cartId: response.id,
                  productId: detail.productId,
                  quantity: detail.quantity,
                  price: detail.price,
                }));
                
                patchState(store, {
                  items: updatedItems,
                  totalPrice: response.totalPrice,
                } as CartPersonalView);
              }
            }),
            catchError((error) => {
              console.error('Error increasing quantity:', error);
              return of(null);
            })
          ).subscribe();
        }
      },

      decreaseQuantity(itemId: number): void {
        const state = getState(store);
        const user = auth.getUser();
        const item = state.items?.find((i) => i.id === itemId);
        
        if (item && user) {
          http.put<any>(`${API_URL}/DecreaseAmount?userId=${encodeURIComponent(user.id)}&productId=${item.productId}`, {}).pipe(
            tap((response) => {
              if (response && response.details) {
                const updatedItems = response.details.map((detail: any) => ({
                  id: detail.productId,
                  detailId: detail.id,
                  cartId: response.id,
                  productId: detail.productId,
                  quantity: detail.quantity,
                  price: detail.price,
                }));
                
                patchState(store, {
                  items: updatedItems,
                  totalPrice: response.totalPrice,
                } as CartPersonalView);
              }
            }),
            catchError((error) => {
              console.error('Error decreasing quantity:', error);
              return of(null);
            })
          ).subscribe();
        }
      },

      removeItem(itemId: number): void {
        const state = getState(store);
        const user = auth.getUser();
        const item = state.items?.find((i) => i.id === itemId);
        
        if (item && user) {
          http.delete<any>(`${API_URL}/RemoveCartItems?userId=${encodeURIComponent(user.id)}&productId=${item.productId}`).pipe(
            tap((response) => {
              if (response && response.details) {
                const updatedItems = response.details.map((detail: any) => ({
                  id: detail.productId,
                  detailId: detail.id,
                  cartId: response.id,
                  productId: detail.productId,
                  quantity: detail.quantity,
                  price: detail.price,
                }));
                
                patchState(store, {
                  items: updatedItems,
                  totalPrice: response.totalPrice,
                } as CartPersonalView);
              }
            }),
            catchError((error) => {
              console.error('Error deleting cart item:', error);
              return of(null);
            })
          ).subscribe();
        }
      },

      addItemToCart(newItem: AddItemToCartModel): void {
        const user = auth.getUser();
        
        if (user) {
          const productId = newItem.cartDetailId || 0;
          const quantity = newItem.quantity;
          console.log('Adding item to cart:', { user, productId, quantity });
          http.post<any>(
            `${API_URL}/AddItemToCart?username=${encodeURIComponent(user)}&productId=${productId}&quantity=${quantity}`,
            {}
          ).pipe(
            tap((response) => {
              if (response && response.details) {
                const updatedItems = response.details.map((detail: any) => ({
                  id: detail.productId,
                  detailId: detail.id,
                  cartId: response.id,
                  productId: detail.productId,
                  quantity: detail.quantity,
                  price: detail.price,
                }));
                
                patchState(store, {
                  id: response.id,
                  userId: response.userId,
                  items: updatedItems,
                  totalPrice: response.totalPrice,
                } as CartPersonalView);
                
                if (isPlatformBrowser(platformId)) {
                  localStorage.setItem('carts', JSON.stringify(getState(store)));
                }             
                console.log('Item added to cart successfully');
              }
            }),
            catchError((error) => {
              console.error('Error adding item to cart:', error);
              return of(null);
            })
          ).subscribe();
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
      const platformId = inject(PLATFORM_ID);
      const user = auth.getUser();
      
      if (user && user.id) {
        const storeTyped = store as any;
        storeTyped.loadCart(user.id);
      }
      
      if (isPlatformBrowser(platformId)) {
        const checkUserInterval = setInterval(() => {
          const currentUser = auth.getUser();
          const currentState = getState(store);
          
          if (currentUser && currentUser.id && currentState.userId !== currentUser.id) {
            console.log('User changed, reloading cart for user:', currentUser.id);
            const storeTyped = store as any;
            storeTyped.loadCart(currentUser.id);
          }
          else if (!currentUser && currentState.userId) {
            console.log('User logged out, clearing cart');
            patchState(store, {
              id: undefined,
              userId: 0,
              items: [],
              totalPrice: 0,
            } as CartPersonalView);
          }
        }, 500);
        
        return () => clearInterval(checkUserInterval);
      }
      
      return undefined;
    },
  })
);

