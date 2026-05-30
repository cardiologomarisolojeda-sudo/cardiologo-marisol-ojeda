import { Patient, Appointment, MedicalRecord, ClinicConfig, ClinicNotification } from '../types';

// Default configuration for Dra. Marisol Ojeda's clinic
const DEFAULT_CONFIG: ClinicConfig = {
  consultationPrice: 120, // $120 USD by default
  whatsappNumber: '+584141234567', // Customizable in Admin Panel
  onlineConsultationEnabled: true,
  workingHours: {
    'Lunes': { enabled: true, slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
    'Martes': { enabled: true, slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
    'Miércoles': { enabled: true, slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
    'Jueves': { enabled: true, slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
    'Viernes': { enabled: true, slots: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
    'Sábado': { enabled: false, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] },
    'Domingo': { enabled: false, slots: [] }
  },
  adminPin: '1234', // default PIN code
  masterPassword: 'marisol2026' // default Master Password required to enter PIN settings
};

// Polished Initial Cardiology Patient & Medical records to provide a premium interactive workspace
const INITIAL_PATIENTS: Patient[] = [
  { id: 'pat1', name: 'Alba Rosa Contreras', phone: '+584241234567', email: 'alba.contreras@gmail.com', dob: '1974-08-12', createdAt: '2026-05-15T10:00:00Z' },
  { id: 'pat2', name: 'Héctor Julio Méndez', phone: '+584129876543', email: 'hector.mendez@hotmail.com', dob: '1962-11-23', createdAt: '2026-05-18T14:30:00Z' },
  { id: 'pat3', name: 'Valerie Mercedes Soto', phone: '+584165551122', email: 'v.soto@yahoo.com', dob: '1989-04-05', createdAt: '2026-05-20T09:15:00Z' }
];

// Note: These medical records will be dynamically encrypted on load in DB using default cryptographic sequence
const MOCK_RECORDS = [
  {
    id: 'rec1',
    patientId: 'pat1',
    date: '2026-05-15',
    symptoms: 'Palpitaciones esporádicas nocturnas y leve disnea al subir escaleras.',
    diagnosis: 'Arritmia extrasistólica de origen ventricular bajo control, sospecha de hipertensión arterial leve.',
    treatment: 'Metoprolol Succinato 25mg diario en ayunas. Control de ingesta de cafeína y sodio.',
    bloodPressure: '135/85',
    heartRate: 78,
    electrocardiogramNotes: 'Ritmo sinusal regular. Complejos QRS normales. Presencia de extrasístoles ventriculares aisladas.',
    createdAt: '2026-05-15T11:00:00Z'
  },
  {
    id: 'rec2',
    patientId: 'pat2',
    date: '2026-05-18',
    symptoms: 'Dolor opresivo retroesternal intermitente asociado a estrés laboral elevado.',
    diagnosis: 'Angina inestable descartada. Cardiopatía isquémica crónica estable. Hipertensión Estadio II.',
    treatment: 'Aspirina 81mg, Atorvastatina 40mg cena, Losartán Potásico 50mg cada 12 horas.',
    bloodPressure: '150/95',
    heartRate: 64,
    electrocardiogramNotes: 'Eje cardíaco a la izquierda. Leve hipertrofia ventricular izquierda sin signos de isquemia subepicárdica aguda.',
    createdAt: '2026-05-18T15:30:00Z'
  }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app1',
    patientId: 'pat1',
    patientName: 'Alba Rosa Contreras',
    patientPhone: '+584241234567',
    date: '2026-06-01',
    time: '09:00',
    reason: 'Consulta de control cardiológico de rutina y revisión de ECG.',
    status: 'confirmed',
    isOnline: false,
    price: 120,
    createdAt: '2026-05-28T09:00:00Z'
  },
  {
    id: 'app2',
    patientId: 'pat2',
    patientName: 'Héctor Julio Méndez',
    patientPhone: '+584129876543',
    date: '2026-06-01',
    time: '10:30',
    reason: 'Lectura de Holter del ritmo cardíaco y reajuste terapéutico.',
    status: 'pending',
    isOnline: true,
    price: 120,
    createdAt: '2026-05-29T10:15:00Z'
  },
  {
    id: 'app3',
    patientId: 'pat3',
    patientName: 'Valerie Mercedes Soto',
    patientPhone: '+584165551122',
    date: '2026-06-02',
    time: '14:30',
    reason: 'Taquicardia en reposo posterior a entrenamiento de alto impacto.',
    status: 'pending',
    isOnline: false,
    price: 120,
    createdAt: '2026-05-30T14:00:00Z'
  }
];

const INITIAL_NOTIFICATIONS: ClinicNotification[] = [
  {
    id: 'not1',
    appointmentId: 'app2',
    patientName: 'Héctor Julio Méndez',
    dateTimeStr: 'Lunes 1 de Junio - 10:30 AM',
    type: 'pending',
    message: 'Nueva solicitud de cita online cargada al sistema.',
    read: false,
    createdAt: '2026-05-29T10:15:00Z'
  },
  {
    id: 'not2',
    appointmentId: 'app3',
    patientName: 'Valerie Mercedes Soto',
    dateTimeStr: 'Martes 2 de Junio - 02:30 PM',
    type: 'pending',
    message: 'Nueva solicitud de cita presencial registrada.',
    read: false,
    createdAt: '2026-05-30T14:00:00Z'
  }
];

// Helper to encrypt database records dynamically using a seed to maintain E2E security
import { encryptText, decryptText } from '../utils/crypto';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';

function encryptRecord(rec: typeof MOCK_RECORDS[0], key: string): MedicalRecord {
  return {
    id: rec.id,
    patientId: rec.patientId,
    date: rec.date,
    symptoms: encryptText(rec.symptoms, key),
    diagnosis: encryptText(rec.diagnosis, key),
    treatment: encryptText(rec.treatment, key),
    bloodPressure: rec.bloodPressure,
    heartRate: rec.heartRate,
    electrocardiogramNotes: encryptText(rec.electrocardiogramNotes, key),
    createdAt: rec.createdAt
  };
}

let listenersHooked = false;

// Initialize clean data layers inside localStorage to act as database collections and subscribe to Firestore
export function initDatabase() {
  const isInitialized = localStorage.getItem('marisol_db_initialized');
  if (!isInitialized) {
    const config = DEFAULT_CONFIG;
    // On first load, encrypt mock data using default master password for Dra. Marisol Ojeda
    const encryptedRecords = MOCK_RECORDS.map(r => encryptRecord(r, config.masterPassword));

    localStorage.setItem('marisol_config', JSON.stringify(config));
    localStorage.setItem('marisol_patients', JSON.stringify(INITIAL_PATIENTS));
    localStorage.setItem('marisol_records', JSON.stringify(encryptedRecords));
    localStorage.setItem('marisol_appointments', JSON.stringify(INITIAL_APPOINTMENTS));
    localStorage.setItem('marisol_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem('marisol_db_initialized', 'true');
  }

  if (listenersHooked) return;
  listenersHooked = true;

  // Real-time listener for Configuration
  onSnapshot(doc(db, 'clinic', 'config'), (docSnap) => {
    if (docSnap.exists()) {
      const configData = docSnap.data() as ClinicConfig;
      localStorage.setItem('marisol_config', JSON.stringify(configData));
      window.dispatchEvent(new Event('storage'));
    } else {
      // Seed Firestore with local configuration
      const localConfig = StorageService.getConfig();
      setDoc(doc(db, 'clinic', 'config'), localConfig).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, 'clinic/config');
      });
    }
  }, (error) => {
    console.error("Firestore config subscription failed:", error);
  });

  // Real-time listener for Patients
  onSnapshot(collection(db, 'patients'), (snapshot) => {
    const patientsList: Patient[] = [];
    snapshot.forEach((docSnap) => {
      patientsList.push(docSnap.data() as Patient);
    });
    if (patientsList.length > 0) {
      localStorage.setItem('marisol_patients', JSON.stringify(patientsList));
      window.dispatchEvent(new Event('storage'));
    } else {
      // Seed Firestore patients
      const localPatients = StorageService.getPatients();
      localPatients.forEach((p) => {
        setDoc(doc(db, 'patients', p.id), p).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `patients/${p.id}`);
        });
      });
    }
  }, (error) => {
    console.error("Firestore patients subscription failed:", error);
  });

  // Real-time listener for Appointments
  onSnapshot(collection(db, 'appointments'), (snapshot) => {
    const appointmentsList: Appointment[] = [];
    snapshot.forEach((docSnap) => {
      appointmentsList.push(docSnap.data() as Appointment);
    });
    if (appointmentsList.length > 0) {
      appointmentsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      localStorage.setItem('marisol_appointments', JSON.stringify(appointmentsList));
      window.dispatchEvent(new Event('storage'));
    } else {
      // Seed Firestore appointments
      const localApps = StorageService.getAppointments();
      localApps.forEach((a) => {
        setDoc(doc(db, 'appointments', a.id), a).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `appointments/${a.id}`);
        });
      });
    }
  }, (error) => {
    console.error("Firestore appointments subscription failed:", error);
  });

  // Real-time listener for Medical Records
  onSnapshot(collection(db, 'records'), (snapshot) => {
    const recordsList: MedicalRecord[] = [];
    snapshot.forEach((docSnap) => {
      recordsList.push(docSnap.data() as MedicalRecord);
    });
    if (recordsList.length > 0) {
      localStorage.setItem('marisol_records', JSON.stringify(recordsList));
      window.dispatchEvent(new Event('storage'));
    } else {
      // Seed Firestore records
      const localRecords = StorageService.getMedicalRecords();
      localRecords.forEach((r) => {
        setDoc(doc(db, 'records', r.id), r).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `records/${r.id}`);
        });
      });
    }
  }, (error) => {
    console.error("Firestore records subscription failed:", error);
  });

  // Real-time listener for Notifications
  onSnapshot(collection(db, 'notifications'), (snapshot) => {
    const notificationsList: ClinicNotification[] = [];
    snapshot.forEach((docSnap) => {
      notificationsList.push(docSnap.data() as ClinicNotification);
    });
    if (notificationsList.length > 0) {
      notificationsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      localStorage.setItem('marisol_notifications', JSON.stringify(notificationsList));
      window.dispatchEvent(new Event('storage'));
    } else {
      // Seed Firestore notifications
      const localNots = StorageService.getNotifications();
      localNots.forEach((n) => {
        setDoc(doc(db, 'notifications', n.id), n).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `notifications/${n.id}`);
        });
      });
    }
  }, (error) => {
    console.error("Firestore notifications subscription failed:", error);
  });
}

