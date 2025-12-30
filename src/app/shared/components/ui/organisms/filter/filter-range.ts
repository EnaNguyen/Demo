import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOption } from '../../../../type/filter/filter';
import { MatSliderModule } from '@angular/material/slider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-filter-range',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSliderModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="filter-range-container">
      <label class="filter-range-label">{{ filterOption.title }}</label>
      
      <!-- Number Range Slider -->
      <div *ngIf="isNumberRange" class="range-inputs">
        <div class="range-slider-container">
          <div class="range-display">
            {{ formatValue(minValue) }} - {{ formatValue(maxValue) }}
          </div>
          <mat-slider 
            class="slider-range"
            color="primary"
            [min]="minRange"
            [max]="maxRange"
            [step]="step"
          >
            <input matSliderStartThumb [(ngModel)]="minValue" (change)="onValueChange()">
            <input matSliderEndThumb [(ngModel)]="maxValue" (change)="onValueChange()">
          </mat-slider>
        </div>
        
        <div class="range-input-group">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Từ</mat-label>
            <input matInput type="number" [(ngModel)]="minValue" (change)="onValueChange()" />
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Đến</mat-label>
            <input matInput type="number" [(ngModel)]="maxValue" (change)="onValueChange()" />
          </mat-form-field>
        </div>
      </div>

      <!-- Date Range Picker -->
      <div *ngIf="!isNumberRange" class="date-range-inputs">
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Từ ngày</mat-label>
          <input matInput [matDatepicker]="startPicker" [(ngModel)]="minDateObj" (change)="onDateChange()" />
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="form-field-full">
          <mat-label>Đến ngày</mat-label>
          <input matInput [matDatepicker]="endPicker" [(ngModel)]="maxDateObj" (change)="onDateChange()" />
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <div class="date-display">
          {{ minDate }} - {{ maxDate }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-range-container {
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .filter-range-label {
      display: block;
      font-weight: 600;
      margin-bottom: 16px;
      color: #333;
      font-size: 14px;
    }

    .range-inputs {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .range-slider-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .range-input-group {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .input-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .input-wrapper label {
      font-size: 12px;
      color: #555;
      font-weight: 500;
    }

    .range-number-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .range-number-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .range-display {
      text-align: center;
      padding: 8px;
      color: #1976d2;
      font-weight: 600;
      font-size: 13px;
      background: #e3f2fd;
      border-radius: 4px;
    }

    /* Date Range Styles */
    .date-range-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .date-input-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .date-input-group label {
      font-size: 12px;
      color: #555;
      font-weight: 500;
    }

    .date-display {
      text-align: center;
      padding: 8px;
      color: #1976d2;
      font-weight: 600;
      font-size: 13px;
      background: #e3f2fd;
      border-radius: 4px;
      margin-top: 4px;
    }

    .form-field {
      width: 100%;
    }

    .form-field-full {
      width: 100%;
    }

    .slider-range {
      width: 100%;
    }
  `]
})
export class FilterRangeComponent implements OnInit {
  @Input() filterOption!: FilterOption;
  @Output() filterChange = new EventEmitter<any>();

  // Number range properties
  minValue: number = 0;
  maxValue: number = 100;
  minRange: number = 0;
  maxRange: number = 100;
  step: number = 1;

  // Date range properties
  minDate: string = '';
  maxDate: string = '';
  minDateObj: Date = new Date();
  maxDateObj: Date = new Date();

  // Type detection
  isNumberRange: boolean = true;

  ngOnInit(): void {
    const requestType = this.filterOption.request.type;
    this.isNumberRange = requestType === 'number';

    if (this.isNumberRange) {
      this.initializeNumberRange();
    } else {
      this.initializeDateRange();
    }
  }

  private initializeNumberRange(): void {
    const range = this.filterOption.request.range as { min: number; max: number };
    if (range) {
      this.minRange = range.min;
      this.minValue = range.min;
      this.maxRange = range.max;
      this.maxValue = range.max;
      this.step = 1;
    }
  }

  private initializeDateRange(): void {
    const range = this.filterOption.request.range as { min: Date; max: Date };
    if (range) {
      this.minDateObj = new Date(range.min);
      this.maxDateObj = new Date(range.max);
      this.minDate = this.formatDateToDisplay(this.minDateObj);
      this.maxDate = this.formatDateToDisplay(this.maxDateObj);
    }
  }

  private formatDateToDisplay(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onValueChange(): void {
    this.filterChange.emit({
      type: this.filterOption.type,
      range: { min: this.minValue, max: this.maxValue }
    });
  }

  onDateChange(): void {
    this.minDate = this.formatDateToDisplay(this.minDateObj);
    this.maxDate = this.formatDateToDisplay(this.maxDateObj);
    
    this.filterChange.emit({
      type: this.filterOption.type,
      range: { 
        min: this.minDateObj, 
        max: this.maxDateObj 
      }
    });
  }

  formatValue(value: number): string {
    if (value > 1000000) {
      return (value / 1000000).toFixed(0) + 'M';
    } else if (value > 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  }
}
