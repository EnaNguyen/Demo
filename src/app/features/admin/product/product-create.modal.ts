import { ChangeDetectionStrategy, Component, Input, NgModule, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductModel } from '../product/model/product.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ProductStore } from './product-store';
import { updateProduct } from '../product/model/product.model';
@Component({
  selector: 'ngrx-product-create-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Tiêu đề Modal</h4>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="activeModal.dismiss('Cross click')"
      ></button>
    </div>
    <div class="modal-body">
      <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
        <div class="form-container">
          <div class="form-column">
            <div class="form-group">
              <label for="name">Tên sản phẩm <span class="required">*</span></label>
              <input
                type="text"
                id="name"
                formControlName="name"
                placeholder="Nhập tên sản phẩm"
                [class.error]="productForm.get('name')?.invalid && productForm.get('name')?.touched"
              />
              <span
                class="error-message"
                *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched"
              >
                Tên sản phẩm là bắt buộc
              </span>
            </div>

            <div class="form-group">
              <label for="brand">Thương hiệu <span class="required">*</span></label>
              <input
                type="text"
                id="brand"
                formControlName="brand"
                placeholder="Nhập thương hiệu"
                [class.error]="
                  productForm.get('brand')?.invalid && productForm.get('brand')?.touched
                "
              />
              <span
                class="error-message"
                *ngIf="productForm.get('brand')?.invalid && productForm.get('brand')?.touched"
              >
                Thương hiệu là bắt buộc
              </span>
            </div>

            <div class="form-group">
              <label for="price">Giá <span class="required">*</span></label>
              <input
                type="number"
                id="price"
                formControlName="price"
                placeholder="Nhập giá sản phẩm"
                [class.error]="
                  productForm.get('price')?.invalid && productForm.get('price')?.touched
                "
              />
              <span
                class="error-message"
                *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched"
              >
                Giá phải lớn hơn 0
              </span>
            </div>

            <div class="form-group">
              <label for="quantity">Số lượng <span class="required">*</span></label>
              <input
                type="number"
                id="quantity"
                formControlName="quantity"
                placeholder="Nhập số lượng"
                [class.error]="
                  productForm.get('quantity')?.invalid && productForm.get('quantity')?.touched
                "
              />
              <span
                class="error-message"
                *ngIf="productForm.get('quantity')?.invalid && productForm.get('quantity')?.touched"
              >
                Số lượng phải lớn hơn hoặc bằng 0
              </span>
            </div>

            <div class="form-group">
              <label for="releaseDate">Ngày phát hành</label>
              <input type="date" id="releaseDate" formControlName="releaseDate" />
            </div>

            <div class="form-group">
              <label for="status">Trạng thái</label>
              <select id="status" formControlName="status">
                <option [ngValue]="1">Hoạt động</option>
                <option [ngValue]="0">Không hoạt động</option>
              </select>
            </div>
          </div>

          <div class="form-column">
            <div class="form-group">
              <label>Loại hình ảnh</label>
              <div class="image-type-selector">
                <div class="radio-option">
                  <input
                    type="radio"
                    id="imageTypeUrl"
                    name="imageType"
                    value="url"
                    [(ngModel)]="imageType"
                    [ngModelOptions]="{ standalone: true }"
                    (change)="onImageTypeChange()"
                  />
                  <label for="imageTypeUrl">URL</label>
                </div>
                <div class="radio-option">
                  <input
                    type="radio"
                    id="imageTypeFile"
                    name="imageType"
                    value="file"
                    [(ngModel)]="imageType"
                    [ngModelOptions]="{ standalone: true }"
                    (change)="onImageTypeChange()"
                  />
                  <label for="imageTypeFile">Local File</label>
                </div>
              </div>
            </div>

            <div class="form-group" *ngIf="imageType === 'url'">
              <label for="imageUrl">URL hình ảnh</label>
              <input
                type="text"
                id="imageUrl"
                formControlName="imageUrl"
                placeholder="Nhập URL hình ảnh"
                (input)="onImageUrlChange()"
              />
            </div>

            <div class="form-group" *ngIf="imageType === 'file'">
              <div
                class="file-upload-area"
                [class.drag-over]="isDragOver"
                (click)="fileInput.click()"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
              >
                <div class="upload-icon">📁</div>
                <div class="upload-text">Kéo thả file vào đây hoặc click để chọn</div>
                <div class="upload-hint">Hỗ trợ: JPG, PNG, GIF (Tối đa 5MB)</div>
                <input
                  #fileInput
                  type="file"
                  class="file-input-hidden"
                  accept="image/*"
                  (change)="onFileSelected($event)"
                />
              </div>

              <div class="selected-file" *ngIf="selectedFileName">
                <span class="file-name">{{ selectedFileName }}</span>
                <button type="button" class="remove-file" (click)="removeFile()">✕</button>
              </div>
            </div>

            <div class="image-preview">
              <img
                *ngIf="previewImageUrl"
                [src]="previewImageUrl"
                alt="Preview"
                onerror="this.style.display='none'"
              />
              <div class="no-image" *ngIf="!previewImageUrl">Chưa có hình ảnh</div>
            </div>
          </div>

          <div class="form-column full-width">
            <div class="form-group">
              <label for="description">Mô tả</label>
              <textarea
                id="description"
                formControlName="description"
                rows="4"
                placeholder="Nhập mô tả sản phẩm"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">
            Hủy
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="productForm.invalid">
            {{ 'Thêm sản phẩm' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./css/createProduct.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProductModal {
  isModalOpen = false;
  productForm!: FormGroup;
  @Input() product: ProductModel[] = [];
  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.initForm();
  }

  private productStore = inject(ProductStore);
  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      releaseDate: [''],
      brand: ['', Validators.required],
      imageUrl: [''],
      description: [''],
      quantity: [0, [Validators.required, Validators.min(0)]],
      status: [1],
    });
  }
  save() {
    this.activeModal.close('saved');
  }
  imageType: string = 'url';
  selectedFileName: string = '';
  previewImageUrl: string = '';
  isDragOver: boolean = false;

  onImageTypeChange() {
    if (this.imageType === 'url') {
      this.selectedFileName = '';
      this.previewImageUrl = this.productForm.get('imageUrl')?.value || '';
    } else {
      this.previewImageUrl = '';
    }
  }

  onImageUrlChange() {
    this.previewImageUrl = this.productForm.get('imageUrl')?.value || '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.previewFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFileName = files[0].name;
      this.previewFile(files[0]);
    }
  }

  previewFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImageUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeFile() {
    this.selectedFileName = '';
    this.previewImageUrl = '';
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.productForm.reset();
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const newProduct: updateProduct = {
        name: this.productForm.value.name,
        brand: this.productForm.value.brand,
        quantity: this.productForm.value.quantity,
        status: Number(this.productForm.value.status),
        price: this.productForm.value.price,
        imageUrl: this.imageType === 'url' ? this.productForm.value.imageUrl : undefined,
        imageLocate: this.imageType === 'file' ? this.selectedFileName : undefined,
        description: this.productForm.value.description || '',
      };
      try {
        this.productStore.createProduct(newProduct);
        this.closeModal();
        console.log('Created Product:', newProduct);
      } catch (error) {
        console.error('Error creating product:', error);
      }
    }
  }

  get f() {
    return this.productForm.controls;
  }
}
