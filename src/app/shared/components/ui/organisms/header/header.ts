import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  HeaderConfig,
  HeaderLeft,
  HeaderRightItem,
  HeaderRightGroup,
  HeaderCenter
} from '../../../../type/header/header'; 


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  @Input() config!: HeaderConfig;

  @Input() left?: HeaderLeft;
  @Input() right: HeaderRightGroup[] = [];
  @Input() center?: HeaderCenter;


  trackByUrl(index: number, item: { url: string }) {
    return item.url;
  }
}