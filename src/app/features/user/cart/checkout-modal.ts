import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserContext } from '../../../shared/pipe/contexts/userContext';
import { userInfoView } from '../../../shared/data/viewModels/userView';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout-modal.html',
  styleUrl: './checkout-modal.css',
})
export class CheckoutModalComponent implements OnInit {
  private userContext = inject(UserContext);
  private modalRef: NgbModalRef | null = null;
  receiverName = signal('');
  address = signal('');
  phone = signal('');
  currentUser = signal<userInfoView | null>(null);

  constructor(private modalService: NgbModal) {}
  ngOnInit(): void {    }
  getFormData(): any {
    return {
      receiverName: this.receiverName(),
      address: this.address(),
      phone: this.phone(),
      method: ''
    };
  }

  submitCheckout(method: string): void {
    const formData = this.getFormData();
    formData.method  = method
    console.log('Checkout form data:', formData);
    if (this.modalRef) {
      this.modalRef.close(formData);
    }
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.dismiss();
    }
  }

  setModalRef(ref: NgbModalRef): void {
    this.modalRef = ref;
  }
}
