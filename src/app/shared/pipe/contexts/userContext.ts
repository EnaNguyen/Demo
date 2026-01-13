import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { userInfoView } from '../../data/viewModels/userView';
import { AuthorizeContext } from '../contexts/authorizeContext';
import { environment } from '../../../../environments/environment.development';
@Injectable({
  providedIn: 'root',
})
export class UserContext {
  private readonly STORAGE_KEY = 'user';
  private currentUser = localStorage.getItem('username');
  private userSubject = new BehaviorSubject<userInfoView | null>(null);
  public user$: Observable<userInfoView | null> = this.userSubject.asObservable();
  private readonly API_URL = environment.apiUrl + '/User';
  constructor(
    private http: HttpClient,
    private authorizeContext: AuthorizeContext,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadUser();
  }

  private loadUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get<any>(this.API_URL + '/ListUser?username=' + this.currentUser).subscribe({
        next: (data) => {
          const users = data.users || [];
          const user = users.find((u: any) => u.username === this.currentUser);
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
  }
}
