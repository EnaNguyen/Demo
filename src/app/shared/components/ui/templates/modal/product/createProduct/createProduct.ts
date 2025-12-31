import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { updateProduct } from '../../../../../../data/updateModels/product/product';
import { ProductContext } from '../../../../../../pipe/contexts/productContext';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  selector: 'app-create-product',
  templateUrl: './createProduct.html',
  styleUrls: ['./createProduct.css'],
})
export class CreateProductComponent {
  isModalOpen = false;
  productForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productContext: ProductContext
  ) {
    this.initForm();
  }

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
        id: Date.now(), 
        name: this.productForm.value.name,
        brand: this.productForm.value.brand,
        quantity: this.productForm.value.quantity,
        status: this.productForm.value.status,
        price: this.productForm.value.price,
        imageUrl: this.imageType === 'url' ? this.productForm.value.imageUrl : undefined,
        imageLocate: this.imageType === 'file' ? this.selectedFileName : undefined,
        description: this.productForm.value.description || ''
      };
      try {
        this.productContext.createProduct(newProduct);
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