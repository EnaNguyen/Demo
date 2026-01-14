import { Component, OnInit,inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-payment-success',
  templateUrl: './PaymentSuccess.html',
  styleUrls: ['./PaymentSuccess.css']
})
export class PaymentSuccess implements OnInit {
  status: string = '';
  orderId: string = '';
  transactionId: string = '';
  countdown: number = 5;
  private countdownInterval: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.status = params['status'] || '';
      this.orderId = params['orderId'] || '';
      this.transactionId = params['transactionId'] || '';
    });
    this.UpdateStatusOrder();
    this.startCountdown();
  }

  UpdateStatusOrder(): void {
    console.log('Đang cập nhật trạng thái đơn hàng:', this.orderId);

  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.closeWindow();
      }
    }, 1000);
  }

  closeWindow(): void {
    window.close();
    if (!window.closed) {
      window.location.href = "http://localhost:4200/cart";
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}