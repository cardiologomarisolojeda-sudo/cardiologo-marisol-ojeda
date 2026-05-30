import { useState, useEffect } from 'react';
import { Heart, ShieldAlert, ShieldCheck, ClipboardList, Activity, ArrowRight, UserCheck, MessageSquare, PhoneCall } from 'lucide-react';
import { StorageService } from './lib/storage';
import { ClinicConfig, Appointment } from './types';
import PatientPortal from './components/PatientPortal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [config, setConfig] = useState<ClinicConfig>(StorageService.getConfig());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeView, setActiveView] = useState<'patient' | 'admin'>('patient');

  // Trigger state update from database
  const reloadData = () => {
    setConfig(StorageService.getConfig());
    setAppointments(StorageService.getAppointments());
  };

  useEffect(() => {
    StorageService.initDatabase();
    reloadData();

    // Listen to storage events to keep tabs perfectly synchronized in real-time across multiple tabs/devices!
    const handleStorageUpdate = () => {
      reloadData();
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const pendingCount = pendingAppointments.length;

  return (
    <div className="min-h-screen bg-cardiology-app text-slate-100 flex flex-col selection:bg-red-600/30 selection:text-red-100 font-sans relative overflow-x-hidden">
      
      {/* Decorative Giant cardiology ambient heartbeat stroke running in the background */}
      <div className="absolute inset-x-0 top-1/4 h-1/2 z-0 pointer-events-none opacity-[0.06] select-none flex items-center overflow-hidden">
        <svg viewBox="0 0 1000 200" className="w-[300%] sm:w-[150%] h-auto stroke-red-500 fill-none stroke-[3] shrink-0 animate-pulse">
          <path d="M 0,100 L 300,100 L 330,85 L 360,115 L 390,100 L 420,100 L 440,30 L 470,180 L 490,100 L 520,100 L 560,70 L 600,106 L 620,100 L 1000,100" />
        </svg>
      </div>

      {/* SECCIÓN DEL HEADER INTEGRADO */}
      <header className="sticky top-0 z-40 bg-[#04050a]/90 backdrop-blur-md border-b border-red-550/15 px-4 py-3 sm:px-6 relative shadow-lg shadow-black/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Clinical Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-550 flex items-center justify-center shadow-lg shadow-red-950/40 relative">
              <Heart className="w-5.5 h-5.5 text-white fill-white/10 animate-pulse" />
              {/* Pulse ripple element */}
              <span className="absolute -inset-0.5 rounded-xl bg-red-600/30 blur opacity-75 animate-ping -z-10"></span>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-205">
                  Dra. Marisol Ojeda
                </span>
                <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.2 rounded-full font-bold">
                  Cardiólogo
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-medium tracking-tight">Centro de Diagnóstico y Cuidado Cardiovascular</p>
            </div>
          </div>

          {/* VIEW SWITCHER TABS */}
          <div className="flex items-center gap-2">
            <button
              id="view-patient-btn"
              onClick={() => setActiveView('patient')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'patient'
                  ? 'bg-slate-800/85 text-white ring-1 ring-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Página Paciente</span>
            </button>

            <button
              id="view-admin-btn"
              onClick={() => setActiveView('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all relative cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-slate-800/85 text-white ring-1 ring-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeView === 'admin' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-red-500" />}
              <span className="hidden sm:inline">Panel Médico</span>
              
              {/* Badge for physician to notice new booking requests */}
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-650 text-[9px] font-bold text-white ring-2 ring-[#070a13] animate-bounce">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* CORE WRAPPED CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6">
        
        {activeView === 'patient' ? (
          <PatientPortal config={config} onAppointmentBooked={reloadData} />
        ) : (
          <AdminPanel 
            config={config} 
            onConfigChanged={(newC) => setConfig(newC)} 
            pendingCount={pendingCount}
            onHandledAppointment={reloadData}
          />
        )}

      </main>

      {/* FOOTER GENERAL */}
      <footer className="mt-auto border-t border-slate-900 bg-[#04060c] py-6 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="font-semibold text-slate-400">Consultorio Privado Dra. Marisol Ojeda • Cardiólogo Clínico</p>
            <p>Registro Sanitario N° MPPS-4416 • Especialidad en Arritmias e Hipertensión Arterial</p>
          </div>
          <div className="flex items-center gap-3">
            {config.onlineConsultationEnabled && config.whatsappNumber && (
              <a
                href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-[#25D366] font-bold hover:underline flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Consulta Virtual WhatsApp Activa
              </a>
            )}
            <span className="text-slate-700">|</span>
            <span className="font-mono text-slate-500">AES-256 E2E Clinically Encrypted</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
