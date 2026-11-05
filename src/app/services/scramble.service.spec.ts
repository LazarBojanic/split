import { TestBed } from '@angular/core/testing';
import { ScrambleService } from './scramble.service';

describe('ScrambleService', () => {
  let service: ScrambleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrambleService);
  });

  it('should generate a 20-move 3x3 scramble', () => {
    const moves = service.next().split(' ');
    expect(moves.length).toBe(20);
    expect(moves.every((move) => /^[UDLRFB](2|'|)$/.test(move))).toBe(true);
  });

  it('should not repeat the same face consecutively', () => {
    const moves = service.next(30).split(' ');
    for (let index = 1; index < moves.length; index++) {
      expect(moves[index].charAt(0)).not.toBe(moves[index - 1].charAt(0));
    }
  });

  it('should respect a custom length', () => {
    expect(service.next(11).split(' ').length).toBe(11);
  });
});
