import { Injectable } from '@angular/core';
import i18next from 'i18next';

@Injectable({ providedIn: 'root' })
export class I18nService {
  changeLanguage(lang: 'en' | 'vi'): Promise<any> {
    return i18next.changeLanguage(lang);
  }

  getCurrentLanguage(): string {
    return i18next.language || 'en';
  }
  t(key: string, options?: any): string {
    return i18next.t(key, { ...options, returnObjects: false }) as string;
  }
}