import { describe, expect, it } from 'vitest';
import {
  getCashFlowGate,
  getEmergencyFundDisplay,
  getIncomeValidation,
} from '../lib/investment-recommendations-ui';

describe('investment recommendations UI helpers', () => {
  it('gates recommendations when cash flow is not positive', () => {
    const negative = getCashFlowGate(10000, 15000);
    expect(negative.shouldGate).toBe(true);
    expect(negative.deficit).toBe(5000);

    const zero = getCashFlowGate(10000, 10000);
    expect(zero.shouldGate).toBe(true);

    const positive = getCashFlowGate(12000, 9000);
    expect(positive.shouldGate).toBe(false);
  });

  it('splits hard errors vs soft warnings for income validation', () => {
    const hard = getIncomeValidation(900);
    expect(hard.errors.length).toBeGreaterThan(0);
    expect(hard.warnings.length).toBe(0);

    const soft = getIncomeValidation(3000);
    expect(soft.errors.length).toBe(0);
    expect(soft.warnings.length).toBeGreaterThan(0);

    const ok = getIncomeValidation(6000);
    expect(ok.errors.length).toBe(0);
    expect(ok.warnings.length).toBe(0);
  });

  it('renders emergency fund as N/A when savings rate is negative or zero', () => {
    const negative = getEmergencyFundDisplay(-0.1, 4);
    expect(negative.value).toBe('N/A');
    expect(negative.subtitle).toBe('Cannot calculate — savings rate is negative');

    const zero = getEmergencyFundDisplay(0, 4);
    expect(zero.value).toBe('N/A');
    expect(zero.subtitle).toBe('Cannot calculate — savings rate is negative');
  });
});
