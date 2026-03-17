export const formatNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '';
  return numeric.toLocaleString('en-IN');
};

export const parseNumberInput = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const numeric = Number(cleaned);
  return Number.isNaN(numeric) ? null : numeric;
};

export const getCashFlowGate = (income, expenses) => {
  if (income === null || income === undefined || expenses === null || expenses === undefined) {
    return { shouldGate: false, deficit: null, net: null };
  }

  const net = income - expenses;
  return {
    shouldGate: net <= 0,
    deficit: Math.abs(net),
    net,
  };
};

export const getIncomeValidation = (income) => {
  const errors = [];
  const warnings = [];

  if (income === null || income === undefined || Number.isNaN(income)) {
    return { errors, warnings };
  }

  if (income <= 0) {
    errors.push('Monthly Income must be greater than ₹0.');
  } else if (income < 1000) {
    errors.push('Monthly Income must be at least ₹1,000.');
  } else if (income < 5000) {
    warnings.push('Income seems unusually low. Please verify your entry.');
  }

  return { errors, warnings };
};

export const getEmergencyFundDisplay = (savingsRate, emergencyFundMonths) => {
  if (savingsRate !== null && savingsRate !== undefined && savingsRate <= 0) {
    return {
      value: 'N/A',
      subtitle: 'Cannot calculate — savings rate is negative',
    };
  }

  if (emergencyFundMonths === null || emergencyFundMonths === undefined || Number.isNaN(emergencyFundMonths)) {
    return { value: '—', subtitle: null };
  }

  return {
    value: `${emergencyFundMonths.toFixed(1)} months`,
    subtitle: null,
  };
};
