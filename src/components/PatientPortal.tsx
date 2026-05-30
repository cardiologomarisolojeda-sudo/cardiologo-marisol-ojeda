import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, Heart, ClipboardCheck, ArrowRight, Video, CheckCircle, AlertCircle, Sparkles, LogOut, MessageSquare } from 'lucide-react';
import { Patient, Appointment, ClinicConfig } from '../types';
import { StorageService } from '../lib/storage';
import Heartbeat from './Heartbeat';

interface PatientPortalProps {
  config: ClinicConfig;
  onAppointmentBooked: () => void;
}

export default function PatientPortal({ config, onAppointmentBooked }: PatientPortalProps) {
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [dobInput, setDobInput] = useState('');
  
  // Registration vs login toggler
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState('');

  // Booking states
  const [selectedDay, setSelectedDay] = useState<string>('Lunes');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('Consulta de Control General');
  const [isOnline, setIsOnline] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Reload appointments & current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('marisol_active_patient');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const allAppts = StorageService.getAppointments();
      setAppointments(allAppts.filter(a => a.patientId === currentUser.id));
    }
  }, [currentUser]);

  // Handle default initial date tomorrow and default initial time
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const defaultDateStr = `${year}-${month}-${day}`;
    
    setSelectedDate(defaultDateStr);
    setSelectedTime('10:00'); // Default appointment time
  }, []);

  // Update selectedDay automatically when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const dayName = weekdays[dateObj.getDay()];
      setSelectedDay(dayName);
    }
  }, [selectedDate]);

  // Handle Log out
  const handleLogout = () => {
    localStorage.removeItem('marisol_active_patient');
    setCurrentUser(null);
    setEmailInput('');
    setNameInput('');
    setPhoneInput('');
    setDobInput('');
    setSuccessMsg('');
    setErrorMessage('');
    setPendingWhatsappUrl('');
  };

  // Handle Login / Registration
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const phoneTrimmed = phoneInput.trim();
    if (!phoneTrimmed) {
      setErrorMessage('Por favor ingrese su número de teléfono.');
      return;
    }

    if (isRegistering) {
      if (!nameInput.trim() || !dobInput) {
        setErrorMessage('Por favor complete su nombre completo y fecha de nacimiento.');
        return;
      }
      const newPat = StorageService.registerPatient(nameInput, phoneTrimmed, emailInput.trim(), dobInput);
      localStorage.setItem('marisol_active_patient', JSON.stringify(newPat));
      setCurrentUser(newPat);
      setSuccessMsg(`Registro exitoso para ${newPat.name}`);
    } else {
      // Login check using phone number
      const patients = StorageService.getPatients();
      const normInput = phoneTrimmed.replace(/[^0-9]/g, '');
      const match = patients.find(p => {
        const normP = p.phone.replace(/[^0-9]/g, '');
        return (normP !== '' && normP === normInput) || p.phone.trim() === phoneTrimmed;
      });
      
      if (match) {
        localStorage.setItem('marisol_active_patient', JSON.stringify(match));
        setCurrentUser(match);
        setSuccessMsg(`Bienvenido de vuelta, ${match.name}`);
      } else {
        setErrorMessage('Número de teléfono no registrado. ¿Deseas crear una nueva cuenta?');
        setIsRegistering(true);
      }
    }
  };

  // Form Submit for Booking
  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (!selectedDate || !selectedTime) {
      setErrorMessage('Por favor seleccione una fecha y hora.');
      return;
    }

    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayName = weekdays[dateObj.getDay()];
    const isDayEnabled = dayName ? config.workingHours[dayName]?.enabled : false;
    
    if (!isDayEnabled) {
      setErrorMessage(`La Dra. Marisol Ojeda no ofrece consultas en el sistema los días ${dayName}. Por favor seleccione una fecha de lunes a viernes.`);
      return;
    }

    const appointment = StorageService.bookAppointment({
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientPhone: currentUser.phone,
      date: selectedDate,
      time: selectedTime,
      reason,
      isOnline: isOnline && config.onlineConsultationEnabled,
      price: config.consultationPrice
    });

    // Generate WhatsApp message and redirect URL
    const modalStr = isOnline ? 'Online vía WhatsApp' : 'Presencial';
    const reasonStr = reason || 'Chequeo Cardiológico General / Control';
    const msgText = `Hola Dra. Marisol Ojeda, acabo de solicitar agendar una cita de Cardiología en su Clínca:\n\n` +
                    `*Datos del Paciente:*\n` +
                    `• Nombre: ${currentUser.name}\n` +
                    `• Teléfono: ${currentUser.phone}\n` +
                    `• Correo: ${currentUser.email || 'No registrado'}\n\n` +
                    `*Detalles de la Citas:*\n` +
                    `• Fecha: ${formatDateFriendly(selectedDate)}\n` +
                    `• Hora: ${selectedTime}\n` +
                    `• Modalidad: ${modalStr}\n` +
                    `• Motivo: ${reasonStr}\n\n` +
                    `La cita ya se encuentra registrada en el sistema de la App en estado Pendiente. Quedo en espera de su manual revisión y confirmación. ¡Muchas gracias!`;

    const formattedPhone = config.whatsappNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msgText)}`;

    // Update state lists
    setAppointments(prev => [...prev, appointment]);
    setPendingWhatsappUrl(waUrl);
    setSuccessMsg('Su solicitud de consulta médica ha sido guardada adecuadamente en la aplicación. Para finalizar el proceso, proceda a presionar el botón verde de "Enviar Solicitud por WhatsApp" para enviar el mensaje estructurado de confirmación directamente a la Dra. Marisol Ojeda.');
    
    // Auto-open WhatsApp link in a new tab if allowed
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (popupErr) {
      console.warn("Could not auto-open WhatsApp due to popup blocker", popupErr);
    }

    // Notification for parent
    onAppointmentBooked();
  };

  // Nice date formatter for display in Spanish
  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Visual Header card for patient */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 p-6 sm:p-8 text-white shadow-xl border border-red-900/40">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Heart className="w-40 h-40 fill-red-500 text-red-500 animate-pulse" />
        </div>
        
        <div className="relative max-w-xl space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium border border-red-500/30">
            <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
            Cuidado Cardiovascular de Excelencia
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Portal de Pacientes</h2>
          <p className="text-slate-200">
            Bienvenido al consultorio de la <strong className="text-red-500 font-extrabold text-lg">Dra. Marisol Ojeda</strong>.
          </p>
        </div>

        {/* Electrocardiogram aesthetic overlay */}
        <div className="mt-8">
          <Heartbeat speed={3.5} color="text-red-500" />
        </div>
      </div>

      {/* NOT LOGGED IN ACCORDION / LOGIN FORM */}
      {!currentUser ? (
        <div className="max-w-md mx-auto bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden" id="patient-auth">
          {/* Subtle grid accent inside auth */}
          <div className="absolute inset-0 bg-cardiology-app opacity-20 pointer-events-none z-0"></div>

          <div className="relative z-10 text-center space-y-1 mb-6">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
              <Heart className="w-6 h-6 fill-red-500 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              {isRegistering ? 'Nuevo Registro de Paciente' : 'Identificación del Paciente'}
            </h3>
            <p className="text-sm text-slate-400">
              {isRegistering 
                ? 'Ingrese sus datos para crear su ficha médica digital'
                : 'Ingrese su número de teléfono para ingresar a su panel de citas'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 bg-red-900/25 border border-red-500/40 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2 relative z-10">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Teléfono</label>
              <input
                type="tel"
                placeholder="+584120000000"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Su nombre y apellido"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    placeholder="ejemplo@paciente.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={dobInput}
                    onChange={(e) => setDobInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{isRegistering ? 'Completar Registro' : 'Ingresar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center relative z-10">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
            >
              {isRegistering 
                ? '¿Ya tienes una cuenta? Inicia Sesión'
                : '¿Primera vez aquí? Regístrate gratis en la agenda'}
            </button>
          </div>
        </div>
      ) : (
        /* LOGGED IN PACIENTE EXPERIENCIA */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* COLUMNA IZQUIERDA: PROFILE + SU HISTORIAL DE CITAS EN TIEMPO REAL */}
          <div className="space-y-6 lg:col-span-1">
            {/* Paciente Welcome Profile Dashboard Card */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-red-650/20 rounded-full flex items-center justify-center text-red-500 border border-red-500/30">
                    <Heart className="w-5 h-5 fill-red-500/20" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{currentUser.name}</h3>
                    <p className="text-xs text-slate-400">{currentUser.email || 'Sin correo electrónico registrado'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span className="font-medium text-slate-200">{currentUser.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>F. Nacimiento:</span>
                  <span className="font-medium text-slate-200">{currentUser.dob}</span>
                </div>
                <div className="flex justify-between">
                  <span>Identificador PAC:</span>
                  <span className="font-mono text-slate-500">{currentUser.id.slice(-8)}</span>
                </div>
              </div>
            </div>

            {/* PACIENTES PERSONALIZED NOTIFICATIONS (PANEL DE CONTROL INTUITIVO) */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-200 text-sm">Mis Notificaciones</h3>
              </div>

              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No posees notificaciones o indicaciones activas en este momento.</p>
                ) : (
                  appointments.map(appt => {
                    let alertBg = "bg-slate-800/50 border-slate-700/60 text-slate-400";
                    let stateText = "Pendiente de aprobación";
                    
                    if (appt.status === 'confirmed') {
                      alertBg = "bg-teal-950/30 border-teal-500/30 text-teal-300";
                      stateText = "Cita Confirmada";
                    } else if (appt.status === 'cancelled') {
                      alertBg = "bg-rose-950/20 border-rose-900/30 text-rose-300";
                      stateText = "Cancelada";
                    }

                    return (
                      <div key={appt.id} className={`p-3 rounded-xl border text-xs space-y-2 ${alertBg}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center gap-1.5">
                            {appt.isOnline ? <Video className="w-3.5 h-3.5 text-rose-400" /> : <ClipboardCheck className="w-3.5 h-3.5 text-rose-400" />}
                            {appt.isOnline ? 'Consulta Online' : 'Consulta Presencial'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-900/40">
                            {stateText}
                          </span>
                        </div>
                        
                        <p className="text-slate-300 space-y-1.5 flex flex-col">
                          {appt.status === 'confirmed' ? (
                            <>
                              <span>
                                ¡Genial! Su consulta programada para el <strong>{formatDateFriendly(appt.date)} a las {appt.time}</strong> ha sido <span className="text-teal-450 font-extrabold font-display">Aprobada y Confirmada</span> por la Dra. Marisol Ojeda.
                              </span>
                              {!appt.isOnline ? (
                                <span className="bg-teal-950/40 p-1.5 rounded border border-teal-500/20 text-[11px] text-slate-200">
                                  📍 <strong>Consultorio Físico:</strong> CENTRO MÉDICO BOCONÓ, ESTADO TRUJILLO, VENEZUELA.
                                  <br />
                                  ⏱️ <strong>Nota de Atención:</strong> Recuerde presentarse temprano ya que será atendido por <strong>estricto orden de llegada</strong> en las instalaciones.
                                </span>
                              ) : (
                                <span className="bg-teal-950/40 p-1.5 rounded border border-teal-500/20 text-[11px] text-slate-200">
                                  📞 <strong>Teleconsulta Online:</strong> La Dra. le contactará de forma directa vía WhatsApp (<strong className="text-teal-400">{config.whatsappNumber}</strong>) a la hora fijada.
                                </span>
                              )}
                            </>
                          ) : appt.status === 'pending' ? (
                            <>
                              <span className="text-amber-400 font-semibold">
                                Estructurado como: Solicitud de Cita Pendiente.
                              </span>
                              <span>
                                Propuesta para el <strong>{formatDateFriendly(appt.date)} a las {appt.time}</strong>. No debe asistir al consultorio ni realizar transferencias todavía. Está en espera del análisis y confirmación de espacio por la Dra. Marisol Ojeda.
                              </span>
                            </>
                          ) : (
                            <span>Esta reserva para el {appt.date} ha sido cancelada o reprogramada por el especialista. Por favor inicie una nueva solicitud.</span>
                          )}
                        </p>

                        {/* WhatsApp online contact option if online consultation is accepted by physician */}
                        {appt.status === 'confirmed' && appt.isOnline && config.onlineConsultationEnabled && (
                          <a
                            href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola%20Dra.%20Marisol%20Ojeda,%20soy%20su%20paciente%20${encodeURIComponent(currentUser.name)}%20para%20mi%20consulta%20online%20programada.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-center w-full bg-[#25D366] hover:bg-[#128C7E] text-slate-900 font-bold py-1.5 px-3 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Iniciar Contacto WhatsApp Dra.
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PRECIO ACTUAL DE LA CONSULTA */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950/40 rounded-2xl p-5 border border-red-900/20 text-center space-y-1">
              <span className="text-slate-400 text-xs">Precio Regular de la Consulta</span>
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-red-400">
                ${config.consultationPrice} <span className="text-sm font-semibold text-red-500">USD</span>
              </div>
              <p className="text-[10px] text-slate-500">Cifras sujetas a modificación por el especialista</p>
            </div>
          </div>

          {/* COLUMNA CENTRAL Y DERECHA (LG:COL-SPAN-2): RESERVAR CITA CON DISPONIBILIDAD EN TIEMPO REAL */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-red-550" />
                <h3 className="text-lg font-bold text-slate-200">Reservar Cita Cardiológica</h3>
              </div>

              {/* CARTEL INFORMATIVO OBLIGATORIO DE UBICACIÓN Y ATENCIÓN */}
              <div className="bg-gradient-to-r from-red-950/45 via-slate-900/90 to-red-950/20 border border-red-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-[11px] text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
                      Condiciones del Servicio Médico
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                      <li>
                        <strong className="text-white">Ubicación Física:</strong> Consultorio ubicado exclusivamente en el <strong className="text-red-400 font-semibold">CENTRO MÉDICO BOCONÓ, ESTADO TRUJILLO, VENEZUELA</strong>.
                      </li>
                      <li>
                        <strong className="text-white">Orden de Llegada:</strong> La atención presencial en el consultorio se rige por <strong className="text-red-400 font-bold">estricto orden de llegada</strong> de los pacientes.
                      </li>
                      <li>
                        <strong className="text-white">Aprobación Médica Requerida:</strong> Cada reserva se inicia como <strong className="text-amber-450">lista de espera</strong>. El agendamiento solo será definitivo una vez que sea evaluado y <strong className="text-teal-400">confirmado de forma manual por la Dra. Marisol Ojeda</strong>.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {successMsg && (
                <div className="mb-6 bg-slate-905 border border-teal-500/20 p-5 rounded-2xl text-sm space-y-4 shadow-xl relative z-10">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-450 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-400 text-sm mb-1">¡Turno Solicitado Correctamente!</h4>
                      <p className="text-xs text-slate-350 leading-relaxed">{successMsg}</p>
                    </div>
                  </div>
                  
                  {pendingWhatsappUrl && (
                    <div className="pt-2">
                      <a
                        href={pendingWhatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-slate-950 hover:text-white font-extrabold rounded-xl py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-lg transition-all border border-[#25D366]/40 cursor-pointer animate-pulse"
                      >
                        <MessageSquare className="w-4 h-4 fill-current" />
                        👉 ENVIAR CONFIRMACIÓN DIRECTA POR WHATSAPP
                      </a>
                      <p className="text-[10px] text-center text-slate-500 mt-1.5">
                        Si WhatsApp no se abrió automáticamente, presione el botón de arriba para enviar los datos de su cita.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleBooking} className="space-y-5">
                
                {/* 1. SELECCIONAR FECHA */}
                <div className="space-y-2">
                  <label htmlFor="booking-date" className="block text-xs font-semibold text-slate-300">
                    1. Seleccione la fecha de su cita (Lunes a Viernes, cualquier mes y año):
                  </label>
                  <input
                    type="date"
                    id="booking-date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setPendingWhatsappUrl(''); // Clear previous WhatsApp link when date changes
                    }}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
                    required
                  />
                  {selectedDate && (
                    <p className="text-xs text-slate-400 font-medium">
                      Día seleccionado: <strong className="text-rose-400 text-capitalize">{selectedDay}</strong>
                    </p>
                  )}
                  {selectedDate && !config.workingHours[selectedDay]?.enabled && (
                    <p className="text-xs text-rose-400 font-medium bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30">
                      ⚠️ La Dra. Marisol Ojeda no ofrece consultas los días <strong>{selectedDay}</strong>. Por favor, modifique la fecha a un día de la semana laborable (Lunes a Viernes).
                    </p>
                  )}
                </div>

                {/* 2. CONFIGURAR LA HORA */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-300">
                    2. Seleccione su hora preferida (Sujeto a confirmación por estricto orden de llegada):
                  </span>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => {
                      setSelectedTime(e.target.value);
                      setPendingWhatsappUrl('');
                    }}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
                    required
                  />
                </div>

                {/* 3. MODALIDAD Y MOTIVO DE CONSULTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de consulta */}
                  <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-850 space-y-2.5">
                    <span className="block text-xs font-semibold text-slate-300">Modalidad de Consulta</span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOnline(false);
                          setPendingWhatsappUrl('');
                        }}
                        className={`flex-1 p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          !isOnline
                            ? 'bg-red-950/30 border-red-500/50 text-red-300 font-bold'
                            : 'bg-slate-900/60 border-slate-700/45 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Presencial
                      </button>

                      {config.onlineConsultationEnabled ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOnline(true);
                            setPendingWhatsappUrl('');
                          }}
                          className={`flex-1 p-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isOnline
                              ? 'bg-red-950/30 border-red-500/50 text-red-300 font-bold'
                              : 'bg-slate-900/60 border-slate-700/45 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          Online WhatsApp
                        </button>
                      ) : (
                        <div className="flex-1 p-2 rounded-lg text-xs font-medium border border-dashed border-slate-800 text-slate-600 flex items-center justify-center gap-1 bg-slate-950/20" title="La teleconsulta se encuentra inactiva por la Dra. Marisol Ojeda">
                          <Video className="w-3.5 h-3.5" />
                          Online (Desactivado)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Motivo de consulta */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Sintomatología / Motivo de Consulta</label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Chequeo post-operatorio, taquicardias, dolor en el tórax..."
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        setPendingWhatsappUrl('');
                      }}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    ></textarea>
                  </div>
                </div>

                {/* BOTÓN RESERVAR */}
                <button
                  type="submit"
                  disabled={!selectedDate || !selectedTime || !config.workingHours[selectedDay]?.enabled}
                  className={`w-full font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    !selectedDate || !selectedTime || !config.workingHours[selectedDay]?.enabled
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/20 active:scale-[0.99]'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-white" />
                  Agendar Cita Médica (${config.consultationPrice} USD)
                </button>
              </form>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
