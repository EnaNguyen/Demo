import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FooterConfig } from '../../../../type/footer/footer'; 
import { I18nService } from '../../../../services/i18n.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  @Input() config!: FooterConfig;
  private i18nService = inject(I18nService);
  
  currentLanguage = this.i18nService.language$;

  trackByUrl(index: number, item: { url?: string }) {
    return item.url || index;
  }

  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }
}