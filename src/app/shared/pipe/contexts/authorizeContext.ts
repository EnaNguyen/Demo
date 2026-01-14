import {
  signalStore,
  withState,
  withMethods,
  patchState,
  withHooks,
  withComputed,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LoginUserInput, RegisterUserInput } from '../../type/users/user';
import * as CryptoJS from 'crypto-js';
import { sign } from 'node:crypto';
import { environment } from '../../../../environments/environment';
interface LoginResponse {
  responseCode: number;
  result: string;
  errorMessage: string | null;
  data: {
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    role?: string;
    requires2FA?: boolean;
    message?: string;
  };
}
interface ResponseCode 
{
    data: any,
    errorMessage: string,
    responseCode: number,
    result: string
}
@Injectable({
  providedIn: 'root',
})
export class AuthorizeContext {
  private readonly STORAGE_KEY = 'username';
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly API_URL = environment.apiUrl + '/Authentication';
  private refreshTokenTimer: any;
  private tokenRefreshTimer: any;
  private router = inject(Router);
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
    if (token) {
      console.log('Token is valid');
      return;
    }
    console.log('Token not found or expired. Checking RefreshToken...');
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      console.warn('No RefreshToken found. User not logged in.');
    }
  }
  LoginProcess(credentials: { username: string; password: string }): void {
    const loginUrl = `${this.API_URL}/login?username=${encodeURIComponent(
      credentials.username
    )}&password=${encodeURIComponent(credentials.password)}`;

    this.http.post<LoginResponse>(loginUrl, {}).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          if (response.data.requires2FA) {
            sessionStorage.setItem('pendingUsername', credentials.username);
            sessionStorage.setItem('show2FA', 'true');
            window.location.reload();
            console.log('2FA required - OTP sent to email');
          } else if (response.data.accessToken && response.data.refreshToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            localStorage.setItem('username', response.data.username || '');
            localStorage.setItem('role', response.data.role || '');
            alert('Login successfully');
            this.router.navigate(['/']);
          }
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
      },
    });
  }

  VerifyOTP(otp: string): void {
    const username = sessionStorage.getItem('pendingUsername');
    const verifyUrl = `${this.API_URL}/verify-otp?username=${encodeURIComponent(
      username || ''
    )}&otp=${encodeURIComponent(otp)}`;

    this.http.post<LoginResponse>(verifyUrl, {}).subscribe({
      next: (response) => {
        if (response.responseCode === 200 && response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken || '');
          localStorage.setItem('username', response.data.username || '');
          localStorage.setItem('role', response.data.role || '');
          sessionStorage.removeItem('pendingUsername');
          sessionStorage.removeItem('show2FA');
          console.log('2FA verification successful');
          alert("Welcome back"+ response.data.username)
          this.router.navigate(['/']);
        } else {
          alert('Mã OTP không hợp lệ');
        }
      },
      error: (error) => {
        console.error('OTP verification failed:', error);
        alert('Xác thực OTP thất bại');
      },
    });
  }

  ResendOTP(username: string): void {
    const resendUrl = `${this.API_URL}/ResentOtp?username=${username}`;

    this.http.get<LoginResponse>(resendUrl, {}).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          alert('Mã OTP mới đã được gửi đến email của bạn');
          console.log('OTP resent successfully');
        } else {
          alert('Gửi lại OTP thất bại');
        }
      },
      error: (error) => {
        console.error('Resend OTP failed:', error);
        alert('Lỗi khi gửi lại mã OTP');
      },
    });
  }
  RegisterProcess(registerUserInput: RegisterUserInput) {
    const newUser = {
      Fullname: registerUserInput.fullName,
      Username: registerUserInput.username,
      Password: registerUserInput.password,
      ReEnterPassword: registerUserInput.confirmPassword,
      Email: registerUserInput.email,
      Role: 'Customer',
    };
    this.http.post<ResponseCode>(environment.apiUrl + '/User/CreateUser', newUser).subscribe({
      next: (response) => {
        console.log(response)
        if(response.responseCode!=201)
        {
          alert("Không thể đăng ký mới. Nguyên nhân: "+ response.errorMessage)
        }
        else
          alert("Đăng ký tài khoản mới thành công")
          window.location.reload();
      },
      error: (err) => {
        console.error('Failed to register user:', err);
        alert('Failed to register user');
      },
    });
  }
  TokenProcess(refreshToken: string) {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const newToken = CryptoJS.SHA256(
      refreshToken + Date.now() + Math.random().toString(36).substring(2, 15)
    ).toString();
    console.log('New Token created:', newToken);
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
    console.log('RefreshToken created:', refreshToken);
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

    if (!refreshToken) {
      return;
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

    if (!token) {
      return false;
    }
    return true;
  }
  isRefreshTokenValid(): boolean {
    if (!this.platformId || !isPlatformBrowser(this.platformId)) {
      return false;
    }
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return false;
    }
    return true;
  }
  clearRefreshToken(): void {
    if (this.platformId && isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
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
      const userRole = localStorage.getItem('role');
      if (!userRole) {
        return null;
      }
      return userRole.toLowerCase();
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
      return userStr;
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
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authorizeContext: AuthorizeContext,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
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
