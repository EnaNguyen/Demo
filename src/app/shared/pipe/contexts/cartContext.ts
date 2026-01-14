import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  withHooks,
  patchState,
  getState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { switchMap, tap, catchError, of, pipe } from 'rxjs';
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
const API_URL = environment.apiUrl + '/Cart';

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialCartState),
  withMethods((store) => {
    const http = inject(HttpClient);
    const auth = inject(AuthorizeContext);
    const platformId = inject(PLATFORM_ID);
    const username = auth.getUser() || '';
    const methods = {
      loadCart: rxMethod<string>((username) =>
        username.pipe(
          switchMap((userId) => {
            return http.get<any[]>(`${API_URL}/GetCartList?username=${userId}`).pipe(
              tap((response) => {
                const userCart =
                  response && Array.isArray(response) && response.length > 0 ? response[0] : null;
                if (!userCart || !userCart.details) {
                  patchState(store, {
                    id: undefined,
                    userId: userId,
                    items: [],
                    totalPrice: 0,
                  } as CartPersonalView);
                } else {
                  const items = userCart.details.map((item: any) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                    cartId: userCart.id,
                  }));

                  patchState(store, {
                    id: userCart.id,
                    userId: userId,
                    items: items,
                    totalPrice: userCart.totalPrice,
                  } as CartPersonalView);

                  if (isPlatformBrowser(platformId)) {
                    localStorage.setItem('carts', JSON.stringify(getState(store)));
                  }
                }
              }),
              catchError((err) => {
                return of(null);
              })
            );
          })
        )
      ),

      reloadCart(userId: string): void {
        http
          .get<any[]>(`${API_URL}/GetCartList?username=${userId}`)
          .pipe(
            tap((response) => {
              const userCart =
                response && Array.isArray(response) && response.length > 0 ? response[0] : null;
              if (userCart && userCart.details && userCart.details.length > 0) {
                const items = userCart.details.map((item: any) => ({
                  id: item.id,
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  price: item.price,
                  cartId: userCart.id,
                }));
                patchState(store, {
                  id: userCart.id,
                  userId: userId,
                  items: items,
                  totalPrice: userCart.totalPrice,
                } as CartPersonalView);
              } else {
                patchState(store, {
                  id: userCart?.id,
                  userId: userId,
                  items: [],
                  totalPrice: 0,
                } as CartPersonalView);
              }
            }),
            catchError((err) => {
              return of(null);
            })
          )
          .subscribe();
      },

      increaseQuantity(itemId: number): void {
        const state = getState(store);
        const username = auth.getUser();
        const item = state.items?.find((i) => i.id === itemId);
        if (item && username) {
          const url = `${API_URL}/IncreaseAmount?username=${username}&productId=${item.productId}`;
          http
            .put<any>(url, {})
            .pipe(
              tap((response) => {
                if (response && response.responseCode === 202) {
                  setTimeout(() => {
                    methods.reloadCart(username);
                  }, 100);
                }
              }),
              catchError((error) => {
                return of(null);
              })
            )
            .subscribe();
        }
      },

      decreaseQuantity(itemId: number): void {
        const state = getState(store);
        const username = auth.getUser();
        const item = state.items?.find((i) => i.id === itemId);

        if (item && username) {
          const url = `${API_URL}/DecreaseAmount?username=${username}&productId=${item.productId}`;
          http
            .put<any>(url, {})
            .pipe(
              tap((response) => {
                if (response && response.responseCode === 202) {
                  setTimeout(() => {
                    methods.reloadCart(username);
                  }, 100);
                }
              }),
              catchError((error) => {
                return of(null);
              })
            )
            .subscribe();
        }
      },

      removeItem(itemId: number): void {
        const state = getState(store);
        const username = auth.getUser();
        const item = state.items?.find((i) => i.id === itemId);
        if (item && username) {
          const url = `${API_URL}/RemoveCartItems?username=${username}&productId=${item.productId}`;
          http
            .delete<any>(url)
            .pipe(
              tap((response) => {
                if (response && response.responseCode === 204) {
                  setTimeout(() => {
                    methods.reloadCart(username);
                  }, 100);
                }
              }),
              catchError((error) => {
                console.error('Error in removeItem:', error);
                return of(null);
              })
            )
            .subscribe();
        }
      },

      addItemToCart(newItem: AddItemToCartModel): void {
        const user = auth.getUser();

        if (user) {
          const productId = newItem.cartDetailId || 0;
          const quantity = newItem.quantity;
          http
            .post<any[]>(
              `${API_URL}/AddItemToCart?username=${encodeURIComponent(
                user
              )}&productId=${productId}&quantity=${quantity}`,
              {}
            )
            .pipe(
              tap((response) => {
                if (response && Array.isArray(response) && response.length > 0) {
                  const cartData = response[0];
                  if (cartData.details) {
                    const updatedItems = cartData.details.map((detail: any) => ({
                      id: detail.id,
                      productId: detail.productId,
                      productName: detail.productName,
                      quantity: detail.quantity,
                      price: detail.price,
                      cartId: cartData.id,
                    }));

                    patchState(store, {
                      id: cartData.id,
                      userId: cartData.userId,
                      items: updatedItems,
                      totalPrice: cartData.totalPrice,
                    } as CartPersonalView);

                    if (isPlatformBrowser(platformId)) {
                      localStorage.setItem('carts', JSON.stringify(getState(store)));
                    }
                  }
                }
              }),
              catchError((error) => {
                return of(null);
              })
            )
            .subscribe();
        }
      },
      checkOut: rxMethod<PaymentRequest>(
        pipe(
          switchMap((newOrder) => {
            const CHECKOUT_URL = environment.apiUrl + '/Checkout/process-payment';
            return http.post<any>(CHECKOUT_URL, newOrder).pipe(
              tap((response) => {
                if (response && response.responseCode === 202) {
                  setTimeout(() => {
                    methods.reloadCart(username);
                  }, 100);
                }
              }),
                catchError((error) => {
                return of(null);
              })
            );
          })
        )
      ),
    };
    return methods;
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

      if (user) {
        const storeTyped = store as any;
        storeTyped.loadCart(user);
      }

      if (isPlatformBrowser(platformId)) {
        const checkUserInterval = setInterval(() => {
          const currentUser = auth.getUser();
          const currentState = getState(store);

          if (currentUser && currentState.userId !== currentUser) {
            const storeTyped = store as any;
            storeTyped.loadCart(currentUser);
          } else if (!currentUser && currentState.userId) {
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
