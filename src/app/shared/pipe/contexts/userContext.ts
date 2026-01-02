import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { userInfoView } from '../../data/viewModels/userView';

@Injectable({
  providedIn: 'root',
})
export class UserContext {
  private readonly STORAGE_KEY = 'user';
  private currentUserId = 1;
  private userSubject = new BehaviorSubject<userInfoView | null>(null);
  public user$: Observable<userInfoView | null> = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadUser();
  }

  private loadUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const user = JSON.parse(stored) as userInfoView;
          this.userSubject.next(user);
          return;
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    }

    this.http.get<any>('/data.json').subscribe({
      next: (data) => {
        const users = data.users || [];
        const user = users.find((u: any) => u.id === this.currentUserId);
        if (user) {
          const userInfo: userInfoView = {
            id: user.id,
            name: user.name,
            email: user.email,
          };
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userInfo));
          }
          this.userSubject.next(userInfo);
        } else {
          this.userSubject.next(null);
        }
      },
      error: (err) => {
        console.error('Failed to load data.json', err);
        this.userSubject.next(null);
      },
    });
  }

  getCurrentUser(): userInfoView | null {
    return this.userSubject.value;
  }
}