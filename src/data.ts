import { Car, UsageLog, Reservation } from './types';

// Helper to generate dates relative to today
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 16);

export const INITIAL_CARS: Car[] = [
  { id: '1', licensePlate: '1กข 1234', brand: 'Toyota', model: 'Hilux Revo', manager: 'สมชาย ใจดี', status: 'available', currentMileage: 15420, nextMaintenanceMileage: 20000 },
  { id: '2', licensePlate: '2ขค 5678', brand: 'Toyota', model: 'Hilux Revo', status: 'in-use', currentDriver: 'ธีรพงษ์ ถามา', currentMileage: 49800, nextMaintenanceMileage: 50000 },
  { id: '3', licensePlate: '3คง 9012', brand: 'Isuzu', model: 'D-Max', manager: 'วิชัย รักงาน', status: 'available', currentMileage: 80500, nextMaintenanceMileage: 80000 },
  { id: '4', licensePlate: '4งจ 3456', brand: 'Isuzu', model: 'D-Max', status: 'maintenance', currentMileage: 120000, nextMaintenanceMileage: 130000 },
  { id: '5', licensePlate: '5จฉ 7890', brand: 'Honda', model: 'City', status: 'available', currentMileage: 35000, nextMaintenanceMileage: 40000 },
  { id: '6', licensePlate: '6ฉช 1122', brand: 'Honda', model: 'City', status: 'in-use', currentDriver: 'อภิวัฒน์ ศิลารัตน์', currentMileage: 22000, nextMaintenanceMileage: 30000 },
  { id: '7', licensePlate: '7ชซ 3344', brand: 'Toyota', model: 'Commuter', manager: 'สมหญิง รักดี', status: 'available', currentMileage: 115000, nextMaintenanceMileage: 120000 },
  { id: '8', licensePlate: '8ซญ 5566', brand: 'Toyota', model: 'Commuter', status: 'available', currentMileage: 60000, nextMaintenanceMileage: 70000 },
  { id: '9', licensePlate: '9ญฎ 7788', brand: 'Nissan', model: 'Navara', status: 'available', currentMileage: 45000, nextMaintenanceMileage: 50000 },
];

