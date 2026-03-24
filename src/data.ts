import { Car, UsageLog, Reservation } from './types';

// Helper to generate dates relative to today
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 16);


