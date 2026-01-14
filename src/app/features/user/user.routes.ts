import { Routes } from '@angular/router';
import { RoleGuard } from '../../shared/pipe/contexts/authorizeContext';

export const USER_ROUTES: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home').then(m => m.Home)
  },
  {
    path: 'products',
    loadComponent: () => import('./products/products').then(m => m.ProductComponent)
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./products/detail/detail').then(m => m.DetailComponent)
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
    path: 'PaymentSuccess',
    loadComponent: () => import('./PaymentSuccess/PaymentSuccess').then(m => m.PaymentSuccess)
  },
];
export const USER_LOGIN : Routes = [
 {
  path: 'login',
  loadComponent: () => import('./login/login').then(m => m.Login)
 }
];