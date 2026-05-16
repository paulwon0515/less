// LPSS Sign Type Definitions
// Each type has its own cost-per-hour rate (KRW)

export const DEFAULT_SIGN_TYPES = {
  A1: { costPerHour: 10000, label: 'Type A1' },
  A2: { costPerHour: 11000, label: 'Type A2' },
  B1: { costPerHour: 13000, label: 'Type B1' },
  C1: { costPerHour: 15000, label: 'Type C1' },
  C2: { costPerHour: 16000, label: 'Type C2' },
  D1: { costPerHour: 20000, label: 'Type D1' },
  D2: { costPerHour: 20000, label: 'Type D2' },
  D3: { costPerHour: 20000, label: 'Type D3' },
  D4: { costPerHour: 15000, label: 'Type D4' },
  E1: { costPerHour: 15000, label: 'Type E1' },
  E2: { costPerHour: 15000, label: 'Type E2' },
  E3: { costPerHour: 15000, label: 'Type E3' },
  E4: { costPerHour: 15000, label: 'Type E4' },
};

// Default hybrid engine settings
export const DEFAULT_SETTINGS = {
  fillFactor: 0.38,
  weightBuffer: 1.10,
  timePerGram: 1.15,
  setupTime: 20,
  filamentDensity: 1.24,
  filamentPricePerGram: 20,
};
