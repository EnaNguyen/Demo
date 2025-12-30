import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(m => m.Home)
  },
  {
    path: 'products',
    loadComponent: () => import('./products/products').then(m => m.ProductComponent),
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history').then(m => m.History)
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart').then(m => m.Cart)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout').then(m => m.Checkout)
  },
];