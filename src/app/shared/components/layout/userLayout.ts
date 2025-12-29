import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-layout',
  imports: [RouterOutlet],
  template: `
    <div class="user-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .user-layout {
      padding: 20px;
    }
  `]    
})
export class UserLayout {}
