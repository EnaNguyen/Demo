import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { updateProduct } from '../../../../../../data/updateModels/product/product';
import { ProductStore } from '../../../../../../pipe/contexts/productContext';
interface Property {
  label: string;
  value: any;
}

interface DataObject {
  key: number;
  id?: string | number; 
  properties: Property[];
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  selector: 'app-update-product',
  templateUrl: './updateProduct.html',
  styleUrls: ['./updateProduct.css'],
})
export class UpdateProductComponent {
  isModalOpen = false;
  productForm!: FormGroup;
  currentProductKey: number | null = null;
  currentProductServerId: string | number | undefined;
  private productStore = inject(ProductStore);

  constructor(
    private fb: FormBuilder
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
  editProduct(product: DataObject): void {
    this.currentProductKey = product.key;
    this.currentProductServerId = product.id; // Store the server ID

    const formData: any = {};

    product.properties.forEach((prop) => {
      formData[prop.label] = prop.value;
    });

    this.productForm.patchValue(formData);
    const imageUrlValue = this.productForm.get('imageUrl')?.value;
    if (this.imageType === 'url' && imageUrlValue) {
    this.previewImageUrl = imageUrlValue;
  } else if (this.imageType === 'upload') {
    this.previewImageUrl = '';
    this.selectedFileName = '';
  }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.productForm.reset();
    this.currentProductKey = null;
    this.currentProductServerId = undefined;
  }

  onSubmit(): void {
    if (this.productForm.valid) {
        let updatedProduct:updateProduct = {
            id: this.currentProductServerId as number, 
            name: this.productForm.value.name,
            brand: this.productForm.value.brand,
            quantity: this.productForm.value.quantity,
            status: Number(this.productForm.value.status),
            price: this.productForm.value.price,
            imageUrl: this.imageType ==='url' ? this.productForm.value.imageUrl : undefined,
            imageLocate: this.imageType ==='file' ? this.selectedFileName : undefined
        };
        try{
            this.productStore.updateProduct({ id: this.currentProductServerId as number, update: updatedProduct });
            this.closeModal();
            console.log('Updated Product:', updatedProduct);
        }
        catch(error){
            console.error('Error updating product:', error);
        }
    }
  }
  get f() {
    return this.productForm.controls;
  }
}
