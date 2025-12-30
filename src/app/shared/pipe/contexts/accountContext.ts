import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Owner } from '../../type/owner/owner';

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class AccountContextService {
  private currentOwnerSubject = new BehaviorSubject<Owner | null>(null);
  public currentOwner$: Observable<Owner | null> = this.currentOwnerSubject.asObservable();

  constructor() {}
  setCurrentOwner(owner: Owner): void {
    this.currentOwnerSubject.next(owner);
  }
  getCurrentOwner(): Owner | null {
    return this.currentOwnerSubject.value;
  }
  clearCurrentOwner(): void {
    this.currentOwnerSubject.next(null);
  }
  validateOwner(owner: Partial<Owner>): ValidationResult {
    const errors: { [key: string]: string } = {};

    if (owner['_id'] && owner['_id'].trim() && !/^[0-9a-fA-F]{24}$/.test(owner['_id'])) {
      errors['_id'] = 'ID MongoDB không hợp lệ';
    }

    if (!owner['fullName']?.trim()) {
      errors['fullName'] = 'Họ và tên là bắt buộc';
    } else if (owner['fullName'].length < 3) {
      errors['fullName'] = 'Họ và tên phải ít nhất 3 ký tự';
    } else if (owner['fullName'].length > 100) {
      errors['fullName'] = 'Họ và tên không được vượt quá 100 ký tự';
    }

    if (!owner['gender']) {
      errors['gender'] = 'Giới tính là bắt buộc';
    } else if (!['Nam', 'Nữ', 'Khác'].includes(owner['gender'])) {
      errors['gender'] = 'Giới tính phải là Nam, Nữ hoặc Khác';
    }

    if (!owner['birthday']) {
      errors['birthday'] = 'Ngày sinh là bắt buộc';
    } else {
      const birthDate = new Date(owner['birthday']);
      if (isNaN(birthDate.getTime())) {
        errors['birthday'] = 'Ngày sinh không hợp lệ';
      } else {
        const age = this.calculateAge(birthDate);
        if (age < 18) {
          errors['birthday'] = 'Chủ cơ sở phải từ 18 tuổi trở lên';
        } else if (age > 120) {
          errors['birthday'] = 'Ngày sinh không hợp lệ';
        }
        if (owner['age'] !== undefined && owner['age'] !== age) {
          errors['age'] = `Tuổi không khớp với ngày sinh (tính được: ${age})`;
        }
      }
    }

    if (!owner['idCard']?.trim()) {
      errors['idCard'] = 'Số CCCD/CMND là bắt buộc';
    } else if (!/^\d{9,12}$/.test(owner['idCard'].trim())) {
      errors['idCard'] = 'Số CCCD phải có 9 hoặc 12 chữ số';
    }

    if (!owner['businessLicense']?.trim()) {
      errors['businessLicense'] = 'Giấy phép kinh doanh là bắt buộc';
    } else if (!/^\d{10,13}$/.test(owner['businessLicense'].trim())) {
      errors['businessLicense'] = 'Giấy phép kinh doanh không hợp lệ';
    }

    if (!owner['address']?.trim()) {
      errors['address'] = 'Địa chỉ là bắt buộc';
    } else if (owner['address'].length < 5) {
      errors['address'] = 'Địa chỉ phải ít nhất 5 ký tự';
    } else if (owner['address'].length > 200) {
      errors['address'] = 'Địa chỉ không được vượt quá 200 ký tự';
    }

    if (!owner['businessType']?.trim()) {
      errors['businessType'] = 'Loại hình kinh doanh là bắt buộc';
    } else if (owner['businessType'].length > 100) {
      errors['businessType'] = 'Loại hình kinh doanh không được vượt quá 100 ký tự';
    }

    if (!owner['taxCode']?.trim()) {
      errors['taxCode'] = 'Mã số thuế là bắt buộc';
    } else if (!/^\d{10}(-?\d{3})?$/.test(owner['taxCode'].trim())) {
      errors['taxCode'] = 'Mã số thuế không hợp lệ (10 hoặc 13 số)';
    }

    if (!owner['email']?.trim()) {
      errors['email'] = 'Email là bắt buộc';
    } else if (!this.isValidEmail(owner['email'])) {
      errors['email'] = 'Email không đúng định dạng';
    }

    if (!owner['phone']?.trim()) {
      errors['phone'] = 'Số điện thoại là bắt buộc';
    } else if (!/^0[1-9]\d{8,9}$/.test(owner['phone'].trim())) {
      errors['phone'] = 'Số điện thoại Việt Nam không hợp lệ';
    }

    if (!owner['username']?.trim()) {
      errors['username'] = 'Tên đăng nhập là bắt buộc';
    } else if (owner['username'].length < 4) {
      errors['username'] = 'Tên đăng nhập phải ít nhất 4 ký tự';
    } else if (owner['username'].length > 30) {
      errors['username'] = 'Tên đăng nhập không được vượt quá 30 ký tự';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(owner['username'])) {
      errors['username'] = 'Tên đăng nhập chỉ có thể chứa chữ cái, số, dấu chấm, gạch ngang';
    }

    if (owner['password']) {
      if (owner['password'].length < 6) {
        errors['password'] = 'Mật khẩu phải ít nhất 6 ký tự';
      } else if (owner['password'].length > 50) {
        errors['password'] = 'Mật khẩu không được vượt quá 50 ký tự';
      }
    }

    // Validate status
    if (owner['status'] && !['active', 'inactive', 'suspended', 'pending'].includes(owner['status'])) {
      errors['status'] = 'Trạng thái không hợp lệ';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  private calculateAge(birthday: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  }
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }
}