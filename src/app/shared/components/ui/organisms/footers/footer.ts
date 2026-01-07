import { Component, Input, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FooterConfig } from '../../../../type/footer/footer';
import { I18nService } from '../../../../services/i18n.service';
import { TranslatePipe } from '../../../../pipe/translate/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class FooterComponent {
  @Input() config!: FooterConfig;

  private i18nService = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);
  currentLanguage = signal<string>('en-translation');

  constructor() {
    this.currentLanguage.set(this.i18nService.getCurrentLanguage());
    this.i18nService.translations$.subscribe(() => {
      this.cdr.markForCheck();
    });
    
    effect(() => {
      const newLang = this.i18nService.getCurrentLanguage();
      this.currentLanguage.set(newLang);
    });
  }

  trackByUrl(index: number, item: { url?: string }) {
    return item.url || index;
  }

  toggleLanguage(): void {
    console.log('Toggle language clicked');
    this.i18nService.setCurrentLanguage();
    this.currentLanguage.set(this.i18nService.getCurrentLanguage());
    this.cdr.markForCheck();
  }
}
