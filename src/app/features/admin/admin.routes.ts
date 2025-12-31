import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'products',
        loadComponent: () => import('./product/product').then(m => m.ProductComponent)
    },
];