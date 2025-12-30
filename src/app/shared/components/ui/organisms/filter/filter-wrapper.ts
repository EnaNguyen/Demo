import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterCheckboxComponent } from './filter-checkbox';
import { FilterRangeComponent } from './filter-range';
import { FilterSelectComponent } from './filter-select';
import { FilterRadioComponent } from './filter-radio';
import { FilterSearchComponent } from './filter-search';
import { FilterPageComponent } from './filter-page';
import { FilterOption } from '../../../../type/filter/filter';

@Component({
  selector: 'app-filter-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    FilterCheckboxComponent,
    FilterRangeComponent,
    FilterSelectComponent,
    FilterRadioComponent,
    FilterSearchComponent,
    FilterPageComponent
  ],
  template: `
    <div class="filter-wrapper">
      <!-- Checkbox Filter -->
      <app-filter-checkbox 
        *ngIf="filterOption.type === 'checkbox'"
        [filterOption]="filterOption"
        (filterChange)="onFilterChange($event)"
      ></app-filter-checkbox>
      
      <!-- Range Filter -->
      <app-filter-range 
        *ngIf="filterOption.type === 'range'"
        [filterOption]="filterOption"
        (filterChange)="onFilterChange($event)"
      ></app-filter-range>
      
      <!-- Select Filter -->
      <app-filter-select 
        *ngIf="filterOption.type === 'select'"
        [filterOption]="filterOption"
        (filterChange)="onFilterChange($event)"
      ></app-filter-select>
      
      <!-- Radio Filter -->
      <app-filter-radio 
        *ngIf="filterOption.type === 'radio'"
        [filterOption]="filterOption"
        (filterChange)="onFilterChange($event)"
      ></app-filter-radio>
      
      <!-- Search Filter -->
      <app-filter-search 
        *ngIf="filterOption.type === 'search'"
        [filterOption]="filterOption"
        (filterChange)="onFilterChange($event)"
      ></app-filter-search>
      
      <!-- Page Filter -->
      <app-filter-page 
        *ngIf="filterOption.type === 'page'"
        [filterOption]="filterOption"
        (filterChange)="onFilterChange($event)"
      ></app-filter-page>
    </div>
  `,
  styles: [`
    .filter-wrapper {
      width: 100%;
    }
  `]
})
export class FilterWrapperComponent {
  @Input() filterOption!: FilterOption;
  @Output() filterChange = new EventEmitter<any>();

  onFilterChange(event: any): void {
    this.filterChange.emit({
      title: this.filterOption.title,
      ...event
    });
  }
}
