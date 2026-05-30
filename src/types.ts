export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string; // Fecha de nacimiento YYYY-MM-DD
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  isOnline: boolean; // Si es consulta online vía WhatsApp
  price: number; // Precio asignado al momento de agendar
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  symptoms: string; // Encriptado
  diagnosis: string; // Encriptado
  treatment: string; // Encriptado
  bloodPressure: string; // Presión arterial (ej. 120/80)
  heartRate: number; // Frecuencia cardíaca (ej. 72 lpm)
  electrocardiogramNotes: string; // Notas de Electrocardiograma (ECG) - Especialidad Cardiología
  createdAt: string;
}

export interface WorkingDayConfig {
  enabled: boolean;
  slots: string[]; // Lista de horas disponibles (ej: ["08:00", "08:30", "09:00", "15:00", "15:30"])
}

export interface ClinicConfig {
  consultationPrice: number; // en dólares
  whatsappNumber: string; // número asignado para la consulta online
  onlineConsultationEnabled: boolean; // true o false para permitir consultas online
  workingHours: {
    [dayOfWeek: string]: WorkingDayConfig; // Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
  };
  adminPin: string; // PIN numérico para el panel administrativo
  masterPassword: string; // Contraseña maestra para configuraciones de seguridad
}

export interface ClinicNotification {
  id: string;
  appointmentId: string;
  patientName: string;
  dateTimeStr: string; // ej. "Lunes 15 de Mayo - 10:00"
  type: 'pending' | 'system';
  message: string;
  read: boolean;
  createdAt: string;
}
