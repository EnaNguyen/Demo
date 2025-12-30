import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../../type/filter/filter';

@Component({
  selector: 'app-filter-radio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-radio-container">
      <label class="filter-radio-label">{{ filterOption.title }}</label>
      <div class="radio-group">
        <div class="radio-item" *ngFor="let item of items">
          <input 
            type="radio" 
            [id]="'radio-' + item"
            [name]="'radio-' + filterOption.title"
            [value]="item"
            [checked]="selectedValue === item"
            (change)="onRadioChange(item)"
          />
          <label [for]="'radio-' + item">{{ item }}</label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-radio-container {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .filter-radio-label {
      display: block;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
      font-size: 14px;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .radio-item {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .radio-item input[type="radio"] {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      cursor: pointer;
      accent-color: #1976d2;
    }

    .radio-item label {
      cursor: pointer;
      font-size: 13px;
      color: #555;
      flex: 1;
    }

    .radio-item label:hover {
      color: #1976d2;
    }
  `]
})
export class FilterRadioComponent implements OnInit {
  @Input() filterOption!: FilterOption;
  @Output() filterChange = new EventEmitter<any>();

  selectedValue: any = null;
  items: any[] = [];

  ngOnInit(): void {
    const value = this.filterOption.request.value;
    if (Array.isArray(value)) {
      this.items = value;
      this.selectedValue = value[0] || null;
    } else {
      this.selectedValue = value || null;
    }
  }

  onRadioChange(value: any): void {
    this.selectedValue = value;
    this.filterChange.emit({
      type: this.filterOption.type,
      value: this.selectedValue
    });
  }
}