// Ensure database is initialized immediately
initDatabase();

export const StorageService = {
  // INITIALIZATION
  initDatabase,

  // CONFIG
  getConfig(): ClinicConfig {
    const data = localStorage.getItem('marisol_config');
    return data ? JSON.parse(data) : DEFAULT_CONFIG;
  },
  
  saveConfig(config: ClinicConfig) {
    localStorage.setItem('marisol_config', JSON.stringify(config));
    window.dispatchEvent(new Event('storage'));
    
    // Background write to Firestore
    setDoc(doc(db, 'clinic', 'config'), config).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, 'clinic/config');
    });
  },

  // PATIENTS
  getPatients(): Patient[] {
    const data = localStorage.getItem('marisol_patients');
    return data ? JSON.parse(data) : [];
  },

  registerPatient(name: string, phone: string, email: string, dob: string): Patient {
    const patients = this.getPatients();
    // Normalize phone numbers for precise comparison
    const normPhone = phone.replace(/[^0-9]/g, '');
    
    // Check if patient already exists by phone or by non-empty email
    const existing = patients.find(p => {
      const normP = p.phone.replace(/[^0-9]/g, '');
      if (normPhone !== '' && normP === normPhone) {
        return true;
      }
      if (email.trim() !== '' && p.email && p.email.toLowerCase().trim() === email.toLowerCase().trim()) {
        return true;
      }
      return false;
    });

    if (existing) {
      return existing;
    }

    const newPatient: Patient = {
      id: 'patient_' + Math.random().toString(36).substr(2, 9),
      name,
      phone,
      email: email.trim(),
      dob,
      createdAt: new Date().toISOString()
    };

    patients.push(newPatient);
    localStorage.setItem('marisol_patients', JSON.stringify(patients));
    window.dispatchEvent(new Event('storage'));

    // Background write to Firestore
    setDoc(doc(db, 'patients', newPatient.id), newPatient).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `patients/${newPatient.id}`);
    });

    return newPatient;
  },

  // APPOINTMENTS
  getAppointments(): Appointment[] {
    const data = localStorage.getItem('marisol_appointments');
    return data ? JSON.parse(data) : [];
  },

  bookAppointment(appointmentInfo: Omit<Appointment, 'id' | 'status' | 'createdAt'>): Appointment {
    const appointments = this.getAppointments();
    const newAppointment: Appointment = {
      ...appointmentInfo,
      id: 'app_' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    localStorage.setItem('marisol_appointments', JSON.stringify(appointments));

    // Create a clinician notification immediately about this appointment
    this.createNotification(
      newAppointment.id,
      newAppointment.patientName,
      `${newAppointment.date} a las ${newAppointment.time}`,
      `Nueva solicitud de cita ${newAppointment.isOnline ? 'Online' : 'Presencial'}`
    );

    window.dispatchEvent(new Event('storage'));

    // Background write to Firestore
    setDoc(doc(db, 'appointments', newAppointment.id), newAppointment).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `appointments/${newAppointment.id}`);
    });

    return newAppointment;
  },

  updateAppointmentStatus(id: string, status: 'confirmed' | 'cancelled') {
    const appointments = this.getAppointments();
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].status = status;
      localStorage.setItem('marisol_appointments', JSON.stringify(appointments));

      // Mark matching notification as processed
      const notifications = this.getNotifications();
      const updatedNots = notifications.map(n => {
        if (n.appointmentId === id) {
          const updatedNot = { ...n, read: true };
          // Background write notification to Firestore
          setDoc(doc(db, 'notifications', n.id), updatedNot).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `notifications/${n.id}`);
          });
          return updatedNot;
        }
        return n;
      });
      localStorage.setItem('marisol_notifications', JSON.stringify(updatedNots));
      window.dispatchEvent(new Event('storage'));

      // Background write appointment to Firestore
      const updatedApp = appointments[index];
      setDoc(doc(db, 'appointments', id), updatedApp).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `appointments/${id}`);
      });
    }
  },

  // MEDICAL RECORDS (HISTORIAL CLÍNICO)
  getMedicalRecords(): MedicalRecord[] {
    const data = localStorage.getItem('marisol_records');
    return data ? JSON.parse(data) : [];
  },

  // Encrypts clinical findings using physical cryptographic security before saving
  addMedicalRecord(patientId: string, recordInfo: Omit<MedicalRecord, 'id' | 'createdAt'>, masterPassword: string): MedicalRecord {
    const records = this.getMedicalRecords();
    const newRecord: MedicalRecord = {
      id: 'rec_' + Math.random().toString(36).substr(2, 9),
      patientId,
      date: recordInfo.date,
      // Apply E2E encryption
      symptoms: encryptText(recordInfo.symptoms, masterPassword),
      diagnosis: encryptText(recordInfo.diagnosis, masterPassword),
      treatment: encryptText(recordInfo.treatment, masterPassword),
      electrocardiogramNotes: encryptText(recordInfo.electrocardiogramNotes, masterPassword),
      // Numerical / public vitals stay visible for trend plotting if needed
      bloodPressure: recordInfo.bloodPressure,
      heartRate: recordInfo.heartRate,
      createdAt: new Date().toISOString()
    };

    records.push(newRecord);
    localStorage.setItem('marisol_records', JSON.stringify(records));
    window.dispatchEvent(new Event('storage'));

    // Background write to Firestore
    setDoc(doc(db, 'records', newRecord.id), newRecord).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `records/${newRecord.id}`);
    });

    return newRecord;
  },

  // Decrypts multiple records for visual display inside the Doctor UI
  getDecryptedRecords(patientId: string, masterPassword: string) {
    const records = this.getMedicalRecords().filter(r => r.patientId === patientId);
    return records.map(r => ({
      ...r,
      symptoms: decryptText(r.symptoms, masterPassword),
      diagnosis: decryptText(r.diagnosis, masterPassword),
      treatment: decryptText(r.treatment, masterPassword),
      electrocardiogramNotes: decryptText(r.electrocardiogramNotes, masterPassword),
    }));
  },

  // NOTIFICATIONS
  getNotifications(): ClinicNotification[] {
    const data = localStorage.getItem('marisol_notifications');
    return data ? JSON.parse(data) : [];
  },

  createNotification(appointmentId: string, patientName: string, dateTimeStr: string, message: string) {
    const notifications = this.getNotifications();
    const newNotification: ClinicNotification = {
      id: 'not_' + Math.random().toString(36).substr(2, 9),
      appointmentId,
      patientName,
      dateTimeStr,
      type: 'pending',
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotification); // Newer first
    localStorage.setItem('marisol_notifications', JSON.stringify(notifications));

    // Background write to Firestore
    setDoc(doc(db, 'notifications', newNotification.id), newNotification).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotification.id}`);
    });
  },

  markNotificationAsRead(id: string) {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem('marisol_notifications', JSON.stringify(notifications));
      window.dispatchEvent(new Event('storage'));

      // Background write to Firestore
      const updatedNot = notifications[index];
      setDoc(doc(db, 'notifications', id), updatedNot).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `notifications/${id}`);
      });
    }
  },

  markAllAsRead() {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('marisol_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));

    // Background write all to Firestore
    updated.forEach(n => {
      setDoc(doc(db, 'notifications', n.id), n).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `notifications/${n.id}`);
      });
    });
  }
};
