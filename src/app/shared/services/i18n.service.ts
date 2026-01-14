import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private currentLang = 'en-translation';
  private translations: { [key: string]: string } = {};
  private translationsSubject = new BehaviorSubject<{ [key: string]: string }>({});
  translations$ = this.translationsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTranslations(this.currentLang);
  }
  getCurrentLanguage(): string {
    return this.currentLang;
  }
  setCurrentLanguage(lang?: string) {
    if (lang) {
      this.currentLang = lang;
    } else {
      this.currentLang = this.currentLang === 'en-translation' ? 'vi-translation' : 'en-translation';
    }
    this.loadTranslations(this.currentLang);
  }
  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; 
      }
    }   
    return typeof value === 'string' ? value : key;
  }
  private loadTranslations(lang: string) {
    console.log(`Loading translations for ${lang}...`);
    this.http
      .get<{ [key: string]: any }>(`assets/i18n/${lang}.json`)
      .pipe(
        tap((data) => {
          console.log(`Translations loaded for ${lang}:`, data);
          this.translations = data;
          this.translationsSubject.next(data);
        })
      )
      .subscribe({
        error: (err) => {
          console.error(`Không tải được file i18n cho ${lang}`, err);
          this.translations = {};
          this.translationsSubject.next({});
        },
      });
  }
}
