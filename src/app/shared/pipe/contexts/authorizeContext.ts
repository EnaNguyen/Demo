import { signalStore, withState, withMethods, patchState, withHooks, withComputed } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LoginUserInput, RegisterUserInput } from '../../type/users/user';
import * as CryptoJS from 'crypto-js';
import { sign } from 'node:crypto';
@Injectable({
  providedIn: 'root',
})
export class AuthorizeContext {
  private readonly STORAGE_KEY = 'users' ;
  private readonly TOKEN_KEY = 'Token';
  private readonly TOKEN_EXPIRY_KEY = 'TokenExpiry';
  private readonly REFRESH_TOKEN_KEY = 'RefreshToken';
  private readonly REFRESH_TOKEN_EXPIRY_KEY = 'RefreshTokenExpiry';
  private readonly API_URL = 'http://localhost:3000/users';
  private refreshTokenTimer: any;
  private tokenRefreshTimer: any;

    constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeTokenValidation();
  }
  private initializeTokenValidation(): void {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.validateAndRefreshToken();
    setInterval(() => {
      this.validateAndRefreshToken();
    }, 5 * 60 * 1000); 
  }
  private validateAndRefreshToken(): void {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const token = localStorage.getItem(this.TOKEN_KEY);
    const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (token && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry, 10);
      if (Date.now() <= expiryTime) {
        console.log('Token is valid');
        return;
      }
    }
    console.log('Token not found or expired. Checking RefreshToken...');
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const refreshTokenExpiry = localStorage.getItem(this.REFRESH_TOKEN_EXPIRY_KEY);

    if (refreshToken && refreshTokenExpiry) {
      const expiryTime = parseInt(refreshTokenExpiry, 10);
      if (Date.now() <= expiryTime) {
        console.log('RefreshToken is valid. Creating new Token...');
        this.TokenProcess(refreshToken);
      } else {
        console.error('RefreshToken expired. Please login again.');
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_EXPIRY_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
        alert('Your session has expired. Please login again.');
      }
    } else {
      console.warn('No RefreshToken found. User not logged in.');
    }
  }
  LoginProcess(loginUserInput:LoginUserInput) {
    const hashedPassword = CryptoJS.SHA256(loginUserInput.password).toString();   
    this.http.get<any[]>(this.API_URL).subscribe({
      next: (users) => {
        const matchedUser = users.find(user => 
          (user.username === loginUserInput.username || user.email === loginUserInput.username) && 
          user.password === hashedPassword
        );

        if (matchedUser) {
          console.log('Login successful:', matchedUser);
          alert(`Login successful! Welcome ${matchedUser.name}`);
          if (this.platformId && isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(matchedUser));
          }
          this.RefreshTokenProcess(matchedUser.username);
        } else {
          console.error('Login failed: Invalid username/email or password');
          alert('Login failed: Invalid username/email or password');
        }
      },
      error: (err) => {
        console.error('Failed to fetch users:', err);
        alert('Failed to connect to server');
      }
    });
  }
  RegisterProcess(registerUserInput:RegisterUserInput) {
    const hashedPassword = CryptoJS.SHA256(registerUserInput.password).toString();
    this.http.get<any[]>(this.API_URL).subscribe({
      next: (users) => {
        const isUsernameExists = users.some(user => user.username === registerUserInput.username);
        const isEmailExists = users.some(user => user.email === registerUserInput.email);

        if (isUsernameExists) {
          alert('Username already exists');
          return;
        }

        if (isEmailExists) {
          alert('Email already exists');
          return;
        }

        const newUser = {
          name: registerUserInput.fullName,
          username: registerUserInput.username,
          email: registerUserInput.email,
          password: hashedPassword,
          role: 'customer',
          id: Date.now()
        }

        this.http.post(this.API_URL, newUser).subscribe({
          next: () => {
            console.log('Registration successful:', newUser);
            alert('Registration successful!');
          },
          error: (err) => {
            console.error('Failed to register user:', err);
            alert('Failed to register user');
          }
        });
      },
      error: (err) => {
        console.error('Failed to fetch users:', err);
        alert('Failed to connect to server');
      }
    });
  }
  TokenProcess(refreshToken: string) {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const newToken = CryptoJS.SHA256(
      refreshToken + Date.now() + Math.random().toString(36).substring(2, 15)
    ).toString();
    const tokenExpiry = Date.now() + 30 * 60 * 1000; 
    localStorage.setItem(this.TOKEN_KEY, newToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, tokenExpiry.toString());
    console.log('New Token created:', newToken);
    console.log('Token expires at:', new Date(tokenExpiry).toISOString());
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
    }

    this.tokenRefreshTimer = setInterval(() => {
      if (this.isRefreshTokenValid()) {
        console.log('Auto-refreshing token...');
        const currentRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        if (currentRefreshToken) {
          this.TokenProcess(currentRefreshToken);
        }
      } else {
        if (this.tokenRefreshTimer) {
          clearInterval(this.tokenRefreshTimer);
        }
      }
    }, 30 * 60 * 1000);
  }
  RefreshTokenProcess(username: string) {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const refreshToken = CryptoJS.SHA256(
      username + Date.now() + Math.random().toString(36).substring(2, 15)
    ).toString();
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(this.REFRESH_TOKEN_EXPIRY_KEY, expiryTime.toString());

    console.log('RefreshToken created:', refreshToken);
    console.log('RefreshToken expires at:', new Date(expiryTime).toISOString());
    this.TokenProcess(refreshToken);
    this.setupRefreshTokenTimer();
  }
  private setupRefreshTokenTimer(): void {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
    }
    this.checkAndValidateRefreshToken();

    this.refreshTokenTimer = setInterval(() => {
      this.checkAndValidateRefreshToken();
    }, 24 * 60 * 60 * 1000); 
  }
  private checkAndValidateRefreshToken(): void {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const expiryTimeStr = localStorage.getItem(this.REFRESH_TOKEN_EXPIRY_KEY);

    if (!refreshToken || !expiryTimeStr) {
      return;
    }
    const expiryTime = parseInt(expiryTimeStr, 10);
    const now = Date.now();
    if (now > expiryTime) {
      console.warn('RefreshToken expired! Removing from localStorage');
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_EXPIRY_KEY);
      alert('Your session has expired. Please login again.');
    } else {
      const remainingTime = expiryTime - now;
      const daysRemaining = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
      console.log(`RefreshToken is valid. Days remaining: ${daysRemaining}`);
    }
  }
  getToken(): string | null {
    if (this.platformId && isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  isTokenValid(): boolean {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return false;
    }

    const token = localStorage.getItem(this.TOKEN_KEY);
    const tokenExpiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

    if (!token || !tokenExpiryStr) {
      return false;
    }

    const expiryTime = parseInt(tokenExpiryStr, 10);
    return Date.now() <= expiryTime;
  }
  isRefreshTokenValid(): boolean {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return false;
    }

    const expiryTimeStr = localStorage.getItem(this.REFRESH_TOKEN_EXPIRY_KEY);
    if (!expiryTimeStr) {
      return false;
    }

    const expiryTime = parseInt(expiryTimeStr, 10);
    return Date.now() <= expiryTime;
  }
  clearRefreshToken(): void {
    if (this.platformId && isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_EXPIRY_KEY);
      if (this.tokenRefreshTimer) {
        clearInterval(this.tokenRefreshTimer);
      }
      if (this.refreshTokenTimer) {
        clearInterval(this.refreshTokenTimer);
      }     
      console.log('All tokens cleared');
    }
  }
  hasRefreshToken(): boolean {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return false;
    }
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return !!refreshToken;
  }
  getUserRole(): string | null {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEY);
      if (!userStr) {
        return null;
      }
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  getUser(): any | null {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEY);
      if (!userStr) {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  hasRole(requiredRoles: string[]): boolean {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return false;
    }
    if (requiredRoles.length === 0) {
      return true;
    }

    const userRole = this.getUserRole();
    return userRole ? requiredRoles.includes(userRole) : false;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isAuthenticated(): boolean {
    return !!this.getUser() && this.hasRefreshToken();
  }
  checkAuthenticationForAction(router: Router): boolean {
    if (!this.isAuthenticated()) {
      console.warn('User not authenticated. Redirecting to login...');
      alert('Vui lòng đăng nhập để thực hiện hành động này!');
      router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authorizeContext: AuthorizeContext,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return true;
    }

    const isAdminRoute = state.url.startsWith('/admin');
    
    if (isAdminRoute) {
      if (!this.authorizeContext.hasRefreshToken()) {
        console.warn('RefreshToken not found. Redirecting to login...');
        this.router.navigate(['/login']);
        return false;
      }
      const user = this.authorizeContext.getUser();
      if (!user) {
        console.warn('User not found. Redirecting to login...');
        this.router.navigate(['/login']);
        return false;
      }
      if (!this.authorizeContext.isAdmin()) {
        console.warn(`Access denied! User is not admin. Redirecting to login...`);
        alert(`Access denied! You don't have permission to access admin page.`);
        this.router.navigate(['/login']);
        return false;
      }
      return true;
    }
    if (!this.authorizeContext.isAuthenticated()) {
      console.warn('User not authenticated. Redirecting to login...');
      alert('Vui lòng đăng nhập để truy cập trang này!');
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}

