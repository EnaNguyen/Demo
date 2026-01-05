import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Pipe({
  name: 'translate',
  pure: false,
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  private i18nService = inject(I18nService);
  private translations: any = {
    'en-US': {
      'userProduct.detail': 'View Details',
      'userProduct.paused': 'Stop Selling',
      'language.toggle': 'Tiếng Việt',
      'language.current': 'English'
    },
    'vi-VN': {
      'userProduct.detail': 'Xem chi tiết',
      'userProduct.paused': 'Ngừng Kinh Doanh',
      'language.toggle': 'English',
      'language.current': 'Tiếng Việt'
    }
  };

  transform(key: string, options?: any): string {
    const lang = this.i18nService.getCurrentLanguage();
    const langTranslations = this.translations[lang] || this.translations['en-US'];
    return langTranslations[key] || key;
  }
}
