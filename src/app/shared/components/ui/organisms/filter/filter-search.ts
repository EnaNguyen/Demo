import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../../type/filter/filter';

@Component({
  selector: 'app-filter-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-search-container">
      <label class="filter-search-label" [for]="'search-' + filterOption.title">
        {{ filterOption.title }}
      </label>
      <div class="search-input-wrapper">
        <input 
          type="text" 
          [id]="'search-' + filterOption.title"
          [(ngModel)]="searchValue"
          (input)="onSearchChange()"
          placeholder="Tìm kiếm..."
          class="filter-search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>
  `,
  styles: [`
    .filter-search-container {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .filter-search-label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
      font-size: 14px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .filter-search-input {
      width: 100%;
      padding: 8px 12px 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
      transition: all 0.3s ease;
    }

    .filter-search-input::placeholder {
      color: #999;
    }

    .filter-search-input:hover {
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .filter-search-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
    }

    .search-icon {
      position: absolute;
      right: 12px;
      color: #999;
      pointer-events: none;
      font-size: 14px;
    }
  `]
})
export class FilterSearchComponent implements OnInit {
  @Input() filterOption!: FilterOption;
  @Output() filterChange = new EventEmitter<any>();

  searchValue: string = '';

  ngOnInit(): void {
    this.searchValue = (this.filterOption.request.value as string) || '';
  }

  onSearchChange(): void {
    this.filterChange.emit({
      type: this.filterOption.type,
      value: this.searchValue
    });
  }
}
