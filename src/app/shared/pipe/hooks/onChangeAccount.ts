import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Owner } from '../../type/owner';
import { AccountContextService, ValidationResult } from '../contexts/accountContext';

export interface OwnerChangeEvent {
  type: 'create' | 'update';
  owner: Partial<Owner>;
  timestamp: Date;
}

export interface OwnerChangeResult {
  success: boolean;
  data?: Owner;
  error?: string;
  validation?: ValidationResult;
}

/**
 * Custom lifecycle hook for handling Owner create and update operations
 * Based on AccountContextService validation
 */
@Injectable({
  providedIn: 'root'
})
export class OnChangeAccountHook implements OnDestroy {
  // Subject để tracking changes
  private ownerChangeSubject = new Subject<Partial<Owner>>();
  public ownerChange$: Observable<Partial<Owner>> = this.ownerChangeSubject.asObservable();

  // Subject để tracking events
  private ownerEventSubject = new BehaviorSubject<OwnerChangeEvent | null>(null);
  public ownerEvent$: Observable<OwnerChangeEvent | null> = this.ownerEventSubject.asObservable();

  // Subject để tracking results
  private ownerResultSubject = new BehaviorSubject<OwnerChangeResult | null>(null);
  public ownerResult$: Observable<OwnerChangeResult | null> = this.ownerResultSubject.asObservable();

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(private accountContextService: AccountContextService) {
    this.initializeHook();
  }

  /**
   * Initialize hook - setup subscribers
   */
  private initializeHook(): void {
    // Monitor changes with debounce and distinct
    this.ownerChange$
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe((owner) => {
        this.validateAndNotify(owner);
      });
  }


  public onCreate(owner: Partial<Owner>): Observable<OwnerChangeResult> {
    const validation = this.accountContextService.validateOwner(owner);

    if (!validation.isValid) {
      const result: OwnerChangeResult = {
        success: false,
        error: 'Dữ liệu không hợp lệ',
        validation
      };
      this.ownerResultSubject.next(result);
      return new BehaviorSubject(result).asObservable();
    }

    // Create event
    const event: OwnerChangeEvent = {
      type: 'create',
      owner,
      timestamp: new Date()
    };
    this.ownerEventSubject.next(event);

    // Emit change
    this.ownerChangeSubject.next(owner);

    // Simulate API call and return result (replace with actual API call)
    const result: OwnerChangeResult = {
      success: true,
      data: {
        ...owner,
        _id: this.generateObjectId(),
        status: 'pending',
        createdAt: new Date().toISOString()
      } as Owner
    };
    this.ownerResultSubject.next(result);
    return new BehaviorSubject(result).asObservable();
  }


  public onUpdate(ownerId: string, updates: Partial<Owner>): Observable<OwnerChangeResult> {
    // Get current owner
    const currentOwner = this.accountContextService.getCurrentOwner();
    if (!currentOwner) {
      const result: OwnerChangeResult = {
        success: false,
        error: 'Không tìm thấy chủ cơ sở'
      };
      this.ownerResultSubject.next(result);
      return new BehaviorSubject(result).asObservable();
    }


    const mergedOwner: Partial<Owner> = {
      ...currentOwner,
      ...updates,
      _id: ownerId 
    };

    const validation = this.accountContextService.validateOwner(mergedOwner);

    if (!validation.isValid) {
      const result: OwnerChangeResult = {
        success: false,
        error: 'Dữ liệu cập nhật không hợp lệ',
        validation
      };
      this.ownerResultSubject.next(result);
      return new BehaviorSubject(result).asObservable();
    }

    const event: OwnerChangeEvent = {
      type: 'update',
      owner: mergedOwner,
      timestamp: new Date()
    };
    this.ownerEventSubject.next(event);

    this.ownerChangeSubject.next(mergedOwner);


    this.accountContextService.setCurrentOwner(mergedOwner as Owner);

    const result: OwnerChangeResult = {
      success: true,
      data: mergedOwner as Owner
    };
    this.ownerResultSubject.next(result);
    return new BehaviorSubject(result).asObservable();
  }

  private validateAndNotify(owner: Partial<Owner>): void {
    const validation = this.accountContextService.validateOwner(owner);
    
    if (!validation.isValid) {
      console.warn('Validation errors:', validation.errors);
    }
  }


  public getCurrentEvent(): OwnerChangeEvent | null {
    return this.ownerEventSubject.value;
  }


  public getCurrentResult(): OwnerChangeResult | null {
    return this.ownerResultSubject.value;
  }


  public reset(): void {
    this.ownerEventSubject.next(null);
    this.ownerResultSubject.next(null);
  }


  public validateOwner(owner: Partial<Owner>): ValidationResult {
    return this.accountContextService.validateOwner(owner);
  }


  private generateObjectId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
