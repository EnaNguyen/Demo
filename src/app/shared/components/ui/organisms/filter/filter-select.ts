import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../../type/filter/filter';

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-select-container">
      <label class="filter-select-label" [for]="'select-' + filterOption.title">
        {{ filterOption.title }}
      </label>
      <select 
        [id]="'select-' + filterOption.title"
        [(ngModel)]="selectedValue"
        (change)="onSelectChange()"
        class="filter-select-input"
      >
        <option [value]="null">-- Chọn --</option>
        <option *ngFor="let item of items" [value]="item">
          {{ item }}
        </option>
      </select>
    </div>
  `,
  styles: [`
    .filter-select-container {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .filter-select-label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
      font-size: 14px;
    }

    .filter-select-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
      background-color: #fff;
      color: #333;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-select-input:hover {
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .filter-select-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
    }

    .filter-select-input option {
      padding: 6px;
      color: #333;
    }
  `]
})
export class FilterSelectComponent implements OnInit {
  @Input() filterOption!: FilterOption;
  @Output() filterChange = new EventEmitter<any>();

  selectedValue: any = null;
  items: any[] = [];

  ngOnInit(): void {
    const value = this.filterOption.request.value;
    if (Array.isArray(value)) {
      this.items = value;
    }

    const sel = this.filterOption.request.selected !== undefined ? this.filterOption.request.selected : (Array.isArray(value) ? value[0] : value);
    this.selectedValue = sel || null;
  }

  onSelectChange(): void {
    this.filterChange.emit({
      type: this.filterOption.type,
      value: this.selectedValue
    });
  }
}
