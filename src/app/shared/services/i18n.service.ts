import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguage = signal<'en-US' | 'vi-VN'>('en-US');
  public language$ = this.currentLanguage.asReadonly();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const savedLanguage = localStorage.getItem('i18n-language') as 'en-US' | 'vi-VN' | null;
      if (savedLanguage && ['en-US', 'vi-VN'].includes(savedLanguage)) {
        this.currentLanguage.set(savedLanguage);
      } else {
        const browserLang = navigator.language;
        if (browserLang.startsWith('vi')) {
          this.currentLanguage.set('vi-VN');
        }
      }

      // Save language to localStorage whenever it changes (only on browser)
      effect(() => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('i18n-language', this.currentLanguage());
        }
      });
    }
  }

  getCurrentLanguage(): 'en-US' | 'vi-VN' {
    return this.currentLanguage();
  }

  setLanguage(language: 'en-US' | 'vi-VN'): void {
    this.currentLanguage.set(language);
  }

  toggleLanguage(): void {
    const current = this.currentLanguage();
    this.currentLanguage.set(current === 'en-US' ? 'vi-VN' : 'en-US');
  }
}
