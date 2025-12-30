import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../../type/filter/filter';

@Component({
  selector: 'app-filter-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-page-container">
      <label class="filter-page-label">{{ filterOption.title }}</label>
      <div class="pagination-controls">
        <div class="pagination-group">
          <label for="page-input">Trang:</label>
          <input 
            type="number" 
            id="page-input"
            [(ngModel)]="currentPage"
            (change)="onPageChange()"
            [min]="1"
            class="pagination-input"
          />
          <span class="pagination-divider">/</span>
          <span class="total-pages">{{ totalPages }}</span>
        </div>
        
        <div class="pagination-group">
          <label for="pagesize-input">Mục/trang:</label>
          <input 
            type="number" 
            id="pagesize-input"
            [(ngModel)]="pageSize"
            (change)="onPageChange()"
            [min]="1"
            class="pagination-input"
          />
        </div>
      </div>
      
      <div class="pagination-buttons">
        <button 
          (click)="previousPage()" 
          [disabled]="currentPage <= 1"
          class="pagination-btn"
        >
          ← Trước
        </button>
        <button 
          (click)="nextPage()" 
          [disabled]="currentPage >= totalPages"
          class="pagination-btn"
        >
          Sau →
        </button>
      </div>
      
      <div class="pagination-info">
        <span>Hiển thị {{ (currentPage - 1) * pageSize + 1 }} - {{ currentPage * pageSize }} trong tổng</span>
      </div>
    </div>
  `,
  styles: [`
    .filter-page-container {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .filter-page-label {
      display: block;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
      font-size: 14px;
    }

    .pagination-controls {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .pagination-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pagination-group > label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
      white-space: nowrap;
    }

    .pagination-input {
      width: 50px;
      padding: 4px 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
    }

    .pagination-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .pagination-divider {
      color: #ccc;
      font-weight: bold;
    }

    .total-pages {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .pagination-buttons {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
    }

    .pagination-btn {
      padding: 6px 12px;
      border: 1px solid #1976d2;
      background-color: #fff;
      color: #1976d2;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background-color: #1976d2;
      color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: #ccc;
      color: #999;
    }

    .pagination-info {
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  `]
})
export class FilterPageComponent implements OnInit {
  @Input() filterOption!: FilterOption;
  @Output() filterChange = new EventEmitter<any>();

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 5;

  ngOnInit(): void {
    if (this.filterOption.request.page) {
      this.currentPage = this.filterOption.request.page;
    }
    if (this.filterOption.request.pageSize) {
      this.pageSize = this.filterOption.request.pageSize;
    }
  }

  onPageChange(): void {
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.emitChange();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.emitChange();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.emitChange();
    }
  }

  emitChange(): void {
    this.filterChange.emit({
      type: this.filterOption.type,
      page: this.currentPage,
      pageSize: this.pageSize
    });
  }
}
