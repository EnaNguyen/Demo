import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../../type/filter/filter';

@Component({
  selector: 'app-filter-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-checkbox-container">
      <label class="filter-checkbox-label">{{ filterOption.title }}</label>
      <div class="checkbox-group">
        <div class="checkbox-item" *ngFor="let item of items">
          <input 
            type="checkbox" 
            [id]="'checkbox-' + item"
            [value]="item"
              [checked]="checkedValues.has(item)"
              (change)="onCheckboxChange($event)"
          />
          <label [for]="'checkbox-' + item">{{ item }}</label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-checkbox-container {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .filter-checkbox-label {
      display: block;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
      font-size: 14px;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .checkbox-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      cursor: pointer;
      accent-color: #1976d2;
    }

    .checkbox-item label {
      cursor: pointer;
      font-size: 13px;
      color: #555;
      flex: 1;
    }

    .checkbox-item label:hover {
      color: #1976d2;
    }
  `]
})
export class FilterCheckboxComponent implements OnInit {
  @Input() filterOption!: FilterOption;
  @Output() filterChange = new EventEmitter<any>();

  checkedValues: Set<any> = new Set();
  items: any[] = [];

  ngOnInit(): void {
    const value = this.filterOption.request.value;
    if (Array.isArray(value)) {
      this.items = value;
    }

    const selected = this.filterOption.request.selected;
    if (Array.isArray(selected)) {
      this.checkedValues = new Set(selected);
    }
  }

  onCheckboxChange(event: any): void {
    const value = event.target.value;
    if (event.target.checked) {
      this.checkedValues.add(value);
    } else {
      this.checkedValues.delete(value);
    }
    this.filterChange.emit({
      type: this.filterOption.type,
      value: Array.from(this.checkedValues)
    });
  }
}
