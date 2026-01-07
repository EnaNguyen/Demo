import { Pipe, PipeTransform, inject, ChangeDetectorRef } from '@angular/core';
import { I18nService } from '../../services/i18n.service';

@Pipe({
  name: 'translate',
  pure: false, 
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  private i18nService = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Subscribe to translations changes to trigger pipe re-evaluation
    this.i18nService.translations$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    return this.i18nService.translate(key);
  }
}