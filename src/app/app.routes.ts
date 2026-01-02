import { Routes } from '@angular/router';
import { USER_ROUTES } from './features/user/user.routes';
import { ADMIN_ROUTES } from './features/admin/admin.routes';
import { UserLayoutComponent } from './shared/components/layout/userLayout';
import { HomeComponent } from './home/home';
import { RoleGuard } from './shared/pipe/contexts/authorizeContext';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'login',
    loadComponent: () => import('./features/user/login/login').then(m => m.Login)
  },
  {
    path: '',
    component: UserLayoutComponent,
    children: USER_ROUTES
  },
  {
    path: 'admin',
    children: ADMIN_ROUTES
  },
];
