import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
//   {
//     path: 'home',
//     loadComponent: () => import('./home/home').then(m => m.HomeComponent)
//   },
//   {
//     path: 'products',
//     loadComponent: () => import('./products/products').then(m => m.ProductsComponent),
//     // Nếu có child [id], sẽ xử lý riêng trong products.routes.ts
//   },
  {
    path: 'history',
    loadComponent: () => import('./history/history').then(m => m.History)
  },
//   {
//     path: 'cart',
//     loadComponent: () => import('./cart/cart').then(m => m.CartComponent)
//   },
//   {
//     path: 'checkout',
//     loadComponent: () => import('./checkout/checkout').then(m => m.CheckoutComponent)
//   },
  // Thêm các route khác...
];