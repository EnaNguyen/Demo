import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  FooterConfig
} from '../../../../type/footer/footer'; 

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  @Input() config!: FooterConfig;

  trackByUrl(index: number, item: { url?: string }) {
    return item.url || index;
  }
}