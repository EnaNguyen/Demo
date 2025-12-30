import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderConfig } from '../../type/header/header';
import { FooterConfig } from '../../type/footer/footer';
import { HeaderComponent } from '../ui/organisms/header/header';
import { FooterComponent } from '../ui/organisms/footers/footer';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './userLayout.html',
  styleUrls: ['./userLayout.css']
})
export class UserLayoutComponent {

  headerConfig: HeaderConfig = {
    left: {
      imgSrc: '/assets/logo.png',
      title: 'MyShop',
      url: '/'
    },
    center: {
      menu: [
        { title: 'Trang chủ', url: '/' },
        { title: 'Sản phẩm', url: '/products' },
        { title: 'Khuyến mãi', url: '/promotions' },
        { title: 'Liên hệ', url: '/contact' }
      ]
    },
    right: [
      {
        icons: [
          { title: 'Tìm kiếm', url: '/search', iconSrc: '/assets/icons/search.svg' },
          { title: 'Yêu thích', url: '/wishlist', iconSrc: '/assets/icons/heart.svg' },
          { title: 'Giỏ hàng', url: '/cart', iconSrc: '/assets/icons/cart.svg' }
        ]
      },
      {
        dropdownList: [
          { title: 'Hồ sơ', url: '/profile', iconSrc: '/assets/icons/user.svg' },
          { title: 'Đơn hàng', url: '/history', iconSrc: '/assets/icons/orders.svg' },
          { title: 'Đăng xuất', url: '/logout', iconSrc: '/assets/icons/logout.svg' }
        ]
      }
    ]
  };

  footerConfig: FooterConfig = {
    info: {
      Name: 'MyShop Store',
      Email: 'contact@myshop.com',
      Phone: '+84 9 1234 5678',
      Address: '123 Đường ABC, TP. Hồ Chí Minh, Việt Nam'
    },
    iconLinks: [
      { iconSrc: '/assets/icons/facebook.svg', url: 'https://facebook.com', hoverText: 'Facebook' },
      { iconSrc: '/assets/icons/twitter.svg', url: 'https://twitter.com', hoverText: 'Twitter' },
      { iconSrc: '/assets/icons/instagram.svg', url: 'https://instagram.com', hoverText: 'Instagram' },
      { iconSrc: '/assets/icons/linkedin.svg', url: 'https://linkedin.com', hoverText: 'LinkedIn' }
    ],
    titlesLinks: [
      { title: 'Về chúng tôi', url: '/about' },
      { title: 'Chính sách bảo mật', url: '/privacy' },
      { title: 'Điều khoản dịch vụ', url: '/terms' },
      { title: 'Hướng dẫn mua hàng', url: '/guide' },
      { title: 'Liên hệ hỗ trợ', url: '/support' }
    ],
    column: 5
  };

  trackByUrl(index: number, item: any) {
    return item.url;
  }
}
