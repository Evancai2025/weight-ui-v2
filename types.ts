export enum ViewState {
  HOME = 'HOME',
  SETTINGS = 'SETTINGS',
  CALIBRATION = 'CALIBRATION',
  MAX_LOAD_EDIT = 'MAX_LOAD_EDIT',
  SENSOR_CONN = 'SENSOR_CONN',
  TIME_SETUP = 'TIME_SETUP',
  SYSTEM_INFO = 'SYSTEM_INFO'
}

export enum LoadStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  DANGER = 'DANGER',
  FULL = 'FULL',
  OVERLOAD = 'OVERLOAD'
}

export interface CalibrationPoint {
  id: number;
  voltage: number; // Simulated sensor voltage
  weight: number;  // User defined weight for this voltage
}

export interface SystemConfig {
  maxLoad: number;
  isDarkMode: boolean;
  calibrationPoints: CalibrationPoint[];
  // Linear regression coefficients: y = mx + c
  slope: number;
  intercept: number;
}

export const THEME_COLORS = {
  NORMAL: '#22c55e', // Green-500
  WARNING: '#eab308', // Yellow-500
  DANGER: '#f97316', // Orange-500
  FULL: '#f97316',   // Orange-500 (Warning Color for >95%)
  OVERLOAD: '#ef4444', // Red-500
};