export const INITIAL_LOGS: UsageLog[] = [
  // Car 1
  { id: 'l1_1', carId: '1', type: 'check-out', driverName: 'นัฐกานต์ แผ่นทอง', timestamp: daysAgo(55), notes: 'ไปไซต์งาน A' },
  { id: 'l1_2', carId: '1', type: 'check-in', driverName: 'นัฐกานต์ แผ่นทอง', timestamp: daysAgo(54), mileage: 14800, notes: 'รถปกติ' },
  { id: 'l1_3', carId: '1', type: 'check-out', driverName: 'ธิติ ธีระนันทกุล', timestamp: daysAgo(40), notes: 'ขนของ' },
  { id: 'l1_4', carId: '1', type: 'check-in', driverName: 'ธิติ ธีระนันทกุล', timestamp: daysAgo(39), mileage: 15000, notes: 'เติมน้ำมันเต็มถัง' },
  { id: 'l1_5', carId: '1', type: 'check-out', driverName: 'ราชทัศน์ โทธรัตน์', timestamp: daysAgo(10), notes: 'ติดต่อลูกค้า' },
  { id: 'l1_6', carId: '1', type: 'check-in', driverName: 'ราชทัศน์ โทธรัตน์', timestamp: daysAgo(9), mileage: 15420, notes: 'ปกติ' },

  // Car 2
  { id: 'l2_1', carId: '2', type: 'check-out', driverName: 'สวนัท อุดมรักษ์', timestamp: daysAgo(60), notes: 'ไปชลบุรี' },
  { id: 'l2_2', carId: '2', type: 'check-in', driverName: 'สวนัท อุดมรักษ์', timestamp: daysAgo(58), mileage: 48500, notes: 'มีรอยขูดขีดเล็กน้อย' },
  { id: 'l2_3', carId: '2', type: 'maintenance-start', driverName: 'Admin', timestamp: daysAgo(57), maintenanceType: 'เช็คระยะ', mileage: 48500 },
  { id: 'l2_4', carId: '2', type: 'maintenance-end', driverName: 'Admin', timestamp: daysAgo(56) },
  { id: 'l2_5', carId: '2', type: 'check-out', driverName: 'ภาสกร ภู่สูงเนิน', timestamp: daysAgo(30), notes: 'ไปพบลูกค้า' },
  { id: 'l2_6', carId: '2', type: 'check-in', driverName: 'ภาสกร ภู่สูงเนิน', timestamp: daysAgo(29), mileage: 49000, notes: 'ปกติ' },
  { id: 'l2_7', carId: '2', type: 'check-out', driverName: 'ธีรพงษ์ ถามา', timestamp: daysAgo(2), notes: 'ไปพบลูกค้าที่ระยอง' }, // Currently in use

  // Car 3
  { id: 'l3_1', carId: '3', type: 'check-out', driverName: 'อภิสิทธิ์ พูนไธสง', timestamp: daysAgo(45), notes: 'ขนอุปกรณ์' },
  { id: 'l3_2', carId: '3', type: 'check-in', driverName: 'อภิสิทธิ์ พูนไธสง', timestamp: daysAgo(44), mileage: 80100, notes: 'ปกติ' },
  { id: 'l3_3', carId: '3', type: 'check-out', driverName: 'เศกสันต์ อิ่มสุข', timestamp: daysAgo(20), notes: 'ไปไซต์งาน B' },
  { id: 'l3_4', carId: '3', type: 'check-in', driverName: 'เศกสันต์ อิ่มสุข', timestamp: daysAgo(18), mileage: 80500, notes: 'ปกติ' },

  // Car 4
  { id: 'l4_1', carId: '4', type: 'check-out', driverName: 'รุ่งเรือง อำพันธ์', timestamp: daysAgo(50), notes: 'ใช้งานทั่วไป' },
  { id: 'l4_2', carId: '4', type: 'check-in', driverName: 'รุ่งเรือง อำพันธ์', timestamp: daysAgo(49), mileage: 119500, notes: 'แอร์ไม่ค่อยเย็น' },
  { id: 'l4_3', carId: '4', type: 'check-out', driverName: 'ณฐพล อยู่หลาบ', timestamp: daysAgo(15), notes: 'ไปต่างจังหวัด' },
  { id: 'l4_4', carId: '4', type: 'check-in', driverName: 'ณฐพล อยู่หลาบ', timestamp: daysAgo(12), mileage: 120000, notes: 'แอร์เสีย' },
  { id: 'l4_5', carId: '4', type: 'maintenance-start', driverName: 'Admin', timestamp: daysAgo(10), maintenanceType: 'ซ่อมแอร์', mileage: 120000 }, // Currently in maintenance

  // Car 5
  { id: 'l5_1', carId: '5', type: 'check-out', driverName: 'ประจิน บัวล้อม', timestamp: daysAgo(35), notes: 'ประชุม' },
  { id: 'l5_2', carId: '5', type: 'check-in', driverName: 'ประจิน บัวล้อม', timestamp: daysAgo(35), mileage: 34500, notes: 'ปกติ' },
  { id: 'l5_3', carId: '5', type: 'check-out', driverName: 'กนก มาเยอะ', timestamp: daysAgo(5), notes: 'พบลูกค้า' },
  { id: 'l5_4', carId: '5', type: 'check-in', driverName: 'กนก มาเยอะ', timestamp: daysAgo(4), mileage: 35000, notes: 'ปกติ' },

  // Car 6
  { id: 'l6_1', carId: '6', type: 'check-out', driverName: 'อัครพล อัครบาล', timestamp: daysAgo(25), notes: 'ส่งเอกสาร' },
  { id: 'l6_2', carId: '6', type: 'check-in', driverName: 'อัครพล อัครบาล', timestamp: daysAgo(25), mileage: 21800, notes: 'ปกติ' },
  { id: 'l6_3', carId: '6', type: 'check-out', driverName: 'อภิวัฒน์ ศิลารัตน์', timestamp: daysAgo(0.1), notes: 'ส่งเอกสารด่วน' }, // Currently in use

  // Car 7
  { id: 'l7_1', carId: '7', type: 'check-out', driverName: 'มาตรภูมิ เหวนอก', timestamp: daysAgo(40), notes: 'รับส่งพนักงาน' },
  { id: 'l7_2', carId: '7', type: 'check-in', driverName: 'มาตรภูมิ เหวนอก', timestamp: daysAgo(39), mileage: 114000, notes: 'ปกติ' },
  { id: 'l7_3', carId: '7', type: 'check-out', driverName: 'ยศธร ยืนยาว', timestamp: daysAgo(15), notes: 'รับส่งพนักงาน' },
  { id: 'l7_4', carId: '7', type: 'check-in', driverName: 'ยศธร ยืนยาว', timestamp: daysAgo(14), mileage: 115000, notes: 'ปกติ' },

  // Car 8
  { id: 'l8_1', carId: '8', type: 'check-out', driverName: 'นรินทรศักดิ์ แสงประเสริฐ', timestamp: daysAgo(20), notes: 'ออกบูธ' },
  { id: 'l8_2', carId: '8', type: 'check-in', driverName: 'นรินทรศักดิ์ แสงประเสริฐ', timestamp: daysAgo(18), mileage: 60000, notes: 'ปกติ' },

  // Car 9
  { id: 'l9_1', carId: '9', type: 'check-out', driverName: 'นพดล มากพุ่ม', timestamp: daysAgo(50), notes: 'ขนของ' },
  { id: 'l9_2', carId: '9', type: 'check-in', driverName: 'นพดล มากพุ่ม', timestamp: daysAgo(49), mileage: 44000, notes: 'ปกติ' },
  { id: 'l9_3', carId: '9', type: 'check-out', driverName: 'อรรถพล จันทร์อำ', timestamp: daysAgo(8), notes: 'ไปไซต์งาน' },
  { id: 'l9_4', carId: '9', type: 'check-in', driverName: 'อรรถพล จันทร์อำ', timestamp: daysAgo(7), mileage: 45000, notes: 'ปกติ' },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'r1', carId: '1', driverName: 'ภานุวัฒน์ พรมสูตร', startDate: daysFromNow(1), endDate: daysFromNow(2), notes: 'ไปต่างจังหวัด', status: 'active' },
  { id: 'r2', carId: '5', driverName: 'กิตติภูมิ บุญทีฆ์', startDate: daysFromNow(3), endDate: daysFromNow(3.5), notes: 'ประชุมลูกค้า', status: 'active' },
  { id: 'r3', carId: '3', driverName: 'อำนาจ สืบสำราญ', startDate: daysFromNow(5), endDate: daysFromNow(7), notes: 'ขนอุปกรณ์', status: 'active' },
  { id: 'r4', carId: '7', driverName: 'มาตรภูมิ เหวนอก', startDate: daysFromNow(2), endDate: daysFromNow(2.5), notes: 'รับส่งผู้บริหาร', status: 'active' },
  { id: 'r5', carId: '8', driverName: 'นรินทรศักดิ์ แสงประเสริฐ', startDate: daysFromNow(10), endDate: daysFromNow(12), notes: 'ออกบูธต่างจังหวัด', status: 'active' },
];
