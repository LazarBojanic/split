import { TestBed } from '@angular/core/testing';
import { IdentityService } from './identity.service';

describe('IdentityService', () => {
  let service: IdentityService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdentityService);
  });

  it('should generate an anonymous name', () => {
    expect(service.name().length).toBeGreaterThan(0);
    expect(service.name()).toMatch(/^[a-z]+_[a-z]+_\d{2}$/);
  });

  it('should allow setting a name and persist it', () => {
    service.setName('Luka');
    expect(service.name()).toBe('Luka');
    expect(localStorage.getItem('split_display_name_v1')).toBe('Luka');
  });
});
