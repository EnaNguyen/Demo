import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthorizeContext } from '../../../shared/pipe/contexts/authorizeContext';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  isLogin = true;
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  show2FA = false;
  otp = '';

  constructor(private fb: FormBuilder, private authorizeContext: AuthorizeContext) {}

  ngOnInit(): void {
    this.initializeForms();
    this.show2FA = sessionStorage.getItem('show2FA') === 'true';
  }
  initializeForms(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        username: ['', [Validators.required, Validators.minLength(4)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  toggleMode(): void {
    console.log('Before toggle - isLogin:', this.isLogin);
    this.isLogin = !this.isLogin;
    console.log('After toggle - isLogin:', this.isLogin);
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      this.authorizeContext.LoginProcess(this.loginForm.value as any);
    }
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      this.authorizeContext.RegisterProcess(this.registerForm.value as any);
    }
  }

  verifyOTP(): void {
    if (this.otp.trim()) {
      this.authorizeContext.VerifyOTP(this.otp);
    }
  }

  resendOTP(): void {
    const username = sessionStorage.getItem('pendingUsername');
    if (username) {
      this.authorizeContext.ResendOTP(username);
      this.otp = ''; 
    }
  }
}
