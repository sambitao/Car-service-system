import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Car as CarIcon, Key, History, Plus, Trash2, ArrowLeft, 
  CheckCircle2, XCircle, Clock, Wrench, Search, Building2,
  Calendar, MapPin, FileText, ChevronRight, AlertTriangle,
  Camera, CalendarDays, Image as ImageIcon,
  Wifi, WifiOff, Loader2, Edit2, Download
} from 'lucide-react';
import { Car, UsageLog, CarStatus, Reservation } from './types';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firebaseErrorHandler';

const EMPLOYEES = [
  "ธีรพงษ์ ถามา",
  "อภิวัฒน์ ศิลารัตน์",
  "นัฐกานต์ แผ่นทอง",
  "ธิติ ธีระนันทกุล",
  "ราชทัศน์ โทธรัตน์",
  "สวนัท อุดมรักษ์",
  "ภาสกร ภู่สูงเนิน",
  "อภิสิทธิ์ พูนไธสง",
  "เศกสันต์ อิ่มสุข",
  "รุ่งเรือง อำพันธ์",
  "ณฐพล อยู่หลาบ",
  "ประจิน บัวล้อม",
  "กนก มาเยอะ",
  "อัครพล อัครบาล",
  "มาตรภูมิ เหวนอก",
  "ยศธร ยืนยาว",
  "นรินทรศักดิ์ แสงประเสริฐ",
  "นพดล มากพุ่ม",
  "อรรถพล จันทร์อำ",
  "ภานุวัฒน์ พรมสูตร",
  "กิตติภูมิ บุญทีฆ์",
  "อำนาจ สืบสำราญ"
];

// --- Components ---

const StatusBadge = ({ status }: { status: CarStatus }) => {
  switch (status) {
    case 'available':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ว่าง</span>;
    case 'in-use':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"><Clock className="w-3.5 h-3.5 mr-1" /> ใช้งานอยู่</span>;
    case 'maintenance':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"><Wrench className="w-3.5 h-3.5 mr-1" /> ซ่อมบำรุง</span>;
  }
};

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 text-sm">{message}</p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">ยกเลิก</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors">ยืนยัน</button>
        </div>
      </div>
    </div>
  );
};

const AlertDialog = ({ isOpen, title, message, onConfirm }: { isOpen: boolean, title: string, message: string, onConfirm: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 text-sm">{message}</p>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors">ตกลง</button>
        </div>
      </div>
    </div>
  );
};

const BottomSheetModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-opacity">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [cars, setCars] = useState<Car[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [view, setView] = useState<'dashboard' | 'detail' | 'history'>('dashboard');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CarStatus | 'all' | 'reserved'>('all');
  const [detailTab, setDetailTab] = useState<'history' | 'reservations'>('history');
  
  // History filters
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [historyCarId, setHistoryCarId] = useState<string>('all');
  const [detailHistoryDate, setDetailHistoryDate] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isAccidentModalOpen, setIsAccidentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'month' | 'year'>('month');

  // Employee selection states
  const [checkoutEmployee, setCheckoutEmployee] = useState('');
  const [reserveEmployee, setReserveEmployee] = useState('');
  const [maintenanceEmployee, setMaintenanceEmployee] = useState('');

  // Photo state for check-in and maintenance
  const [checkinPhotos, setCheckinPhotos] = useState<string[]>([]);
  const [maintenancePhotos, setMaintenancePhotos] = useState<string[]>([]);
  const [accidentPhotos, setAccidentPhotos] = useState<string[]>([]);
  
  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean, title: string, message: string } | null>(null);

  const [appError, setAppError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline' | 'error'>('connecting');

  if (appError) {
    throw appError;
  }

  // Network status listener
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setConnectionStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Firebase sync
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const carsSnapshot = await getDocs(collection(db, 'cars'));
        if (isMounted && navigator.onLine) setConnectionStatus('connected');
      } catch (error) {
        if (isMounted) setConnectionStatus('error');
        try {
          handleFirestoreError(error, OperationType.GET, 'cars');
        } catch (e) {
          if (isMounted) setAppError(e as Error);
        }
      }
    };
    initData();

    const unsubCars = onSnapshot(collection(db, 'cars'), (snapshot) => {
      if (isMounted) {
        setCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Car)));
        if (navigator.onLine) setConnectionStatus('connected');
      }
    }, (error) => {
      if (isMounted) setConnectionStatus('error');
      try {
        handleFirestoreError(error, OperationType.GET, 'cars');
      } catch (e) {
        if (isMounted) setAppError(e as Error);
      }
    });
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      if (isMounted) setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UsageLog)));
    }, (error) => {
      if (isMounted) setConnectionStatus('error');
      try {
        handleFirestoreError(error, OperationType.GET, 'logs');
      } catch (e) {
        if (isMounted) setAppError(e as Error);
      }
    });
    const unsubReservations = onSnapshot(collection(db, 'reservations'), (snapshot) => {
      if (isMounted) setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation)));
    }, (error) => {
      if (isMounted) setConnectionStatus('error');
      try {
        handleFirestoreError(error, OperationType.GET, 'reservations');
      } catch (e) {
        if (isMounted) setAppError(e as Error);
      }
    });

    return () => {
      isMounted = false;
      unsubCars();
      unsubLogs();
      unsubReservations();
    };
  }, []);

  // Derived state
  const selectedCar = cars.find(c => c.id === selectedCarId);
  const carLogs = logs.filter(l => {
    if (l.carId !== selectedCarId) return false;
    if (detailHistoryDate) {
      return new Date(l.timestamp).toISOString().slice(0, 10) === detailHistoryDate;
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const carReservations = reservations.filter(r => r.carId === selectedCarId && r.status === 'active' && new Date(r.startDate) > new Date()).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const filteredCars = cars.filter(c => {
    const matchesSearch = c.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.model.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'reserved') {
      matchesStatus = reservations.some(r => r.carId === c.id && r.status === 'active' && new Date(r.startDate) > new Date());
    } else {
      matchesStatus = c.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cars.length,
    available: cars.filter(c => c.status === 'available').length,
    reserved: cars.filter(c => reservations.some(r => r.carId === c.id && r.status === 'active' && new Date(r.startDate) > new Date())).length,
    inUse: cars.filter(c => c.status === 'in-use').length,
    maintenance: cars.filter(c => c.status === 'maintenance').length,
  };

  // Logic Helpers
  const isMaintenanceDue = (car: Car) => car.currentMileage >= car.nextMaintenanceMileage;
  const isMaintenanceNear = (car: Car) => car.currentMileage >= car.nextMaintenanceMileage - 1000 && car.currentMileage < car.nextMaintenanceMileage;

  // Handlers
  const handleAddCar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCar: Car = {
      id: Math.random().toString(36).substr(2, 9),
      licensePlate: formData.get('licensePlate') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      manager: formData.get('manager') as string || undefined,
      status: 'available',
      currentMileage: Number(formData.get('currentMileage')) || 0,
      nextMaintenanceMileage: Number(formData.get('nextMaintenanceMileage')) || 10000,
    };
    try {
      await setDoc(doc(db, 'cars', newCar.id), newCar);
      setIsAddModalOpen(false);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'cars');
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleEditCar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedCar: Car = {
      ...selectedCar,
      licensePlate: formData.get('licensePlate') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      manager: formData.get('manager') as string || undefined,
      currentMileage: Number(formData.get('currentMileage')) || 0,
      nextMaintenanceMileage: Number(formData.get('nextMaintenanceMileage')) || 10000,
    };
    
    try {
      await updateDoc(doc(db, 'cars', selectedCar.id), updatedCar as any);
      setIsEditModalOpen(false);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, 'cars');
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleDeleteCar = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบข้อมูล',
      message: 'คุณแน่ใจหรือไม่ที่จะลบรถคันนี้ออกจากระบบ?',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteDoc(doc(db, 'cars', id));
          setView('dashboard');
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.DELETE, 'cars');
          } catch (e) {
            setAppError(e as Error);
          }
        }
      }
    });
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    const formData = new FormData(e.currentTarget);
    const employeeSelect = formData.get('employeeSelect') as string;
    const customEmployeeInput = formData.get('customEmployeeInput') as string;
    const driverName = employeeSelect === 'other' ? customEmployeeInput : employeeSelect;
    const notes = formData.get('notes') as string;
    const mileage = Number(formData.get('mileage'));

    const newLog: UsageLog = {
      id: Math.random().toString(36).substr(2, 9),
      carId: selectedCar.id,
      type: 'check-out',
      driverName,
      notes,
      mileage,
      timestamp: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'logs', newLog.id), newLog);
      batch.update(doc(db, 'cars', selectedCar.id), { 
        status: 'in-use', 
        currentDriver: driverName, 
        currentMileage: mileage 
      });
      await batch.commit();
      
      setIsCheckoutModalOpen(false);
      setCheckoutEmployee('');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'cars/logs');
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    const formData = new FormData(e.currentTarget);
    const employeeSelect = formData.get('employeeSelect') as string;
    const customEmployeeInput = formData.get('customEmployeeInput') as string;
    const driverName = employeeSelect === 'other' ? customEmployeeInput : employeeSelect;
    const maintenanceType = formData.get('maintenanceType') as string;
    const maintenanceDate = formData.get('maintenanceDate') as string;
    const mileage = Number(formData.get('mileage'));

    const newLog: UsageLog = {
      id: Math.random().toString(36).substr(2, 9),
      carId: selectedCar.id,
      type: 'maintenance-start',
      driverName,
      maintenanceType,
      mileage,
      photos: maintenancePhotos,
      timestamp: new Date(maintenanceDate).toISOString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'logs', newLog.id), newLog);
      batch.update(doc(db, 'cars', selectedCar.id), { 
        status: 'maintenance',
        currentMileage: mileage
      });
      await batch.commit();

      setIsMaintenanceModalOpen(false);
      setMaintenanceEmployee('');
      setMaintenancePhotos([]);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'cars/logs');
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleCheckin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    const formData = new FormData(e.currentTarget);
    const mileage = Number(formData.get('mileage'));
    const notes = formData.get('notes') as string;

    const newLog: UsageLog = {
      id: Math.random().toString(36).substr(2, 9),
      carId: selectedCar.id,
      type: 'check-in',
      driverName: selectedCar.currentDriver || 'Unknown',
      notes,
      mileage,
      photos: checkinPhotos,
      timestamp: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'logs', newLog.id), newLog);
      batch.update(doc(db, 'cars', selectedCar.id), { 
        status: 'available', 
        currentDriver: deleteField(),
        currentMileage: mileage > selectedCar.currentMileage ? mileage : selectedCar.currentMileage
      });
      await batch.commit();

      setIsCheckinModalOpen(false);
      setCheckinPhotos([]);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'cars/logs');
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleReserve = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    const formData = new FormData(e.currentTarget);
    const employeeSelect = formData.get('employeeSelect') as string;
    const customEmployeeInput = formData.get('customEmployeeInput') as string;
    const driverName = employeeSelect === 'other' ? customEmployeeInput : employeeSelect;
    
    const newRes: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      carId: selectedCar.id,
      driverName,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      notes: formData.get('notes') as string,
      status: 'active'
    };

    try {
      await setDoc(doc(db, 'reservations', newRes.id), newRes);
      setIsReserveModalOpen(false);
      setReserveEmployee('');
      setDetailTab('reservations');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, 'reservations');
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleAccidentReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCar) return;
    
    const formData = new FormData(e.currentTarget);
    const notes = formData.get('notes') as string;

    const newLog: UsageLog = {
      id: Math.random().toString(36).substr(2, 9),
      carId: selectedCar.id,
      type: 'accident',
      driverName: selectedCar.currentDriver || 'Unknown',
      notes,
      photos: accidentPhotos,
      timestamp: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'logs', newLog.id), newLog);
      setIsAccidentModalOpen(false);
      setAccidentPhotos([]);
      setDetailTab('history');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'logs');
      } catch (e) {
        setAppError(e as Error);
      }
    }
  };

  const handleClearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการล้างข้อมูล',
      message: 'คุณแน่ใจหรือไม่ที่จะล้างข้อมูลทั้งหมด (รถ, ประวัติ, การจอง)? ข้อมูลจะไม่สามารถกู้คืนได้',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const batch = writeBatch(db);
          
          // Delete all cars
          const carsSnapshot = await getDocs(collection(db, 'cars'));
          carsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Delete all logs
          const logsSnapshot = await getDocs(collection(db, 'logs'));
          logsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });

          // Delete all reservations
          const resSnapshot = await getDocs(collection(db, 'reservations'));
          resSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });

          await batch.commit();
          setAlertDialog({
            isOpen: true,
            title: 'สำเร็จ',
            message: 'ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว'
          });
          setView('dashboard');
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.DELETE, 'all');
          } catch (e) {
            setAppError(e as Error);
          }
        }
      }
    });
  };

  const handleExport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('exportType') as string;
    const month = formData.get('month') as string;
    const year = formData.get('year') as string;

    let filteredLogs = [...logs];

    if (type === 'month' && month) {
      filteredLogs = filteredLogs.filter(log => log.timestamp.startsWith(month));
    } else if (type === 'year' && year) {
      filteredLogs = filteredLogs.filter(log => log.timestamp.startsWith(year));
    }

    if (filteredLogs.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: 'ไม่พบข้อมูล',
        message: 'ไม่พบข้อมูลในช่วงเวลาที่เลือก'
      });
      return;
    }

    // Group logs by car license plate
    const logsByCar: Record<string, UsageLog[]> = {};
    filteredLogs.forEach(log => {
      const car = cars.find(c => c.id === log.carId);
      const licensePlate = car ? car.licensePlate : 'ไม่ทราบทะเบียน';
      if (!logsByCar[licensePlate]) {
        logsByCar[licensePlate] = [];
      }
      logsByCar[licensePlate].push(log);
    });

    const wb = XLSX.utils.book_new();

    Object.entries(logsByCar).forEach(([licensePlate, carLogs]) => {
      // Sort logs by timestamp
      carLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const data = carLogs.map(log => {
        // Translate log type
        let typeStr: string = log.type;
        switch (log.type) {
          case 'check-out': typeStr = 'รับรถ'; break;
          case 'check-in': typeStr = 'คืนรถ'; break;
          case 'maintenance-start': typeStr = 'ส่งซ่อม'; break;
          case 'maintenance-end': typeStr = 'รับรถจากซ่อม'; break;
          case 'accident': typeStr = 'แจ้งอุบัติเหตุ'; break;
        }

        return {
          'วันที่/เวลา': new Date(log.timestamp).toLocaleString('th-TH'),
          'ชื่อผู้ขับขี่': log.driverName || 'ไม่ระบุชื่อ',
          'ประเภทรายการ': typeStr,
          'เลขไมล์': log.mileage ? log.mileage.toLocaleString() : '-',
          'หมายเหตุ': log.notes || '-',
        };
      });

      // Sheet names cannot exceed 31 characters and cannot contain certain characters
      const safeSheetName = licensePlate.replace(/[\\/?*[\]:]/g, '').substring(0, 31);
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const colWidths = [
        { wch: 20 }, // วันที่/เวลา
        { wch: 20 }, // ชื่อผู้ขับขี่
        { wch: 15 }, // ประเภทรายการ
        { wch: 10 }, // เลขไมล์
        { wch: 30 }, // หมายเหตุ
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });

    const fileName = `ประวัติการใช้รถ_${type === 'month' ? month : year}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setIsExportModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'checkin' | 'maintenance' | 'accident' = 'checkin') => {
    const files = Array.from(e.target.files || []) as File[];
    const currentPhotos = type === 'checkin' ? checkinPhotos : type === 'maintenance' ? maintenancePhotos : accidentPhotos;
    const maxPhotos = type === 'checkin' ? 6 : 4;
    
    if (currentPhotos.length + files.length > maxPhotos) {
      setAlertDialog({
        isOpen: true,
        title: 'อัปโหลดรูปภาพเกินกำหนด',
        message: `สามารถอัปโหลดรูปภาพได้สูงสุด ${maxPhotos} รูปเท่านั้น`
      });
      return;
    }

    const newPhotos = files.map(file => URL.createObjectURL(file));
    if (type === 'checkin') {
      setCheckinPhotos([...checkinPhotos, ...newPhotos]);
    } else if (type === 'maintenance') {
      setMaintenancePhotos([...maintenancePhotos, ...newPhotos]);
    } else {
      setAccidentPhotos([...accidentPhotos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number, type: 'checkin' | 'maintenance' | 'accident' = 'checkin') => {
    if (type === 'checkin') {
      setCheckinPhotos(checkinPhotos.filter((_, i) => i !== index));
    } else if (type === 'maintenance') {
      setMaintenancePhotos(maintenancePhotos.filter((_, i) => i !== index));
    } else {
      setAccidentPhotos(accidentPhotos.filter((_, i) => i !== index));
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 sm:pb-8">
      {/* Mobile-Optimized Navbar */}
      <nav className="bg-orange-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            {view === 'dashboard' ? (
              <>
                <div className="flex items-center">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-100 mr-2 sm:mr-3" />
                  <span className="font-bold text-lg sm:text-xl tracking-tight">Symphony Car & Tool</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center mr-1 sm:mr-2 px-2 py-1 rounded-full bg-orange-700/50 border border-orange-500/50">
                    {connectionStatus === 'connecting' && <Loader2 className="w-3.5 h-3.5 text-orange-100 animate-spin sm:mr-1.5" />}
                    {connectionStatus === 'connected' && <Wifi className="w-3.5 h-3.5 text-emerald-400 sm:mr-1.5" />}
                    {connectionStatus === 'offline' && <WifiOff className="w-3.5 h-3.5 text-slate-400 sm:mr-1.5" />}
                    {connectionStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400 sm:mr-1.5" />}
                    <span className="hidden sm:inline text-xs font-medium text-orange-100">
                      {connectionStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' : 
                       connectionStatus === 'connected' ? 'เชื่อมต่อแล้ว' : 
                       connectionStatus === 'offline' ? 'ออฟไลน์' : 'เกิดข้อผิดพลาด'}
                    </span>
                  </div>
                  <button onClick={() => setIsExportModalOpen(true)} className="p-2 hover:bg-orange-700 rounded-full transition-colors active:bg-orange-700" title="Export Excel">
                    <Download className="w-5 h-5" />
                  </button>
                  <button onClick={() => setView('history')} className="p-2 hover:bg-orange-700 rounded-full transition-colors active:bg-orange-700" title="ประวัติการใช้งาน">
                    <History className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-orange-700 flex items-center justify-center border border-orange-500">
                    <span className="font-medium text-sm">AD</span>
                  </div>
                </div>
              </>
            ) : view === 'history' ? (
              <>
                <button onClick={() => setView('dashboard')} className="p-2 -ml-2 hover:bg-orange-700 rounded-full transition-colors active:bg-orange-700">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="font-bold text-lg truncate px-4">ประวัติการใช้งานทั้งหมด</span>
                <div className="flex items-center">
                  <div className="flex items-center px-2 py-1 rounded-full bg-orange-700/50 border border-orange-500/50">
                    {connectionStatus === 'connecting' && <Loader2 className="w-3.5 h-3.5 text-orange-100 animate-spin" />}
                    {connectionStatus === 'connected' && <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
                    {connectionStatus === 'offline' && <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
                    {connectionStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setView('dashboard')} className="p-2 -ml-2 hover:bg-orange-700 rounded-full transition-colors active:bg-orange-700">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="font-bold text-lg truncate px-4">{selectedCar?.licensePlate}</span>
                <div className="flex items-center">
                  <div className="flex items-center px-2 py-1 rounded-full bg-orange-700/50 border border-orange-500/50">
                    {connectionStatus === 'connecting' && <Loader2 className="w-3.5 h-3.5 text-orange-100 animate-spin" />}
                    {connectionStatus === 'connected' && <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
                    {connectionStatus === 'offline' && <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
                    {connectionStatus === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <span className="text-slate-500 text-xs sm:text-sm font-medium mb-1">รถทั้งหมด</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.total}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <span className="text-emerald-600 text-xs sm:text-sm font-medium mb-1 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1"/> ว่าง</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.available}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <span className="text-orange-600 text-xs sm:text-sm font-medium mb-1 flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1"/> ติดจอง</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.reserved}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <span className="text-blue-600 text-xs sm:text-sm font-medium mb-1 flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> ใช้งานอยู่</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.inUse}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <span className="text-orange-600 text-xs sm:text-sm font-medium mb-1 flex items-center"><Wrench className="w-3.5 h-3.5 mr-1"/> ซ่อมบำรุง</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-800">{stats.maintenance}</span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base shadow-sm transition-all"
                placeholder="ค้นหาทะเบียนรถ, ยี่ห้อ, รุ่น..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filters */}
            <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-slate-800 text-white border border-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center ${statusFilter === 'available' ? 'bg-emerald-600 text-white border border-emerald-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> ว่าง
              </button>
              <button
                onClick={() => setStatusFilter('reserved')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center ${statusFilter === 'reserved' ? 'bg-orange-600 text-white border border-orange-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <CalendarDays className="w-4 h-4 mr-1.5" /> ติดจอง
              </button>
              <button
                onClick={() => setStatusFilter('in-use')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center ${statusFilter === 'in-use' ? 'bg-blue-600 text-white border border-blue-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <Clock className="w-4 h-4 mr-1.5" /> ใช้งานอยู่
              </button>
              <button
                onClick={() => setStatusFilter('maintenance')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center ${statusFilter === 'maintenance' ? 'bg-orange-600 text-white border border-orange-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <Wrench className="w-4 h-4 mr-1.5" /> ซ่อมบำรุง
              </button>
            </div>

            {/* Car List - Stacked for Mobile */}
            <div className="space-y-4">
              {filteredCars.map(car => {
                const activeReservations = reservations
                  .filter(r => r.carId === car.id && r.status === 'active' && new Date(r.startDate) > new Date())
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                const nextReservation = activeReservations[0];

                return (
                <div 
                  key={car.id} 
                  onClick={() => { setSelectedCarId(car.id); setView('detail'); }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden active:scale-[0.98] transition-all cursor-pointer flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl">
                        <CarIcon className="w-6 h-6" />
                      </div>
                      <StatusBadge status={car.status} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-0.5">{car.licensePlate}</h3>
                    <p className="text-sm text-slate-500 font-medium">{car.brand} {car.model}</p>
                    {car.manager && (
                      <p className="text-xs text-orange-600 font-medium mt-1 bg-orange-50 inline-block px-2 py-0.5 rounded-md border border-orange-100">
                        ผู้ดูแล: {car.manager}
                      </p>
                    )}
                    
                    {/* Maintenance Alerts */}
                    {isMaintenanceDue(car) && (
                      <div className="mt-3 flex items-center text-xs font-medium text-red-600 bg-red-50 px-2.5 py-2 rounded-xl border border-red-100">
                        <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                        ถึงกำหนดเช็คระยะ ({car.currentMileage.toLocaleString()} กม.)
                      </div>
                    )}
                    {!isMaintenanceDue(car) && isMaintenanceNear(car) && (
                      <div className="mt-3 flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-2 rounded-xl border border-orange-100">
                        <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                        ใกล้เช็คระยะ ({car.currentMileage.toLocaleString()} กม.)
                      </div>
                    )}

                    {/* Upcoming Reservation */}
                    {nextReservation && (
                      <div className="mt-3 flex items-start text-xs text-orange-700 bg-orange-50 px-3 py-2.5 rounded-xl border border-orange-100">
                        <CalendarDays className="w-4 h-4 mr-2 shrink-0 mt-0.5 text-orange-500" />
                        <div>
                          <p className="font-semibold mb-0.5">จอง: {nextReservation.driverName}</p>
                          <p className="text-orange-600/80">{formatDate(nextReservation.startDate)}</p>
                          {activeReservations.length > 1 && (
                            <p className="text-[10px] mt-1 font-medium bg-orange-100 inline-block px-1.5 py-0.5 rounded text-orange-800">
                              + อีก {activeReservations.length - 1} คิว
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {car.status === 'in-use' && car.currentDriver && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 text-sm font-bold shrink-0">
                          {car.currentDriver.charAt(0)}
                        </div>
                        <span className="truncate">ผู้ขับ: <span className="font-semibold text-slate-900">{car.currentDriver}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
              {filteredCars.length === 0 && (
                <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
                  <CarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-lg font-medium text-slate-900">ไม่พบข้อมูลรถ</p>
                  <p className="text-sm mt-1">ลองค้นหาด้วยคำอื่น</p>
                </div>
              )}
            </div>

            {/* Floating Action Button (FAB) for Mobile */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center hover:bg-orange-700 active:scale-90 transition-all z-40"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ต้องการดู</label>
                  <input 
                    type="date" 
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">รถยนต์</label>
                  <select 
                    value={historyCarId}
                    onChange={(e) => setHistoryCarId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                  >
                    <option value="all">ทุกคัน</option>
                    {cars.map(c => (
                      <option key={c.id} value={c.id}>{c.licensePlate} ({c.brand} {c.model})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center">
                  <History className="w-5 h-5 mr-2 text-orange-600" />
                  ประวัติการใช้งาน
                </h3>
              </div>
              <div className="p-5">
                {(() => {
                  const filteredLogs = logs.filter(l => {
                    const logDate = new Date(l.timestamp).toISOString().slice(0, 10);
                    
                    let matchTime = true;
                    if (historyDate) {
                      matchTime = logDate === historyDate;
                    }

                    const matchCar = historyCarId === 'all' || l.carId === historyCarId;
                    return matchTime && matchCar;
                  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                  if (filteredLogs.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p>ไม่มีประวัติการใช้งานในช่วงเวลาที่เลือก</p>
                      </div>
                    );
                  }

                  return (
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                      {filteredLogs.map((log) => {
                        const logCar = cars.find(c => c.id === log.carId);
                        return (
                          <div key={log.id} className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                              log.type === 'check-out' ? 'bg-blue-500' : 
                              log.type === 'check-in' ? 'bg-emerald-500' : 
                              log.type === 'accident' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider w-fit ${
                                    log.type === 'check-out' ? 'bg-blue-100 text-blue-700' : 
                                    log.type === 'check-in' ? 'bg-emerald-100 text-emerald-700' : 
                                    log.type === 'accident' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {log.type === 'check-out' ? 'รับรถออก' : log.type === 'check-in' ? 'คืนรถเข้า' : log.type === 'accident' ? 'แจ้งอุบัติเหตุ' : 'ซ่อมบำรุง'}
                                  </span>
                                  {historyCarId === 'all' && logCar && (
                                    <span className="text-xs font-semibold text-slate-700">{logCar.licensePlate}</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                  {formatDate(log.timestamp)}
                                </div>
                              </div>
                              <p className="text-slate-900 font-semibold text-sm mb-2">{log.driverName}</p>
                              
                              {(log.notes || log.mileage || log.maintenanceType) && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
                                  {log.maintenanceType && <p><span className="font-medium text-slate-700">ประเภทการซ่อม:</span> {log.maintenanceType}</p>}
                                  {log.mileage && <p><span className="font-medium text-slate-700">เลขไมล์:</span> {log.mileage.toLocaleString()} กม.</p>}
                                  {log.notes && <p><span className="font-medium text-slate-700">หมายเหตุ:</span> {log.notes}</p>}
                                </div>
                              )}

                              {/* Display Photos if available */}
                              {log.photos && log.photos.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200/60">
                                  <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
                                    {log.photos.map((photo, i) => (
                                      <button key={i} onClick={() => setPreviewImage(photo)} className="shrink-0 active:scale-95 transition-transform">
                                        <img src={photo} alt={`Car state ${i+1}`} className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {view === 'detail' && selectedCar && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 pb-24">
            
            {/* Header Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mr-4 shadow-inner shrink-0">
                  <CarIcon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedCar.licensePlate}</h2>
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                      title="แก้ไขข้อมูลรถ"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-slate-500 font-medium">{selectedCar.brand} {selectedCar.model}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <StatusBadge status={selectedCar.status} />
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  ไมล์: {selectedCar.currentMileage.toLocaleString()} กม.
                </span>
                {selectedCar.manager && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                    ผู้ดูแล: {selectedCar.manager}
                  </span>
                )}
              </div>

              {/* Maintenance Alerts in Detail */}
              {isMaintenanceDue(selectedCar) && (
                <div className="flex items-center text-sm font-medium text-red-600 bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                  <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                  ถึงกำหนดเช็คระยะ ({selectedCar.currentMileage.toLocaleString()} / {selectedCar.nextMaintenanceMileage.toLocaleString()} กม.)
                </div>
              )}
              {!isMaintenanceDue(selectedCar) && isMaintenanceNear(selectedCar) && (
                <div className="flex items-center text-sm font-medium text-orange-600 bg-orange-50 px-3 py-2.5 rounded-xl border border-orange-100">
                  <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                  ใกล้ถึงกำหนดเช็คระยะ ({selectedCar.currentMileage.toLocaleString()} / {selectedCar.nextMaintenanceMileage.toLocaleString()} กม.)
                </div>
              )}

              {selectedCar.status === 'in-use' && selectedCar.currentDriver && (
                <div className="mt-4 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center mr-3 font-bold text-lg shrink-0">
                    {selectedCar.currentDriver.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-0.5">ผู้ใช้งานปัจจุบัน</p>
                    <p className="text-slate-900 font-semibold">{selectedCar.currentDriver}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs & Content */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setDetailTab('history')}
                  className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors text-center ${detailTab === 'history' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  ประวัติการใช้งาน
                </button>
                <button
                  onClick={() => setDetailTab('reservations')}
                  className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors text-center flex items-center justify-center ${detailTab === 'reservations' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  รายการจอง 
                  {carReservations.length > 0 && (
                    <span className="ml-1.5 bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-[10px]">{carReservations.length}</span>
                  )}
                </button>
              </div>
              
              <div className="p-5">
                {/* Tab Content: History */}
                {detailTab === 'history' && (
                  <div>
                    <div className="mb-6 flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
                        <span className="text-sm font-medium text-slate-700 whitespace-nowrap">เลือกวันที่:</span>
                        <input 
                          type="date" 
                          value={detailHistoryDate}
                          onChange={(e) => setDetailHistoryDate(e.target.value)}
                          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white w-full sm:w-auto"
                        />
                      </div>
                    </div>
                    {carLogs.length > 0 ? (
                      <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                        {carLogs.map((log) => (
                          <div key={log.id} className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                              log.type === 'check-out' ? 'bg-blue-500' : 
                              log.type === 'check-in' ? 'bg-emerald-500' : 
                              log.type === 'accident' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  log.type === 'check-out' ? 'bg-blue-100 text-blue-700' : 
                                  log.type === 'check-in' ? 'bg-emerald-100 text-emerald-700' : 
                                  log.type === 'accident' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {log.type === 'check-out' ? 'รับรถออก' : log.type === 'check-in' ? 'คืนรถเข้า' : log.type === 'accident' ? 'แจ้งอุบัติเหตุ' : 'ซ่อมบำรุง'}
                                </span>
                                <div className="text-xs text-slate-500 font-medium">
                                  {formatDate(log.timestamp)}
                                </div>
                              </div>
                              <p className="text-slate-900 font-semibold text-sm mb-2">{log.driverName}</p>
                              
                              {(log.notes || log.mileage || log.maintenanceType) && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
                                  {log.maintenanceType && <p><span className="font-medium text-slate-700">ประเภทการซ่อม:</span> {log.maintenanceType}</p>}
                                  {log.mileage && <p><span className="font-medium text-slate-700">เลขไมล์:</span> {log.mileage.toLocaleString()} กม.</p>}
                                  {log.notes && <p><span className="font-medium text-slate-700">หมายเหตุ:</span> {log.notes}</p>}
                                </div>
                              )}

                              {/* Display Photos if available */}
                              {log.photos && log.photos.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200/60">
                                  <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
                                    {log.photos.map((photo, i) => (
                                      <button key={i} onClick={() => setPreviewImage(photo)} className="shrink-0 active:scale-95 transition-transform">
                                        <img src={photo} alt={`Car state ${i+1}`} className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm font-medium">ไม่มีประวัติการใช้งานในช่วงเวลาที่เลือก</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content: Reservations */}
                {detailTab === 'reservations' && (
                  <div className="space-y-3">
                    {carReservations.length > 0 ? (
                      carReservations.map(res => (
                        <div key={res.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-900 font-bold">{res.driverName}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                              จองล่วงหน้า
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-slate-600 mb-2 bg-white p-2 rounded-lg border border-slate-100">
                            <CalendarDays className="w-4 h-4 mr-2 text-orange-500 shrink-0" />
                            <span>{formatDate(res.startDate)}<br/><span className="text-slate-400">ถึง</span> {formatDate(res.endDate)}</span>
                          </div>
                          {res.notes && <p className="text-xs text-slate-600"><span className="font-medium">หมายเหตุ:</span> {res.notes}</p>}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500 text-sm font-medium">ยังไม่มีรายการจองรถคันนี้</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 pb-8 text-center">
              <button 
                onClick={() => handleDeleteCar(selectedCar.id)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ลบข้อมูลรถคันนี้
              </button>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-6 sm:pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 flex justify-center">
              <div className="max-w-3xl w-full flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsReserveModalOpen(true)}
                    className="flex-1 inline-flex items-center justify-center py-3.5 border border-transparent text-sm font-bold rounded-2xl text-orange-700 bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all"
                  >
                    <CalendarDays className="w-5 h-5 mr-2" />
                    จองรถ
                  </button>
                  
                  {selectedCar.status === 'available' && (
                    <>
                      <button 
                        onClick={() => setIsMaintenanceModalOpen(true)}
                        className="flex-1 inline-flex items-center justify-center py-3.5 border border-transparent text-sm font-bold rounded-2xl text-orange-700 bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all"
                      >
                        <Wrench className="w-5 h-5 mr-2" />
                        ซ่อมบำรุง
                      </button>
                      <button 
                        onClick={() => setIsCheckoutModalOpen(true)}
                        className="flex-[1.5] inline-flex items-center justify-center py-3.5 border border-transparent text-sm font-bold rounded-2xl shadow-sm text-white bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all"
                      >
                        <Key className="w-5 h-5 mr-2" />
                        รับรถ
                      </button>
                    </>
                  )}
                  
                  {selectedCar.status === 'in-use' && (
                    <>
                      <button 
                        onClick={() => setIsMaintenanceModalOpen(true)}
                        className="flex-1 inline-flex items-center justify-center py-3.5 border border-transparent text-sm font-bold rounded-2xl text-orange-700 bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all"
                      >
                        <Wrench className="w-5 h-5 mr-2" />
                        ซ่อมบำรุง
                      </button>
                      <button 
                        onClick={() => setIsCheckinModalOpen(true)}
                        className="flex-[1.5] inline-flex items-center justify-center py-3.5 border border-transparent text-sm font-bold rounded-2xl shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        คืนรถ
                      </button>
                    </>
                  )}

                  {selectedCar.status === 'maintenance' && (
                    <button 
                      onClick={async () => {
                        const newLog: UsageLog = {
                          id: Math.random().toString(36).substr(2, 9),
                          carId: selectedCar.id,
                          type: 'maintenance-end',
                          driverName: 'Admin',
                          timestamp: new Date().toISOString(),
                        };
                        try {
                          const batch = writeBatch(db);
                          batch.set(doc(db, 'logs', newLog.id), newLog);
                          batch.update(doc(db, 'cars', selectedCar.id), { status: 'available' });
                          await batch.commit();
                        } catch (error) {
                          try {
                            handleFirestoreError(error, OperationType.WRITE, 'cars/logs');
                          } catch (e) {
                            setAppError(e as Error);
                          }
                        }
                      }}
                      className="flex-[1.5] inline-flex items-center justify-center py-3.5 border border-transparent text-sm font-bold rounded-2xl shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      เสร็จสิ้นซ่อมบำรุง
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => setIsAccidentModalOpen(true)}
                  className="w-full inline-flex items-center justify-center py-3 border border-red-200 text-sm font-bold rounded-2xl text-red-700 bg-red-50 hover:bg-red-100 active:scale-95 transition-all"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  แจ้งอุบัติเหตุ / บันทึกภาพความเสียหาย
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      {alertDialog && (
        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          message={alertDialog.message}
          onConfirm={() => setAlertDialog(null)}
        />
      )}

      {/* Modals - Using BottomSheetModal for Mobile */}
      <BottomSheetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="เพิ่มรถใหม่">
        <form onSubmit={handleAddCar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ทะเบียนรถ <span className="text-red-500">*</span></label>
            <input required name="licensePlate" type="text" className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="เช่น 1กข 1234" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ <span className="text-red-500">*</span></label>
              <input required name="brand" type="text" className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="Toyota" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รุ่น <span className="text-red-500">*</span></label>
              <input required name="model" type="text" className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="Revo" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ผู้ดูแล</label>
            <input name="manager" type="text" className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="ชื่อผู้ดูแลรถ (ถ้ามี)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เลขไมล์ปัจจุบัน</label>
              <input required name="currentMileage" type="number" defaultValue={0} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">กำหนดเช็คระยะ</label>
              <input required name="nextMaintenanceMileage" type="number" defaultValue={10000} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
            </div>
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-sm">บันทึกข้อมูลรถ</button>
          </div>
        </form>
      </BottomSheetModal>

      <BottomSheetModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="แก้ไขข้อมูลรถ">
        {selectedCar && (
          <form onSubmit={handleEditCar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ทะเบียนรถ <span className="text-red-500">*</span></label>
              <input required name="licensePlate" type="text" defaultValue={selectedCar.licensePlate} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="เช่น 1กข 1234" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ <span className="text-red-500">*</span></label>
                <input required name="brand" type="text" defaultValue={selectedCar.brand} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="Toyota" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รุ่น <span className="text-red-500">*</span></label>
                <input required name="model" type="text" defaultValue={selectedCar.model} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="Revo" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ผู้ดูแล</label>
              <input name="manager" type="text" defaultValue={selectedCar.manager || ''} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="ชื่อผู้ดูแลรถ (ถ้ามี)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">เลขไมล์ปัจจุบัน</label>
                <input required name="currentMileage" type="number" defaultValue={selectedCar.currentMileage} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">กำหนดเช็คระยะ</label>
                <input required name="nextMaintenanceMileage" type="number" defaultValue={selectedCar.nextMaintenanceMileage} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-sm">บันทึกการแก้ไข</button>
            </div>
          </form>
        )}
      </BottomSheetModal>

      <BottomSheetModal isOpen={isReserveModalOpen} onClose={() => { setIsReserveModalOpen(false); setReserveEmployee(''); }} title="จองการใช้งานรถ">
        <form onSubmit={handleReserve} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้จอง <span className="text-red-500">*</span></label>
            <select 
              required 
              name="employeeSelect" 
              value={reserveEmployee}
              onChange={(e) => setReserveEmployee(e.target.value)}
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
            >
              <option value="">เลือกพนักงาน</option>
              {EMPLOYEES.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
              <option value="other">อื่นๆ (ระบุ)</option>
            </select>
            {reserveEmployee === 'other' && (
              <input 
                required 
                name="customEmployeeInput" 
                type="text" 
                className="w-full px-4 py-3 mt-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all animate-in fade-in slide-in-from-top-2" 
                placeholder="ระบุชื่อ-นามสกุล" 
              />
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">วันที่เริ่ม <span className="text-red-500">*</span></label>
              <input required name="startDate" type="datetime-local" className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">วันที่สิ้นสุด <span className="text-red-500">*</span></label>
              <input required name="endDate" type="datetime-local" className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">วัตถุประสงค์</label>
            <textarea name="notes" rows={2} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none" placeholder="ไปพบลูกค้า..." />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-sm">ยืนยันการจอง</button>
          </div>
        </form>
      </BottomSheetModal>

      <BottomSheetModal isOpen={isCheckoutModalOpen} onClose={() => { setIsCheckoutModalOpen(false); setCheckoutEmployee(''); }} title="บันทึกการรับรถ">
        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้เบิกรถ <span className="text-red-500">*</span></label>
            <select 
              required 
              name="employeeSelect" 
              value={checkoutEmployee}
              onChange={(e) => setCheckoutEmployee(e.target.value)}
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
            >
              <option value="">เลือกพนักงาน</option>
              {EMPLOYEES.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
              <option value="other">อื่นๆ (ระบุ)</option>
            </select>
            {checkoutEmployee === 'other' && (
              <input 
                required 
                name="customEmployeeInput" 
                type="text" 
                className="w-full px-4 py-3 mt-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all animate-in fade-in slide-in-from-top-2" 
                placeholder="ระบุชื่อ-นามสกุล" 
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">วัตถุประสงค์</label>
            <textarea name="notes" rows={3} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none" placeholder="ไปพบลูกค้า..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">เลขไมล์ปัจจุบัน (กม.) <span className="text-red-500">*</span></label>
            <input required name="mileage" type="number" defaultValue={selectedCar?.currentMileage} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="15000" />
            <p className="text-xs text-slate-500 mt-1.5 ml-1">ไมล์ล่าสุด: {selectedCar?.currentMileage.toLocaleString()} กม.</p>
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-sm">ยืนยันการรับรถ</button>
          </div>
        </form>
      </BottomSheetModal>

      <BottomSheetModal isOpen={isCheckinModalOpen} onClose={() => { setIsCheckinModalOpen(false); setCheckinPhotos([]); }} title="บันทึกการคืนรถ">
        <form onSubmit={handleCheckin} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-2">
            <p className="text-sm text-blue-800"><span className="font-semibold">ผู้คืนรถ:</span> {selectedCar?.currentDriver}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">เลขไมล์ปัจจุบัน (กม.) <span className="text-red-500">*</span></label>
            <input required name="mileage" type="number" defaultValue={selectedCar?.currentMileage} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="15000" />
            <p className="text-xs text-slate-500 mt-1.5 ml-1">ไมล์ล่าสุด: {selectedCar?.currentMileage.toLocaleString()} กม.</p>
          </div>
          
          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">รูปภาพสภาพรถ (สูงสุด 6 รูป)</label>
            <div className="flex flex-wrap gap-3 mb-1">
              {checkinPhotos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={photo} alt="Car state" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(index, 'checkin')} className="absolute top-1 right-1 bg-red-500/90 backdrop-blur-sm text-white rounded-full p-1 active:scale-90 transition-transform">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {checkinPhotos.length < 6 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-colors bg-slate-50 active:scale-95">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">เพิ่มรูป</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'checkin')} />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-1">อัปโหลดแล้ว {checkinPhotos.length}/6 รูป</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">สภาพรถ / หมายเหตุ</label>
            <textarea name="notes" rows={2} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none" placeholder="รถปกติ, มีรอยขีดข่วน..." />
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm">ยืนยันการคืนรถ</button>
          </div>
        </form>
      </BottomSheetModal>

      <BottomSheetModal isOpen={isMaintenanceModalOpen} onClose={() => { setIsMaintenanceModalOpen(false); setMaintenanceEmployee(''); setMaintenancePhotos([]); }} title="บันทึกการซ่อมบำรุง">
        <form onSubmit={handleMaintenance} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้รับผิดชอบ <span className="text-red-500">*</span></label>
            <select 
              required 
              name="employeeSelect" 
              value={maintenanceEmployee}
              onChange={(e) => setMaintenanceEmployee(e.target.value)}
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
            >
              <option value="">เลือกพนักงาน</option>
              {EMPLOYEES.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
              <option value="other">อื่นๆ (ระบุ)</option>
            </select>
            {maintenanceEmployee === 'other' && (
              <input 
                required 
                name="customEmployeeInput" 
                type="text" 
                className="w-full px-4 py-3 mt-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all animate-in fade-in slide-in-from-top-2" 
                placeholder="ระบุชื่อ-นามสกุล" 
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">แจ้งซ่อม <span className="text-red-500">*</span></label>
            <select required name="maintenanceType" className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white">
              <option value="">เลือกประเภทการซ่อมบำรุง</option>
              <option value="เช็คระยะ">เช็คระยะ</option>
              <option value="เคลมประกัน">เคลมประกัน</option>
              <option value="เปลี่ยนแบต">เปลี่ยนแบต</option>
              <option value="เปลี่ยนยาง">เปลี่ยนยาง</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ซ่อมบำรุง <span className="text-red-500">*</span></label>
            <input required name="maintenanceDate" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">เลขไมล์ปัจจุบัน (กม.) <span className="text-red-500">*</span></label>
            <input required name="mileage" type="number" defaultValue={selectedCar?.currentMileage} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="15000" />
            <p className="text-xs text-slate-500 mt-1.5 ml-1">ไมล์ล่าสุด: {selectedCar?.currentMileage.toLocaleString()} กม.</p>
          </div>
          
          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">รูปภาพ (สูงสุด 4 รูป)</label>
            <div className="flex flex-wrap gap-3 mb-1">
              {maintenancePhotos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={photo} alt="Maintenance" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(index, 'maintenance')} className="absolute top-1 right-1 bg-red-500/90 backdrop-blur-sm text-white rounded-full p-1 active:scale-90 transition-transform">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {maintenancePhotos.length < 4 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-colors bg-slate-50 active:scale-95">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">เพิ่มรูป</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'maintenance')} />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-1">อัปโหลดแล้ว {maintenancePhotos.length}/4 รูป</p>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-sm">ยืนยันการซ่อมบำรุง</button>
          </div>
        </form>
      </BottomSheetModal>

      <BottomSheetModal isOpen={isAccidentModalOpen} onClose={() => { setIsAccidentModalOpen(false); setAccidentPhotos([]); }} title="แจ้งอุบัติเหตุ / บันทึกภาพความเสียหาย">
        <form onSubmit={handleAccidentReport} className="space-y-4">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-2">
            <p className="text-sm text-red-800"><span className="font-semibold">รถที่เกิดเหตุ:</span> {selectedCar?.licensePlate}</p>
            {selectedCar?.currentDriver && (
              <p className="text-sm text-red-800 mt-1"><span className="font-semibold">ผู้ใช้งานปัจจุบัน:</span> {selectedCar.currentDriver}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">รูปภาพความเสียหาย (สูงสุด 4 รูป)</label>
            <div className="flex flex-wrap gap-3 mb-1">
              {accidentPhotos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={photo} alt="Accident" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(index, 'accident')} className="absolute top-1 right-1 bg-red-500/90 backdrop-blur-sm text-white rounded-full p-1 active:scale-90 transition-transform">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {accidentPhotos.length < 4 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 cursor-pointer transition-colors bg-slate-50 active:scale-95">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">เพิ่มรูป</span>
                  <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handlePhotoUpload(e, 'accident')} />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 ml-1">อัปโหลดแล้ว {accidentPhotos.length}/4 รูป</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียด / หมายเหตุ <span className="text-red-500">*</span></label>
            <textarea required name="notes" rows={3} className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none" placeholder="อธิบายลักษณะการเกิดเหตุ หรือความเสียหายที่พบ..." />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-sm">บันทึกข้อมูล</button>
          </div>
        </form>
      </BottomSheetModal>

      <BottomSheetModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Export ประวัติการใช้รถ">
        <form onSubmit={handleExport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">รูปแบบการ Export</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="exportType" 
                  value="month" 
                  checked={exportType === 'month'} 
                  onChange={() => setExportType('month')}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-slate-700">รายเดือน</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="exportType" 
                  value="year" 
                  checked={exportType === 'year'} 
                  onChange={() => setExportType('year')}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-slate-700">รายปี</span>
              </label>
            </div>
          </div>

          {exportType === 'month' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เลือกเดือน</label>
              <input 
                required 
                name="month" 
                type="month" 
                defaultValue={new Date().toISOString().slice(0, 7)}
                className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เลือกปี</label>
              <input 
                required 
                name="year" 
                type="number" 
                min="2000" 
                max="2100" 
                defaultValue={new Date().getFullYear()}
                className="w-full px-4 py-3 text-base border border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
              />
            </div>
          )}

          <div className="pt-4">
            <button type="submit" className="w-full py-3.5 text-base font-bold text-white bg-green-600 rounded-2xl hover:bg-green-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center">
              <Download className="w-5 h-5 mr-2" />
              ดาวน์โหลด Excel
            </button>
          </div>
        </form>
      </BottomSheetModal>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <XCircle className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
