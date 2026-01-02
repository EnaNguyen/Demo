import { Routes } from '@angular/router';
import { RoleGuard } from '../../shared/pipe/contexts/authorizeContext';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'products',
        loadComponent: () => import('./product/product').then(m => m.ProductComponent),
        canActivate: [RoleGuard],
        data: { roles: ['admin'] }
    },
];