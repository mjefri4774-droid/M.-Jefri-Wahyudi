
export type Role = 'admin' | 'user';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface UserAccount extends UserProfile {
  password: string;
}

export interface Student {
  id: string;
  name: string;
  nisn: string;
  class: string;
  gender: 'Laki-laki' | 'Perempuan';
  rfidUid: string;
  avatar: string;
  parentPhone?: string; // Nomor WhatsApp Wali Murid
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  status?: 'ON_TIME' | 'LATE';
}

export interface SchoolProfile {
  name: string;
  appTitle: string;
  address: string;
  principal: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  logoUrl?: string;
  lateTime: string; // HH:mm
  outTime: string;  // HH:mm
  availableClasses: string[]; // Dynamic class list
}

export type View = 'dashboard' | 'students' | 'history' | 'rfid-sim' | 'reports' | 'settings' | 'users';

export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
}
