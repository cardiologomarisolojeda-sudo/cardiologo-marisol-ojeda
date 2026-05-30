import React, { useState, useEffect } from 'react';
import { 
  Lock, KeyRound, CalendarCheck, FileHeart, Settings, ShieldCheck, 
  User, Check, X, PlusCircle, ToggleLeft, ToggleRight, DollarSign, 
  Smartphone, Bell, Eye, EyeOff, Search, HeartPulse, Activity, Sparkles 
} from 'lucide-react';
import { Patient, Appointment, MedicalRecord, ClinicConfig, ClinicNotification } from '../types';
import { StorageService } from '../lib/storage';
import { decryptText, encryptText } from '../utils/crypto';
import Heartbeat from './Heartbeat';

interface AdminPanelProps {
  config: ClinicConfig;
  onConfigChanged: (newConfig: ClinicConfig) => void;
  pendingCount: number;
  onHandledAppointment: () => void;
}

export default function AdminPanel({ config, onConfigChanged, pendingCount, onHandledAppointment }: AdminPanelProps) {
  // Session / Authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Tab Manager
  const [activeTab, setActiveTab] = useState<'appointments' | 'patients' | 'schedule' | 'security'>('appointments');

  // Master password entry for E2E clinical data decryption
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptError, setDecryptError] = useState('');

  // Active data lists
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Search filter
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // New Clinical Record form states
  const [newSystolic, setNewSystolic] = useState('120');
  const [newDiastolic, setNewDiastolic] = useState('80');
  const [newHeartRate, setNewHeartRate] = useState(72);
  const [newEcgNotes, setNewEcgNotes] = useState('Eje normal, sin soplos ni síncope.');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newTreatment, setNewTreatment] = useState('');
  const [recordFeedback, setRecordFeedback] = useState('');

  // Security config and pricing states (bound to local copies before saving)
  const [tempPrice, setTempPrice] = useState(config.consultationPrice);
  const [tempWhatsapp, setTempWhatsapp] = useState(config.whatsappNumber);
  const [tempOnlineEnabled, setTempOnlineEnabled] = useState(config.onlineConsultationEnabled);

  // PIN settings protection state: user can change PIN only after providing valid master password
  const [isSecurityConfigUnlocked, setIsSecurityConfigUnlocked] = useState(false);
  const [securityMasterPassInput, setSecurityMasterPassInput] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState('');

  // Working Hours states for editing Schedule
  const [scheduleConfig, setScheduleConfig] = useState(config.workingHours);

  // Load lists on mounting
  useEffect(() => {
    if (isAdminAuthenticated) {
      setPatients(StorageService.getPatients());
      setAppointments(StorageService.getAppointments());
      setNotifications(StorageService.getNotifications());
    }
  }, [isAdminAuthenticated]);

  // Keep schedules in sync when parent config loads
  useEffect(() => {
    setScheduleConfig(config.workingHours);
    setTempPrice(config.consultationPrice);
    setTempWhatsapp(config.whatsappNumber);
    setTempOnlineEnabled(config.onlineConsultationEnabled);
  }, [config]);

  // Handle Admin Authenticate via PIN entry
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === config.adminPin) {
      setIsAdminAuthenticated(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('PIN incorrecto. Por favor verifique sus credenciales de seguridad.');
    }
  };

  // Turn on E2E live decryption for medical files
  const handleDecryptPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPasswordInput === config.masterPassword) {
      setIsDecrypted(true);
      setDecryptError('');
    } else {
      setDecryptError('Contraseña maestra incorrecta. No se puede iniciar la desencripción E2E.');
      setIsDecrypted(false);
    }
  };

  // Unlock secret PIN change screen
  const handleUnlockSecurityConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityMasterPassInput === config.masterPassword) {
      setIsSecurityConfigUnlocked(true);
      setSecurityError('');
    } else {
      setSecurityError('Contraseña incorrecta. Solo el administrador maestro puede alterar el PIN de acceso.');
      setIsSecurityConfigUnlocked(false);
    }
  };

  // Change Admin Pin
  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.match(/^\d{4,6}$/)) {
      setSecurityError('El PIN debe tener entre 4 y 6 dígitos numéricos.');
      return;
    }
    const updatedConfig = { ...config, adminPin: newPinInput };
    StorageService.saveConfig(updatedConfig);
    onConfigChanged(updatedConfig);
    setPinChangeSuccess('¡PIN de Acceso Administrador modificado exitosamente!');
    setNewPinInput('');
    setSecurityMasterPassInput('');
    setIsSecurityConfigUnlocked(false);
    setTimeout(() => {
      setPinChangeSuccess('');
    }, 5000);
  };

  // Handle Appointment Status change (Confirm / Cancel)
  const handleAppointmentAction = (id: string, action: 'confirmed' | 'cancelled') => {
    StorageService.updateAppointmentStatus(id, action);
    setAppointments(StorageService.getAppointments());
    setNotifications(StorageService.getNotifications());
    onHandledAppointment(); // update notifications count in main App
  };

  // Add E2E encrypted medical record to a patient
  const handleAddClinicalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    if (!isDecrypted) {
      setRecordFeedback('Debe autorizar el cifrado E2E con su contraseña maestra primero.');
      return;
    }
    if (!newSymptoms.trim() || !newDiagnosis.trim() || !newTreatment.trim()) {
      setRecordFeedback('Por favor complete todos los campos obligatorios.');
      return;
    }

    const bloodPressureStr = `${newSystolic}/${newDiastolic}`;
    
    StorageService.addMedicalRecord(selectedPatientId, {
      patientId: selectedPatientId,
      date: new Date().toISOString().split('T')[0],
      symptoms: newSymptoms,
      diagnosis: newDiagnosis,
      treatment: newTreatment,
      bloodPressure: bloodPressureStr,
      heartRate: newHeartRate,
      electrocardiogramNotes: newEcgNotes
    }, config.masterPassword);

    setNewSymptoms('');
    setNewDiagnosis('');
    setNewTreatment('');
    setNewSystolic('120');
    setNewDiastolic('80');
    setNewHeartRate(72);
    setNewEcgNotes('Eje normal, sin soplos ni síncope.');
    setRecordFeedback('¡Registro clínico encriptado y guardado con éxito!');
    
    setTimeout(() => {
      setRecordFeedback('');
    }, 4500);
  };

  // Save changes to general pricing and whatsapp settings
  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: ClinicConfig = {
      ...config,
      consultationPrice: Number(tempPrice),
      whatsappNumber: tempWhatsapp,
      onlineConsultationEnabled: tempOnlineEnabled,
      workingHours: scheduleConfig
    };
    StorageService.saveConfig(updatedConfig);
    onConfigChanged(updatedConfig);
    alert('Configuración clínica y disponibilidad modificados con éxito.');
  };

  // Toggle days availability and slot items
  const handleToggleDay = (day: string) => {
    const dayData = scheduleConfig[day];
    const updated = {
      ...scheduleConfig,
      [day]: {
        ...dayData,
        enabled: !dayData.enabled
      }
    };
    setScheduleConfig(updated);
  };

  // Add customized hour slot for a day
  const handleAddHourSlot = (day: string, hourStr: string) => {
    if (!hourStr.match(/^\d{2}:\d{2}$/)) return;
    const dayData = scheduleConfig[day];
    if (dayData.slots.includes(hourStr)) return;
    
    const updatedSlots = [...dayData.slots, hourStr].sort();
    const updated = {
      ...scheduleConfig,
      [day]: {
        ...dayData,
        slots: updatedSlots
      }
    };
    setScheduleConfig(updated);
  };

  // Delete slot
  const handleRemoveHourSlot = (day: string, slotToRemove: string) => {
    const dayData = scheduleConfig[day];
    const updatedSlots = dayData.slots.filter(s => s !== slotToRemove);
    const updated = {
      ...scheduleConfig,
      [day]: {
        ...dayData,
        slots: updatedSlots
      }
    };
    setScheduleConfig(updated);
  };

  // Filters patients list based on visual search
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.phone.includes(patientSearchQuery) ||
    (p.email && p.email.toLowerCase().includes(patientSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* ACCESS LOCKED GATE Screen */}
      {!isAdminAuthenticated ? (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle red/cardiology styling */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>
          
          <div className="mx-auto w-14 h-14 bg-red-600/10 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-2xl font-bold text-slate-100">Área Administrativa</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Solo personal clínicamente calificado. Dra. Marisol Ojeda - Cardiólogo.
          </p>

          {pinError && (
            <div className="mb-4 bg-red-950/40 border border-red-500/40 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-red-400" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350 block text-left">PIN de Seguridad Personal</label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••"
                pattern="[0-9]*"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-850 border border-slate-700 text-center rounded-2xl py-3.5 text-2xl tracking-[0.6em] text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 text-sm rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Autenticar Médico
            </button>
          </form>

          <p className="text-[10px] text-slate-500 mt-6 bg-slate-950/50 p-2.5 rounded-lg border border-slate-900/60">
            * El PIN por defecto del aplicativo es <span className="font-mono text-slate-400">1234</span>. Puede modificar este PIN ingresando su contraseña maestra dentro del panel una vez logueado.
          </p>
        </div>
      ) : (
        /* DOCTOR WORKSPACE Panel */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* NAV RAIL / SIDE BAR */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-5 space-y-5 shadow-md">
              <div className="pb-3 border-b border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-red-550 tracking-wider">Sesión Profesional</span>
                <h4 className="font-extrabold text-slate-100 flex items-center justify-center gap-1.5 mt-0.5">
                  <HeartPulse className="w-4 h-4 text-red-550" />
                  Dra. Marisol Ojeda
                </h4>
                <p className="text-[10px] text-slate-400">Cardiólogo Clínico</p>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === 'appointments'
                      ? 'bg-rose-600 text-white'
                      : 'bg-transparent text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4" />
                    Citas Programadas
                  </span>
                  {pendingCount > 0 && (
                    <span className="bg-white text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('patients')}
                  className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'patients'
                      ? 'bg-rose-600 text-white'
                      : 'bg-transparent text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <FileHeart className="w-4 h-4" />
                  Historiales Clínicos
                </button>

                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'schedule'
                      ? 'bg-rose-600 text-white'
                      : 'bg-transparent text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Agenda & Precios
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-rose-600 text-white'
                      : 'bg-transparent text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Seguridad PIN
                </button>
              </div>

              <button
                onClick={() => setIsAdminAuthenticated(false)}
                className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>

            {/* Quick Stats overview widget */}
            <div className="bg-slate-9002/40 rounded-2xl border border-slate-800/50 p-4 space-y-3">
              <h5 className="text-[11px] font-semibold text-slate-400">Resumen Clínico</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/60 p-2.5 rounded-xl text-center border border-slate-900">
                  <span className="text-[10px] text-slate-500">Pacientes</span>
                  <div className="text-xl font-bold text-slate-200">{patients.length}</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl text-center border border-slate-900">
                  <span className="text-[10px] text-slate-500">Pendientes</span>
                  <div className="text-xl font-bold text-rose-400">{pendingCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN FORM/TAB AREA (LG:COL-SPAN-3) */}
          <div className="lg:col-span-3 space-y-6">

            {/* TAB: CITAS PENDIENTES & CONFIRMACIONES */}
            {activeTab === 'appointments' && (
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-100">Citas Médicas Recibidas</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Historial de solicitudes en tiempo real</span>
                </div>

                {/* Notifications segment */}
                {notifications.some(n => !n.read) && (
                  <div className="bg-rose-950/15 border border-rose-500/20 text-rose-200 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Bell className="w-4 h-4 text-rose-400" />
                      <span>Notificaciones de Reservas Pendientes:</span>
                    </div>
                    <p className="text-[11px] text-rose-300">
                      Tiene solicitudes de citas esperando su validación cardiaca. Confirme o rechace a fin de liberar o reservar el espacio de tiempo.
                    </p>
                  </div>
                )}

                {appointments.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 italic">No se han registrado citas por ningún paciente en esta fecha.</div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map(appt => {
                      let statusBadge = "bg-amber-900/20 border-amber-500/35 text-amber-300";
                      let statusLabel = "Esperando Confirmación";

                      if (appt.status === 'confirmed') {
                        statusBadge = "bg-teal-950/20 border-teal-500/35 text-teal-300";
                        statusLabel = "Confirmada";
                      } else if (appt.status === 'cancelled') {
                        statusBadge = "bg-rose-950/20 border-rose-900/35 text-rose-300";
                        statusLabel = "Cancelada";
                      }

                      return (
                        <div key={appt.id} className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 space-y-3 relative overflow-hidden transition-all hover:bg-slate-950/60">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-900 uppercase tracking-wider text-slate-350">
                                {appt.isOnline ? 'Online (Vía WhatsApp)' : 'Presencial en Consultorio'}
                              </span>
                              <h4 className="text-base font-bold text-slate-100">{appt.patientName}</h4>
                            </div>
                            <div className={`sm:self-start px-3 py-1 rounded-full text-xs font-semibold uppercase border ${statusBadge}`}>
                              {statusLabel}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400">
                            <div>
                              <span className="block text-[10px] text-slate-500">Fecha Agenda</span>
                              <strong className="text-slate-300">{appt.date}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">Bloque Horario</span>
                              <strong className="text-slate-300">{appt.time} AM</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">Paciente Teléfono</span>
                              <strong className="text-slate-300">{appt.patientPhone}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500">Precio Cobrado</span>
                              <strong className="text-rose-400">${appt.price} USD</strong>
                            </div>
                          </div>

                          <div className="bg-slate-900/40 p-2.5 rounded-lg text-xs border border-slate-850/60 text-slate-300">
                            <span className="font-semibold text-slate-400 text-[10px] block mb-0.5">Motivo:</span>
                            {appt.reason}
                          </div>

                          {/* ACTION BUTTONS IF PENDING */}
                          {appt.status === 'pending' && (
                            <div className="flex gap-2 justify-end pt-2 border-t border-slate-900">
                              <button
                                onClick={() => handleAppointmentAction(appt.id, 'cancelled')}
                                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-450 border border-rose-950 text-xs font-bold transition-all cursor-pointer"
                              >
                                Descartar
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appt.id, 'confirmed')}
                                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Confirmar Turno
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MEDICAL HISTORIES & RECORD STORAGE (WITH E2E PRIVACY CODES) */}
            {activeTab === 'patients' && (
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <FileHeart className="w-5 h-5 text-rose-500" />
                    Historiales Clínicos y Expedientes Encriptados
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cifrado de extremo a extremo médico. Los registros se encriptan utilizando su contraseña de sistema.
                  </p>
                </div>

                {/* E2E DECRYPTION PROMPT GATE */}
                {!isDecrypted ? (
                  <div className="bg-slate-950/70 p-6 rounded-2xl border border-rose-950/40 text-center max-w-md mx-auto space-y-4">
                    <div className="mx-auto w-10 h-10 bg-rose-600/10 rounded-full flex items-center justify-center text-rose-400">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-200 text-sm">Clave de Descifrado Requerida</h4>
                      <p className="text-[11px] text-slate-405">
                        El historial se almacena de forma críptica de acuerdo con la privacidad absoluta de los datos. Ingrese su contraseña maestra para habilitar la visualización legible.
                      </p>
                    </div>

                    {decryptError && (
                      <div className="text-[11.5px] text-red-400 font-semibold bg-red-950/10 p-2 rounded-lg">
                        {decryptError}
                      </div>
                    )}

                    <form onSubmit={handleDecryptPrompt} className="space-y-3">
                      <input
                        type="password"
                        placeholder="Contraseña Maestra..."
                        value={masterPasswordInput}
                        onChange={(e) => setMasterPasswordInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 px-3 py-2 text-xs text-center rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Autorizar Descifrado E2E
                      </button>
                    </form>
                    <span className="text-[10px] text-slate-500 block">Por defecto: marisol2026</span>
                  </div>
                ) : (
                  /* DECRYPTED VIEW ACCESS ENABLED */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* PATIENT LIST SELECTOR */}
                    <div className="md:col-span-1 space-y-3 border-r border-slate-800 pr-0 md:pr-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar paciente..."
                          value={patientSearchQuery}
                          onChange={(e) => setPatientSearchQuery(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-800 text-xs py-2 pl-8 pr-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-white"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      </div>

                      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                        {filteredPatients.map(pat => {
                          const isSelected = selectedPatientId === pat.id;
                          return (
                            <button
                              key={pat.id}
                              onClick={() => setSelectedPatientId(pat.id)}
                              className={`w-full text-left p-2.5 rounded-xl transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-950/40 border-rose-500/60 text-white font-bold'
                                  : 'bg-slate-950/20 border-slate-900 hover:bg-slate-900/40 text-slate-300'
                              }`}
                            >
                              <div className="text-xs font-bold truncate">{pat.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{pat.phone}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PATIENT PROFILE AND MEDICAL CARD FILE */}
                    <div className="md:col-span-2 space-y-6">
                      {!selectedPatientId ? (
                        <div className="text-center p-12 text-slate-500 italic text-xs space-y-2">
                          <User className="w-8 h-8 mx-auto text-slate-700" />
                          <p>Seleccione un paciente de la barra lateral para examinar sus historiales de cardiología y prescribir nuevos registros.</p>
                        </div>
                      ) : (
                        (() => {
                          const patient = patients.find(p => p.id === selectedPatientId);
                          if (!patient) return null;
                          const decryptedRecords = StorageService.getDecryptedRecords(patient.id, config.masterPassword);

                          return (
                            <div className="space-y-6">
                              <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80 space-y-2">
                                <h4 className="text-sm font-bold text-rose-400">Expediente Clínico: {patient.name}</h4>
                                <div className="grid grid-cols-2 text-xs text-slate-400 gap-1 mt-2">
                                  <div>Nacimiento: <strong className="text-slate-300">{patient.dob}</strong></div>
                                  <div>Email: <strong className="text-slate-300">{patient.email || 'No registrado'}</strong></div>
                                  <div>Teléfono: <strong className="text-slate-300">{patient.phone}</strong></div>
                                  <div>Cifrado ID: <span className="font-mono text-slate-550 text-[10px]">{patient.id}</span></div>
                                </div>
                              </div>

                              {/* NEW CLINICAL RECORD FORM */}
                              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/80 space-y-3.5">
                                <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1 text-rose-300">
                                  <PlusCircle className="w-4 h-4" />
                                  Nueva Consulta / Nota de Cardiología (Se guardará Cifrada E2E)
                                </h5>

                                {recordFeedback && (
                                  <div className="bg-rose-950/20 border border-rose-500/30 text-rose-300 p-2.5 rounded-lg text-xs">
                                    {recordFeedback}
                                  </div>
                                )}

                                <form onSubmit={handleAddClinicalRecord} className="space-y-3">
                                  
                                  {/* Heart measurements parameters row */}
                                  <div className="grid grid-cols-3 gap-2.5">
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Sistólica (mmHg)</label>
                                      <input
                                        type="number"
                                        value={newSystolic}
                                        onChange={(e) => setNewSystolic(e.target.value)}
                                        className="w-full bg-slate-950 text-xs text-center border border-slate-850 rounded-lg p-1.5 text-slate-200"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Diastólica (mmHg)</label>
                                      <input
                                        type="number"
                                        value={newDiastolic}
                                        onChange={(e) => setNewDiastolic(e.target.value)}
                                        className="w-full bg-slate-950 text-xs text-center border border-slate-850 rounded-lg p-1.5 text-slate-200"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Frec. Cardíaca (lpm)</label>
                                      <input
                                        type="number"
                                        value={newHeartRate}
                                        onChange={(e) => setNewHeartRate(Number(e.target.value))}
                                        className="w-full bg-slate-950 text-xs text-center border border-slate-850 rounded-lg p-1.5 text-slate-200"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Notas de Electrocardiograma (ECG)</label>
                                    <input
                                      type="text"
                                      value={newEcgNotes}
                                      onChange={(e) => setNewEcgNotes(e.target.value)}
                                      className="w-full bg-slate-950 text-xs border border-slate-850 rounded-lg p-2 text-slate-250"
                                      placeholder="Hallazgos en trazados ondas P, complejo QRS..."
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Sintomatología Actual (Obligatorio)</label>
                                    <textarea
                                      rows={2}
                                      value={newSymptoms}
                                      onChange={(e) => setNewSymptoms(e.target.value)}
                                      className="w-full bg-slate-950 text-xs border border-slate-850 rounded-lg p-2 text-slate-250"
                                      placeholder="Dolor retroesternal, disnea de esfuerzo..."
                                      required
                                    ></textarea>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Diagnóstico Diagnóstico (Prerrogativa Médica)</label>
                                      <textarea
                                        rows={2}
                                        value={newDiagnosis}
                                        onChange={(e) => setNewDiagnosis(e.target.value)}
                                        className="w-full bg-slate-950 text-xs border border-slate-850 rounded-lg p-2 text-slate-250"
                                        placeholder="Ej. Hipertensión Estadio I, Fibrilación auricular benigna."
                                        required
                                      ></textarea>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Tratamiento e Indicaciones Médicas</label>
                                      <textarea
                                        rows={2}
                                        value={newTreatment}
                                        onChange={(e) => setNewTreatment(e.target.value)}
                                        className="w-full bg-slate-950 text-xs border border-slate-850 rounded-lg p-2 text-slate-250"
                                        placeholder="Medicamentos, dosis y frecuencia diaria."
                                        required
                                      ></textarea>
                                    </div>
                                  </div>

                                  <button
                                    type="submit"
                                    className="w-full bg-teal-600 hover:bg-teal-550 text-white font-bold py-2 text-xs rounded-xl transition-all cursor-pointer"
                                  >
                                    Guardar Nota de Cardiología en Base de Datos Cifrada
                                  </button>
                                </form>
                              </div>

                              {/* PARENT HISTORIC LIST */}
                              <div className="space-y-4">
                                <h5 className="text-xs font-bold text-slate-200">Historial de Visitas de Pacientes</h5>
                                {decryptedRecords.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">No se han registrado visitas clínicas previas para este paciente.</p>
                                ) : (
                                  decryptedRecords.map(rec => (
                                    <div key={rec.id} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                                      <div className="flex items-center justify-between font-semibold text-xs border-b border-slate-900 pb-1.5 mb-1.5">
                                        <span className="text-rose-455">Registro: {rec.date}</span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-slate-400">P. Art: <strong className="text-slate-250">{rec.bloodPressure} mmHg</strong></span>
                                          <span className="text-rose-400">F. Card: <strong className="text-rose-250">{rec.heartRate} lpm</strong></span>
                                        </div>
                                      </div>

                                      <div className="space-y-1.5 text-xs">
                                        <div>
                                          <span className="text-slate-500 font-medium block text-[10px]">ECG / Ritmo:</span>
                                          <p className="text-slate-300 italic">{rec.electrocardiogramNotes}</p>
                                        </div>
                                        <div>
                                          <span className="text-slate-500 font-medium block text-[10px]">Síntomas:</span>
                                          <p className="text-slate-300">{rec.symptoms}</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-900/60">
                                          <div>
                                            <span className="text-teal-400 font-medium block text-[10px]">Diagnóstico:</span>
                                            <p className="text-slate-200 font-medium">{rec.diagnosis}</p>
                                          </div>
                                          <div>
                                            <span className="text-amber-500 font-medium block text-[10px]">Tratamiento:</span>
                                            <p className="text-slate-200">{rec.treatment}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: AGENDA & PRICES (EDIT HOUR SLOTS / ONLINE TOGGLES / PRICES) */}
            {activeTab === 'schedule' && (
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-rose-500" />
                    Gestión de Horarios, Especialidades & Tarifas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modifique su disponibilidad en tiempo real para sus pacientes y el costo de su consulta médica.
                  </p>
                </div>

                <form onSubmit={handleSaveGeneralConfig} className="space-y-6">
                  
                  {/* PRECIO & WHATSAPP ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Price editor */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-rose-500" />
                        Precio Consulta (USD $)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={tempPrice}
                        onChange={(e) => setTempPrice(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        required
                      />
                      <p className="text-[10px] text-slate-500">Se reflejará instantáneamente en el portal para pacientes</p>
                    </div>

                    {/* Online Consultation Toggle */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                          <Smartphone className="w-4 h-4 text-teal-400" />
                          Consulta Online (WhatsApp)
                        </span>
                        <p className="text-[10px] text-slate-500">Habilite/deshabilite turnos virtuales y botón de enlace directo</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setTempOnlineEnabled(!tempOnlineEnabled)}
                          className="text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                          {tempOnlineEnabled ? (
                            <ToggleRight className="w-10 h-10 text-teal-450" />
                          ) : (
                            <ToggleLeft className="w-10 h-10 text-slate-600" />
                          )}
                        </button>
                        <span className="text-xs text-slate-400 font-bold">{tempOnlineEnabled ? 'HABILITADO' : 'DESACTIVADO'}</span>
                      </div>
                    </div>

                    {/* WhatsApp Number assignation (Opcional y modificable) */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                        <Smartphone className="w-4 h-4 text-green-400" />
                        Número WhatsApp Confirmación
                      </label>
                      <input
                        type="text"
                        placeholder="ej. +584141234567"
                        value={tempWhatsapp}
                        onChange={(e) => setTempWhatsapp(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <p className="text-[10px] text-slate-500">Opcional. Campo modificable para contacto con pacientes directos</p>
                    </div>

                  </div>

                  {/* WEEK DAY BLOCKS AVAILABILITIES */}
                  <div className="space-y-4">
                    <span className="block text-xs font-semibold text-slate-300 border-b border-slate-850 pb-2">Editar Disponibilidad por Día de Semana (General para Cualquier Mes/Año):</span>
                    
                    <div className="space-y-3">
                      {Object.keys(scheduleConfig).map(day => {
                        const dayData = scheduleConfig[day];
                        return (
                          <div key={day} className="p-3.5 rounded-xl bg-slate-950/20 border border-slate-850 flex items-center justify-between gap-4">
                            
                            {/* Day name and toggle state */}
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`day-enable-${day}`}
                                checked={dayData.enabled}
                                onChange={() => handleToggleDay(day)}
                                className="w-4 h-4 text-rose-600 border-slate-705 bg-slate-900 rounded focus:ring-rose-500 cursor-pointer"
                              />
                              <label htmlFor={`day-enable-${day}`} className={`text-sm font-bold cursor-pointer ${dayData.enabled ? 'text-slate-100' : 'text-slate-550'}`}>{day}</label>
                            </div>

                            {/* Simple text indication */}
                            <div>
                              {dayData.enabled ? (
                                <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-500/20">Disponible para Consultas</span>
                              ) : (
                                <span className="text-xs text-slate-650 italic bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-900">No Laborable / Cerrado</span>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SAVE ACTION */}
                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-505 text-white font-bold px-6 py-2.5 text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Guardar Configuración y Horarios
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB: SECURITY CONFIG (CHANGE PIN WITH MASTER PASSWORD PROTECTION) */}
            {activeTab === 'security' && (
              <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-rose-500" />
                    Configuración de PIN Administrativo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Establezca o cambie su PIN numérico para el panel. Para su protección, debe ingresar su clave maestra privada antes de proceder.
                  </p>
                </div>

                {pinChangeSuccess && (
                  <div className="bg-teal-950/20 border border-teal-500/40 text-teal-350 p-3.5 rounded-xl text-xs flex items-center gap-2 animate-bounce">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>{pinChangeSuccess}</span>
                  </div>
                )}

                {securityError && (
                  <div className="bg-red-950/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs">
                    {securityError}
                  </div>
                )}

                {!isSecurityConfigUnlocked ? (
                  /* LOCK PANEL FOR ADMIN DETAILS ENTRANCE */
                  <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850 max-w-sm mx-auto text-center space-y-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-rose-450">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-200">Verifique su Contraseña Maestra</h4>
                      <p className="text-[10px] text-slate-500">Debe validar su identidad exclusiva de administrador clínico antes de alterar el PIN.</p>
                    </div>

                    <form onSubmit={handleUnlockSecurityConfig} className="space-y-3">
                      <input
                        type="password"
                        placeholder="Contraseña Maestra..."
                        value={securityMasterPassInput}
                        onChange={(e) => setSecurityMasterPassInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 px-3 py-2 text-xs text-center rounded-lg text-white"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-slate-800 hover:bg-slate-750 text-white font-semibold py-2 text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Desbloquear Configuración PIN
                      </button>
                    </form>
                  </div>
                ) : (
                  /* CHANGE PIN SCREEN */
                  <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-850 max-w-sm mx-auto space-y-4">
                    <div className="text-center">
                      <Lock className="w-7 h-7 mx-auto text-rose-500 animate-pulse" />
                      <h4 className="text-sm font-bold text-slate-205 mt-1">Configurar Nuevo PIN Oculto</h4>
                    </div>

                    <form onSubmit={handlePinChange} className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Nuevo PIN Numérico (4-6 dígitos):</label>
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="••••••"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-slate-900 border border-slate-700 text-center py-2 text-lg rounded-lg text-white font-mono tracking-[0.4em]"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-505 text-white font-bold py-2 text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Establecer Nuevo PIN Seguro
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
