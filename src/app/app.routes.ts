import { Routes } from '@angular/router';
import { USER_ROUTES } from './features/user/user.routes';
import { ADMIN_ROUTES } from './features/admin/admin.routes';
import { UserLayoutComponent } from './shared/components/layout/userLayout';
import { HomeComponent } from './home/home';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: '',
    component: UserLayoutComponent,
    children: USER_ROUTES
  },
  {
    path: 'admin',
    component: UserLayoutComponent,
    children: ADMIN_ROUTES
  }
];
