import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(dateString: string | Date): string {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return dateString.toString();
    const day = date.getDate().toString().padStart(2, '0'); 
    const month = (date.getMonth()+1).toString().padStart(2, '0'); 
    const year = date.getFullYear();

    return `Ngày ${day} tháng ${month} năm ${year}`;
  }
}
