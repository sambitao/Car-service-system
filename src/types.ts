export type CarStatus = 'available' | 'in-use' | 'maintenance';

export interface Car {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  manager?: string;
  status: CarStatus;
  currentDriver?: string;
  currentMileage: number;
  nextMaintenanceMileage: number;
}

export interface UsageLog {
  id: string;
  carId: string;
  type: 'check-out' | 'check-in' | 'maintenance-start' | 'maintenance-end' | 'accident';
  driverName: string;
  timestamp: string;
  notes?: string;
  mileage?: number;
  photos?: string[];
  maintenanceType?: string;
}

export interface Reservation {
  id: string;
  carId: string;
  driverName: string;
  startDate: string;
  endDate: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
}
