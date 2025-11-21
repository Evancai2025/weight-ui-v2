import { CalibrationPoint } from "./types";

// Calculate Linear Regression (Least Squares)
// Returns [slope, intercept]
export const calculateCalibrationCoefficients = (points: CalibrationPoint[]): [number, number] => {
  const n = points.length;
  if (n < 2) return [1, 0]; // Default 1:1 mapping if not calibrated

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.voltage;
    sumY += p.weight;
    sumXY += (p.voltage * p.weight);
    sumXX += (p.voltage * p.voltage);
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return [slope, intercept];
};

export const formatDateTime = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

// New helper for HH:MM:SS
export const formatTimeWithSeconds = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  return `${day} ${month}`;
};