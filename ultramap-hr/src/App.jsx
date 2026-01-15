import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { Calendar, DollarSign, FileText, CheckCircle, XCircle, Menu, X, Send, Printer, ChevronLeft, ChevronRight, Eye, EyeOff, Edit2, Save, Bell, AlertCircle, Trash2, Settings, RefreshCcw, Lock, ArrowRight, User, Info, Download, Users, Database, LogOut, Key, History, FolderOpen, Folder, ShieldCheck, MapPin, Sparkles, Loader2 } from 'lucide-react';

// --- 1. CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyD_1BO0kY9CpzselHNIG-NiuNbqitaywE8", 
  authDomain: "ultramap-hr.firebaseapp.com",
  projectId: "ultramap-hr",
  storageBucket: "ultramap-hr.appspot.com",
  messagingSenderId: "409015904834",
  appId: "1:409015904834:web:8f4a7b59f6cc86585c9bdb",
  measurementId: "G-40VRCBXNL8"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATA AWAL (SEED) ---
const SEED_USERS = [
  { email: 'hafiz@ultramap.com', name: 'Mohd Hafiz Bin Mohd Tahir', nickname: 'Hafiz', role: 'super_admin', position: 'SUPER ADMIN', ic: '900405-01-5651', baseSalary: 5000, fixedAllowance: 500, customEpf: 550, customSocso: 19.25, leaveBalance: 20 },
  { email: 'admin.ultramap@gmail.com', name: 'Admin Ultramap', nickname: 'Admin Main', role: 'super_admin', position: 'SUPER ADMIN', ic: 'ADMIN-001', baseSalary: 5000, fixedAllowance: 500, customEpf: 550, customSocso: 19.25, leaveBalance: 20 },
  { email: 'syazwan@ultramap.com', name: 'Ahmad Syazwan Bin Zahari', nickname: 'Syazwan', role: 'manager', position: 'PROJECT MANAGER', ic: '920426-03-6249', baseSalary: 4000, fixedAllowance: 300, customEpf: 440, customSocso: 19.25, leaveBalance: 18 },
  { email: 'noorizwan@ultramap.com', name: 'Mohd Noorizwan Bin Md Yim', nickname: 'Noorizwan', role: 'staff', position: 'OPERATION', ic: '880112-23-5807', baseSalary: 2300, fixedAllowance: 200, customEpf: null, customSocso: null, leaveBalance: 14 },
  { email: 'taufiq@ultramap.com', name: 'Muhammad Taufiq Bin Rosli', nickname: 'Taufiq', role: 'staff', position: 'OPERATION', ic: '990807-01-6157', baseSalary: 1800, fixedAllowance: 150, customEpf: null, customSocso: null, leaveBalance: 12 },
];

const JOHOR_HOLIDAYS = [
  { date: '2025-07-07', name: 'Awal Muharram' }, 
  { date: '2025-07-27', name: 'Hol Almarhum Sultan Iskandar' }, 
  { date: '2025-07-28', name: 'Cuti Ganti (Hol Johor)' }, 
  { date: '2025-08-31', name: 'Hari Kebangsaan' },
  { date: '2025-12-25', name: 'Hari Krismas' },
  { date: '2026-01-01', name: 'Tahun Baru 2026' },
  { date: '2026-02-01', name: 'Hari Thaipusam' },
  { date: '2026-02-17', name: 'Tahun Baru Cina' },

// --- HELPER FUNCTIONS ---
const calculateLeaveDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  let count = 0;
  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const isSunday = current.getDay() === 0;
    const isPublicHoliday = JOHOR_HOLIDAYS.some(h => h.date === dateStr);
    
    if (!isSunday && !isPublicHoliday) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// --- HELPER COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const styles = { 
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-200", 
    Rejected: "bg-red-100 text-red-800 border-red-200", 
    Draft: "bg-gray-100 text-gray-500 border-gray-200", 
    Submitted: "bg-blue-100 text-blue-800 border-blue-200" 
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.Pending}`}>{status}</span>;
};

const UltramapLogo = () => (
  <svg viewBox="0 0 350 80" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
    <line x1="40" y1="10" x2="40" y2="70" stroke="black" strokeWidth="1" />
    <line x1="10" y1="40" x2="70" y2="40" stroke="black" strokeWidth="1" />
    <circle cx="40" cy="40" r="25" fill="none" stroke="black" strokeWidth="2" />
    <circle cx="40" cy="40" r="18" fill="none" stroke="blue" strokeWidth="1" />
    <text x="40" y="55" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill="#DC2626" textAnchor="middle">U</text>
    <text x="75" y="55" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill="#DC2626">LTRA</text>
    <text x="205" y="55" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill="black">MAP</text>
    <text x="205" y="75" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="black" letterSpacing="2">SOLUTION</text>
    <text x="345" y="75" fontFamily="Arial, sans-serif" fontSize="10" fill="#666" textAnchor="end">JM0876813-V</text>
  </svg>
);

// --- COMPONENT: PAYSLIP DESIGN ---
const PayslipDesign = ({ data, user }) => {
  const totalEarnings = data.basicSalary + data.allowance + data.mealAllowance + (data.otAllowance || 0) + (data.bonus || 0);
  const totalDeductions = data.epf + data.socso;
  const netPay = totalEarnings - totalDeductions;

  return (
    <div className="bg-slate-200 p-4 lg:p-8 flex justify-center overflow-auto min-h-screen print:bg-white print:p-0 print:m-0 print:overflow-hidden">
      <style>{`@media print { @page { size: A4 landscape; margin: 0; } body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; } }`}</style>
      <div className="bg-white shadow-2xl p-12 w-[297mm] h-[210mm] text-black relative print:shadow-none print:w-[297mm] print:h-[210mm] print:absolute print:top-0 print:left-0 print:scale-[0.96] print:origin-top-left flex flex-col box-border overflow-hidden font-sans">
        <div className="flex-grow pb-[70mm]">
            <div className="flex justify-between items-end mb-8 border-b-2 border-slate-800 pb-4">
              <div><UltramapLogo /></div> 
              <div className="text-right">
                <p className="font-bold uppercase text-[10px] mb-1 text-slate-500 tracking-widest">Private & Confidential</p>
                <h2 className="text-xl font-bold text-slate-800 tracking-wide uppercase">ULTRAMAP SOLUTION</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Penyata Gaji Bulanan</p>
              </div>
            </div>
            <div className="flex justify-between mb-8 border-b border-slate-300 pb-6 gap-10">
                <div className="space-y-3 w-1/2">
                    <div className="flex items-center text-sm font-sans"><span className="text-slate-500 w-32 font-normal uppercase">Name</span><span className="uppercase font-bold truncate">: {user.name}</span></div>
                    <div className="flex items-center text-sm font-sans"><span className="text-slate-500 w-32 font-normal uppercase">I/C No</span><span className="font-bold">: {user.ic}</span></div>
                </div>
                <div className="space-y-3 w-1/2 pl-8 border-l border-dashed border-slate-200 font-sans">
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-normal tracking-tight uppercase">Job Title</span><span className="uppercase font-bold">: {user.position}</span></div>
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-normal tracking-tight uppercase">Payslip For</span><span className="uppercase font-bold">: {data.month}</span></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-16 mb-4 h-[250px] font-sans">
              <div className="flex flex-col justify-between">
                <div>
                    <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase tracking-wider text-sm text-slate-700 tracking-widest font-black">Earnings (RM)</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>BASIC SALARY</span><span className="font-semibold">{data.basicSalary.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>ALLOWANCE</span><span className="font-semibold">{data.allowance.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>MEAL ALLOWANCE</span><span className="font-semibold">{data.mealAllowance.toFixed(2)}</span></div>
                      <div className="flex justify-between text-slate-400 italic"><span>OT ALLOWANCE</span><span className="font-semibold">{(data.otAllowance || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between text-slate-400 italic"><span>BONUS</span><span className="font-semibold">{(data.bonus || 0).toFixed(2)}</span></div>
                    </div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-base mt-4 font-sans text-slate-900 uppercase font-black tracking-widest"><span>TOTAL EARNINGS</span><span>{totalEarnings.toFixed(2)}</span></div>
              </div>
              <div className="flex flex-col justify-between pl-8 border-l border-dashed border-slate-200">
                <div>
                  <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase tracking-wider text-sm text-slate-700 uppercase tracking-widest font-black">Deduction (RM)</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>EPF (KWSP)</span><span className="text-red-600 font-semibold">{data.epf.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>SOCSO (PERKESO)</span><span className="text-red-600 font-semibold">{data.socso.toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-base mt-auto text-slate-600 font-sans uppercase font-black tracking-widest"><span>TOTAL DEDUCTION</span><span>{totalDeductions.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-slate-100 border-y-4 border-slate-800 py-6 px-8 flex justify-between items-center mt-4 shadow-sm font-sans">
              <span className="font-black text-xl uppercase tracking-widest text-slate-700 tracking-tight font-black">NET PAY (GAJI BERSIH)</span>
              <span className="font-black text-3xl text-slate-900 tracking-tight font-black">RM {netPay.toFixed(2)}</span>
            </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center px-12 pointer-events-none font-sans">
            <div className="border-t border-slate-200 pt-3">
                <p className="text-[10px] text-slate-400 leading-tight italic uppercase tracking-widest">This monthly salary slip is electronically generated and does not require any signature.</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">ULTRAMAP SOLUTION (JM0876813-V)</p>
            </div>
        </div>
        <div className="absolute top-4 right-4 print:hidden"><button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 shadow-blue-200 uppercase font-sans text-xs tracking-widest font-black font-black"><Printer size={20} /> Cetak / Simpan PDF</button></div>
      </div>
    </div>
  );
};

// --- COMPONENT: TIMESHEET WIDGET ---
const TimesheetWidget = ({ targetUserId, currentDate, customSubmissionDate, attendance, setAttendance, tsStatus, updateTimesheetStatus, isAdminView }) => {
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [tempRemark, setTempRemark] = useState("");

  const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + swipeIndex, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();
  const getMonthStr = (d) => d.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
  
  const handleToggle = (day) => {
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (JOHOR_HOLIDAYS.some(h => h.date === dateStr)) return;

    const isCurrentMonthView = swipeIndex === 0;
    const entry = attendance.find(a => a.date === dateStr && a.userId === targetUserId);

    if (isAdminView || !isCurrentMonthView) {
        if (entry) {
            setSelectedDayInfo({ day, dateStr, existingRemark: entry.remark });
            setTempRemark(entry.remark || "");
            setIsRemarkModalOpen(true);
        } else if (!isAdminView) {
            alert("Anda hanya boleh mengemaskini timesheet untuk bulan semasa.");
        }
        return; 
    }

    const isPastCutoff = customSubmissionDate !== null && currentDate.getDate() >= customSubmissionDate;
    if (isPastCutoff && day <= customSubmissionDate) return;
    if (tsStatus.status === 'Submitted' || tsStatus.status === 'Approved') return;
    
    if (entry) {
        setSelectedDayInfo({ day, dateStr, existingRemark: entry.remark });
        setTempRemark(entry.remark || "");
        setIsRemarkModalOpen(true);
    } else {
        const clickedDate = new Date(displayYear, displayMonth, day);
        if (clickedDate.getDay() === 0) { 
            if (!window.confirm("Hari ini Ahad. Confirm kerja Site?")) return;
        }
        setSelectedDayInfo({ day, dateStr });
        setTempRemark("");
        setIsRemarkModalOpen(true);
    }
  };

  const handleSaveRemark = () => {
      setAttendance(selectedDayInfo.dateStr, targetUserId, 'site', false, tempRemark);
      setIsRemarkModalOpen(false);
      setSelectedDayInfo(null);
  };

  const handleDeleteEntry = () => {
      if (window.confirm("Padam kehadiran site untuk tarikh ini?")) {
          setAttendance(selectedDayInfo.dateStr, targetUserId, 'site', true);
          setIsRemarkModalOpen(false);
          setSelectedDayInfo(null);
      }
  };

  const lastDayOfMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const dayArray = Array.from({ length: lastDayOfMonth }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
  const emptySlots = Array.from({ length: firstDayOfMonth });
  const displayCount = attendance.filter(a => {
      const d = new Date(a.date);
      return a.userId === targetUserId && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
  }).length;

  const effectiveOpenDate = customSubmissionDate ? customSubmissionDate : lastDayOfMonth;
  const isSubmissionOpen = currentDate.getDate() >= effectiveOpenDate || currentDate.getDate() >= 28;
  const showSubmitBtn = !isAdminView && (tsStatus.status === 'Draft' || tsStatus.status === 'Rejected');

  return (
    <Card className="p-6 relative shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-lg flex items-center gap-2 text-slate-700 uppercase tracking-widest"><Calendar size={20} /> Timesheet</h3>
          <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
              <button onClick={() => setSwipeIndex(prev => Math.max(-6, prev - 1))} className={`p-1.5 rounded-full transition-all ${swipeIndex > -6 ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><ChevronLeft size={16} /></button>
              <span className="text-[10px] font-black px-3 text-slate-600 uppercase min-w-[80px] text-center font-sans font-black">{getMonthStr(displayDate)}</span>
              <button onClick={() => setSwipeIndex(prev => Math.min(1, prev + 1))} className={`p-1.5 rounded-full transition-all ${swipeIndex < 1 ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><ChevronRight size={16} /></button>
          </div>
      </div>
      {tsStatus.approvedBy && (<div className="mb-2 flex justify-end"><span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded flex items-center gap-1 font-sans uppercase tracking-widest font-black font-black"><ShieldCheck size={10} /> Disahkan: {tsStatus.approvedBy}</span></div>)}
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-1 tracking-tighter uppercase mb-2 font-black text-slate-400 text-[10px]">
            {['A','I','S','R','K','J','S'].map((d, i) => (<div key={`head-${d}-${i}`} className="text-center">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1 font-bold">
            {emptySlots.map((_, i) => <div key={`empty-${i}`}></div>)}
            {dayArray.map(day => {
                const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const entry = attendance.find(a => a.date === dateStr && a.userId === targetUserId && a.type === 'site');
                const isSite = !!entry;
                const isHoliday = JOHOR_HOLIDAYS.some(h => h.date === dateStr);
                const isSunday = new Date(displayYear, displayMonth, day).getDay() === 0;
                
                let isVisualLock = (swipeIndex === 0 && isPastCutoff && day <= customSubmissionDate) || (!isAdminView && (tsStatus.status === 'Submitted' || tsStatus.status === 'Approved'));
                const isHistoryView = swipeIndex < 0;
                
                let btnClass = isHoliday ? "bg-orange-100 text-orange-600 border-orange-200 cursor-not-allowed font-bold" : isSite ? (isVisualLock ? "bg-slate-400 text-white border-slate-500 font-black font-black" : "bg-emerald-500 text-white shadow-md border-emerald-600 font-black font-black") : isSunday ? "bg-slate-200 text-slate-400 border-slate-300" : (isVisualLock || (isHistoryView && !isAdminView)) ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-300" : "bg-white text-slate-500 border-slate-100 hover:border-blue-300";
                
                return <button key={`day-cell-${displayYear}-${displayMonth}-${day}`} onClick={() => handleToggle(day)} disabled={isHoliday || (isVisualLock && !isSite && !isAdminView) || (isHistoryView && !isSite && !isAdminView)} className={`aspect-square rounded flex flex-col items-center justify-center border text-xs relative transition-all ${btnClass}`} title={entry?.remark || ""}>
                    <span className="font-bold">{day}</span>
                    {isSite && !isVisualLock && !isHoliday && !isHistoryView && <span className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full"></span>}
                    {(isVisualLock || isHistoryView) && isSite && <span className="absolute top-0.5 right-0.5 font-bold"><Lock size={8} /></span>}
                    {isSite && entry?.remark && <span className="absolute bottom-0.5 right-0.5"><MapPin size={8} className="text-white/80" /></span>}
                </button>;
            })}
        </div>
      </div>
      <div className="mt-auto flex justify-between items-center border-t pt-4">
        <div><p className="text-xs text-slate-500 uppercase font-black tracking-widest tracking-tighter">Total Hari Site</p><p className="text-xl font-black text-emerald-600 uppercase">{displayCount} Hari</p></div>
        {showSubmitBtn && swipeIndex === 0 && (
            <button onClick={() => updateTimesheetStatus(targetUserId, 'Submitted')} className="px-4 py-2 rounded font-black text-xs bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest font-sans font-black font-black">Hantar untuk Semakan</button>
        )}
      </div>
      {isRemarkModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans font-black">
              <Card className="w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
                  <div className="flex justify-between items-start mb-4">
                      <div><h4 className="font-black text-slate-800 text-lg uppercase font-sans tracking-tight font-black font-black">Nota Kehadiran</h4><p className="text-xs text-slate-500 font-sans tracking-widest uppercase font-bold">{selectedDayInfo?.day}hb {getMonthStr(displayDate)}</p></div>
                      <button onClick={() => setIsRemarkModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-all font-black"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 font-black">Lokasi / Kerja Site</label><textarea className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all font-bold font-black" rows="3" placeholder="Isi lokasi kerja di sini..." value={tempRemark} onChange={(e) => setTempRemark(e.target.value)} readOnly={isAdminView || swipeIndex !== 0} /></div>
                      {!isAdminView && swipeIndex === 0 ? (
                          <div className="flex gap-2">
                             {selectedDayInfo?.existingRemark !== undefined && (<button onClick={handleDeleteEntry} className="flex-none p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all shadow-sm font-black font-black font-black"><Trash2 size={20}/></button>)}
                             <button onClick={handleSaveRemark} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest font-black font-black"><Save size={18}/> Simpan</button>
                          </div>
                      ) : <p className="text-[10px] text-slate-400 italic text-center font-black uppercase tracking-widest border-t pt-2 font-black font-black">Paparan semakan sahaja</p>}
                  </div>
              </Card>
          </div>
      )}
    </Card>
  );
};

// --- COMPONENT: LEAVE HISTORY VIEWER (ADMIN) ---
const LeaveHistoryViewer = ({ users, leaves }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    return (
        <Card className="mt-4 p-4 bg-slate-50 border border-slate-200 font-sans font-black font-black">
            <h4 className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2 tracking-widest font-black font-black font-black"><History size={14}/> Sejarah Cuti Semua Staff</h4>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 font-black">
                {users.map(u => (
                    <button key={`user-btn-${u.id}`} onClick={() => setSelectedUser(u.id === selectedUser ? null : u.id)} className={`px-3 py-1 rounded text-[10px] font-black whitespace-nowrap transition-all uppercase font-sans font-bold ${selectedUser === u.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:border-blue-400'}`}>{u.nickname}</button>
                ))}
            </div>
            {selectedUser && (
                <div className="space-y-2 max-h-40 overflow-y-auto font-black font-sans font-black font-black font-black">
                    {leaves.filter(l => l.userId === selectedUser).map((l, idx) => (
                        <div key={`hist-${selectedUser}-${idx}`} className="flex justify-between items-center text-sm border-b pb-1 bg-white p-2 rounded shadow-sm font-sans font-black font-black font-black">
                            <div><span className="font-black block tracking-tight font-black">{l.startDate} - {l.endDate}</span><span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter font-black font-black font-black font-black font-black">{l.reason} ({l.days} Hari)</span></div>
                            <Badge status={l.status} />
                        </div>
                    ))}
                    {leaves.filter(l => l.userId === selectedUser).length === 0 && <p className="text-xs text-slate-400 text-center py-2 italic uppercase font-black tracking-widest font-black font-black font-black">Tiada rekod cuti.</p>}
                </div>
            )}
        </Card>
    );
};

// --- COMPONENT: PAYSLIP ARCHIVE FOLDER ---
const PayslipFolderSystem = ({ currentUser, calculatePayroll, setViewedPayslip, timesheetStatus, currentDate }) => {
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear()); 

    const getAvailableMonths = (year) => {
        const months = [];
        const today = new Date();
        const currentMonth = today.getMonth(); 
        if (year === 2025) {
            months.push(new Date(2025, 11, 1)); 
        } else {
            for (let i = 0; i <= currentMonth; i++) {
                const d = new Date(year, i, 1);
                if (d > today) break;
                if (currentUser.role === 'staff' && year === today.getFullYear()) {
                   if (i === currentMonth && timesheetStatus.status !== 'Approved') continue;
                }
                months.push(d);
            }
        }
        return months;
    };
    const availableMonths = getAvailableMonths(selectedYear);
    return (
        <div className="mt-8 pt-8 border-t no-print font-sans uppercase tracking-widest font-black font-black font-black">
            <h3 className="font-black text-lg text-slate-700 mb-4 flex items-center gap-2 font-sans uppercase tracking-tight tracking-wider text-sm uppercase tracking-widest font-black font-black font-black"><FileText size={20}/> Arkib Slip Gaji</h3>
            <div className="flex gap-4 mb-4 font-black">
                {[2025, 2026].map(year => (
                    <button key={`year-btn-${year}`} onClick={() => setSelectedYear(year)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-all font-sans font-black ${selectedYear === year ? 'border-blue-600 text-blue-600 bg-blue-50 font-bold shadow-sm font-black' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                        {selectedYear === year ? <FolderOpen size={18}/> : <Folder size={18}/>}<span className="font-bold font-black">{year}</span>
                    </button>
                ))}
            </div>
            <div className="bg-slate-50 p-4 rounded-b-lg rounded-tr-lg border border-slate-200 min-h-[100px] font-black font-sans font-black font-black">
                {availableMonths.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-black">
                        {availableMonths.map((date, idx) => (
                            <button key={`month-btn-${idx}`} onClick={() => setViewedPayslip({ data: calculatePayroll(currentUser.id, date), user: currentUser })} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group shadow-sm font-black font-black font-black font-black font-black">
                                <div className="flex items-center gap-2 font-black font-black font-black">
                                    <FileText size={16} className="text-red-500 font-black font-black font-black font-black"/>
                                    <span className="text-[11px] font-black text-slate-700 group-hover:text-blue-600 uppercase font-sans tracking-widest font-black font-black font-black font-black">
                                        {date.toLocaleDateString('ms-MY', { month: 'short' })}
                                    </span>
                                </div>
                                <Download size={14} className="text-slate-300 group-hover:text-blue-500 font-black font-black font-black font-black font-black font-black"/>
                            </button>
                        ))}
                    </div>
                ) : <div className="text-center text-slate-400 py-4 text-xs italic font-black uppercase tracking-widest font-black font-black font-black font-black font-black font-black">Tiada rekod tersedia.</div>}
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timesheets, setTimesheets] = useState([]); 
  const [settings, setSettings] = useState({ customSubmissionDate: null });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [viewedPayslip, setViewedPayslip] = useState(null);
  const [currentDate] = useState(new Date()); 
  const [hideSalary, setHideSalary] = useState(false);
  const [showAdminTimesheet, setShowAdminTimesheet] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordData, setNewPasswordData] = useState({ new: '', confirm: '' });
  const [notification, setNotification] = useState(null);
  const [tempLeave, setTempLeave] = useState({ start: '', end: '', reason: '' });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, "users"), where("email", "==", user.email));
        onSnapshot(q, (snapshot) => { 
          if (!snapshot.empty) {
            setCurrentUser({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id }); 
          } else {
            setNotification({ type: 'error', message: "Profil pengguna tidak dijumpai." });
            signOut(auth);
          }
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "attendance"), (s) => setAttendance(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "leaves"), (s) => setLeaves(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "timesheets"), (s) => setTimesheets(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(doc(db, "settings", "global"), (s) => { if(s.exists()) setSettings(s.data()); });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { alert("Gagal Log Masuk!"); } };
  const handleLogout = () => signOut(auth);

  const toggleAttendanceDB = async (dateStr, userId, type, shouldDelete, remark = "") => {
      const existing = attendance.find(a => a.date === dateStr && a.userId === userId);
      if (shouldDelete && existing) { await deleteDoc(doc(db, "attendance", existing.id)); } 
      else if (existing) { await updateDoc(doc(db, "attendance", existing.id), { remark }); } 
      else { await addDoc(collection(db, "attendance"), { date: dateStr, userId, type, remark }); }
  };
  
  const approveLeaveDB = async (id, status) => { await updateDoc(doc(db, "leaves", id), { status, approvedBy: currentUser.nickname }); };
  const updateSettingsDB = async (val) => { await updateDoc(doc(db, "settings", "global"), { customSubmissionDate: val }); };
  const updateUserDB = async (u) => { await updateDoc(doc(db, "users", u.id), { baseSalary: u.baseSalary, fixedAllowance: u.fixedAllowance, customEpf: u.customEpf, customSocso: u.customSocso, leaveBalance: u.leaveBalance }); setEditingUser(null); alert("Berjaya!"); };
  
  const updateTimesheetStatusDB = async (userId, status) => {
      const today = new Date();
      const targetMonthDate = today.getDate() <= 5 ? new Date(today.getFullYear(), today.getMonth() - 1, 1) : today;
      const monthStr = targetMonthDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
      const existing = timesheets.find(t => t.userId === userId && t.month === monthStr);
      if (existing) { await updateDoc(doc(db, "timesheets", existing.id), { status, approvedBy: status === 'Approved' ? currentUser.nickname : null }); } 
      else { await addDoc(collection(db, "timesheets"), { userId, month: monthStr, status, approvedBy: status === 'Approved' ? currentUser.nickname : null }); }
  };

  const calculatePayroll = (userId, forMonthDate = currentDate) => {
    const user = users.find(u => u.id === userId);
    if (!user) return {};
    const monthStr = forMonthDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
    const epf = (user.customEpf !== null && user.customEpf !== undefined) ? user.customEpf : (user.baseSalary * 0.11);
    const socso = (user.customSocso !== null && user.customSocso !== undefined) ? user.customSocso : (user.baseSalary * 0.005 + 5);
    if (user.role !== 'staff') return { month: monthStr, basicSalary: user.baseSalary, allowance: user.fixedAllowance, mealAllowance: 0, rolloverNote: "Fixed Salary", otAllowance: 0, bonus: 0, epf, socso, netPay: (user.baseSalary + user.fixedAllowance - epf - socso) };
    const siteDays = attendance.filter(a => {
        const d = new Date(a.date);
        return a.userId === userId && d.getMonth() === forMonthDate.getMonth() && d.getFullYear() === forMonthDate.getFullYear();
    }).length;
    const meal = siteDays * 15;
    return { month: monthStr, basicSalary: user.baseSalary, allowance: user.fixedAllowance, mealAllowance: meal, otAllowance: 0, bonus: 0, epf, socso, netPay: (user.baseSalary + user.fixedAllowance + meal - epf - socso) };
  };

  const getRemainingLeave = (userId) => {
      const user = users.find(u => u.id === userId);
      if (!user) return 0;
      const approvedDays = leaves.filter(l => l.userId === userId && l.status === 'Approved').reduce((acc, curr) => acc + (curr.days || 0), 0);
      return (user.leaveBalance || 14) - approvedDays;
  };

  const getTimesheetStatusFromDB = (userId, targetDate = currentDate) => {
      const monthStr = targetDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
      return timesheets.find(t => t.userId === userId && t.month === monthStr) || { userId, month: monthStr, status: 'Draft' };
  };

  const handleSeedData = async () => {
    if (!confirm("Setup database asal?")) return;
    await setDoc(doc(db, "settings", "global"), { customSubmissionDate: 20 });
    for (const u of SEED_USERS) { 
        const q = query(collection(db, "users"), where("email", "==", u.email));
        const s = await getDocs(q);
        if (s.empty) await addDoc(collection(db, "users"), u); 
    }
    alert("Database seeded!");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if(newPasswordData.new !== newPasswordData.confirm) return alert("Password tidak sama!");
    try { await updatePassword(auth.currentUser, newPasswordData.new); alert("Berjaya! Login semula."); setShowPasswordModal(false); handleLogout(); } catch(err) { alert("Gagal: " + err.message); }
  };

  if (!currentUser) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans"><Card className="w-full max-w-sm p-8 bg-white shadow-2xl"><div className="flex justify-center mb-6"><UltramapLogo /></div><h2 className="text-center font-bold text-slate-800 mb-6 tracking-tight uppercase tracking-widest font-sans uppercase">Log Masuk HR System</h2><form onSubmit={handleLogin} className="space-y-4 font-sans"><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest font-sans uppercase">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-sans" required /></div><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest font-sans uppercase">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-sans" required /></div><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold transition-all hover:bg-blue-700 shadow-md uppercase tracking-widest text-sm uppercase">Masuk</button></form><div className="mt-8 text-center"><button onClick={handleSeedData} className="text-xs text-slate-400 underline uppercase tracking-widest font-sans uppercase">Setup Database</button></div></Card></div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
        <nav className="bg-white border-b sticky top-0 z-20 px-4 h-16 flex items-center justify-between shadow-sm print:hidden">
            <div className="flex items-center gap-3"><UltramapLogo /></div>
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold hidden md:block uppercase text-slate-500 font-sans tracking-widest uppercase tracking-widest">{currentUser.nickname}</span>
                <button onClick={() => setShowPasswordModal(true)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"><Settings size={16}/></button>
                <button onClick={handleLogout} className="text-xs bg-slate-200 px-3 py-1 rounded font-bold hover:bg-slate-300 transition-colors shadow-sm uppercase font-sans tracking-widest uppercase tracking-widest">Keluar</button>
            </div>
        </nav>
        <main className="max-w-7xl mx-auto p-4 lg:p-8">
            {viewedPayslip ? (
                <div><button onClick={() => setViewedPayslip(null)} className="mb-4 flex items-center gap-2 text-slate-500 print:hidden hover:text-slate-800 transition-colors font-bold uppercase tracking-widest text-xs font-sans uppercase tracking-widest"><ChevronLeft size={16} /> Kembali</button><PayslipDesign data={viewedPayslip.data} user={viewedPayslip.user} /></div>
            ) : (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-sans uppercase tracking-widest border-b-2 border-blue-600 inline-block uppercase tracking-wider">Hi! {currentUser.nickname}!</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 rounded-xl p-5 text-white shadow-lg relative">
                            <div className="flex justify-between items-start font-sans uppercase"><p className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-sans tracking-widest">Anggaran Gaji</p><button onClick={() => setHideSalary(!hideSalary)} className="text-slate-400 hover:text-white transition-colors">{hideSalary ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
                            <h2 className="text-2xl lg:text-3xl font-bold mt-1 font-sans tracking-tight">{hideSalary ? 'RM ****' : `RM ${calculatePayroll(currentUser.id).netPay?.toFixed(2)}`}</h2>
                            <button onClick={() => setViewedPayslip({ data: calculatePayroll(currentUser.id), user: currentUser })} className="bg-white/20 hover:bg-white/30 text-white py-1 px-3 rounded text-[10px] font-bold flex items-center gap-2 w-fit mt-2 shadow-sm uppercase font-sans tracking-widest uppercase tracking-widest"><Download size={12}/> Slip Gaji</button>
                        </div>
                        <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-center"><p className="text-slate-500 text-xs mb-1 uppercase tracking-widest font-sans tracking-widest uppercase tracking-widest uppercase">Baki Cuti</p><h2 className="text-3xl font-bold text-slate-800 font-sans tracking-tight uppercase tracking-wider">{getRemainingLeave(currentUser.id)} Hari</h2></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {(currentUser.role !== 'staff') ? (
                                <>
                                    <Card className="p-6 border-l-4 border-l-blue-600 shadow-sm"><h3 className="font-bold text-lg mb-4 flex items-center gap-2 font-sans tracking-tight uppercase text-slate-700 tracking-widest text-sm uppercase tracking-widest uppercase"><Settings size={20} className="text-slate-400"/> Tetapan Cutoff</h3><input type="number" value={settings.customSubmissionDate || ''} onChange={(e) => updateSettingsDB(e.target.value ? Number(e.target.value) : null)} className="w-20 border rounded p-1 font-bold text-lg text-center focus:ring-2 focus:ring-blue-400 outline-none font-sans" /></Card>
                                    <Card className="p-6 shadow-sm"><h3 className="font-bold text-lg mb-4 flex items-center gap-2 font-sans tracking-tight uppercase text-slate-700 tracking-widest text-sm uppercase tracking-widest uppercase"><Edit2 size={20}/> Tetapan Gaji & Cuti</h3><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-sans uppercase"><tr><th className="p-2 text-[10px] uppercase tracking-widest">Nama</th><th className="p-2 text-[10px] uppercase tracking-widest">Basic</th><th className="p-2 text-[10px] uppercase tracking-widest text-center uppercase tracking-widest">Cuti</th><th className="p-2 text-[10px] uppercase tracking-widest uppercase tracking-widest">Edit</th></tr></thead><tbody>{users.map(u => (<tr key={`u-row-${u.id}`} className="border-b font-sans hover:bg-slate-50 transition-colors font-sans uppercase tracking-widest"><td className="p-2 font-bold font-sans uppercase tracking-widest">{u.nickname}</td><td className="p-2 font-sans uppercase tracking-widest">{u.baseSalary.toFixed(2)}</td><td className="p-2 text-center font-sans uppercase tracking-widest">{u.leaveBalance}</td><td><button onClick={() => setEditingUser(u)} className="text-blue-600 underline font-bold uppercase text-[10px] tracking-widest font-sans uppercase tracking-widest">Edit</button></td></tr>))}</tbody></table></Card>
                                </>
                            ) : (
                                <TimesheetWidget targetUserId={currentUser.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={toggleAttendanceDB} tsStatus={getTimesheetStatusFromDB(currentUser.id)} updateTimesheetStatus={updateTimesheetStatusDB} isAdminView={false} />
                            )}
                            <Card className="p-6 shadow-sm"><h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 font-sans uppercase tracking-tight tracking-wider text-sm uppercase tracking-widest font-sans tracking-widest uppercase tracking-widest uppercase"><Send size={18} /> Permohonan Cuti</h3><form onSubmit={(e)=>{e.preventDefault(); const f=e.target; addDoc(collection(db,'leaves'),{userId:currentUser.id,startDate:f.s.value,endDate:f.e.value,reason:f.r.value,status:'Pending',days:calculateLeaveDuration(f.s.value, f.e.value)}); f.reset(); alert("Dihantar!");}} className="space-y-3 font-sans uppercase tracking-widest"><div className="grid grid-cols-2 gap-2"><input name="s" type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none font-sans text-xs uppercase tracking-widest" required/><input name="e" type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none font-sans text-xs uppercase tracking-widest" required/></div><input name="r" placeholder="Tujuan" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none font-sans text-sm uppercase tracking-widest" required/><button className="bg-slate-800 text-white w-full py-3 rounded font-bold shadow transition-colors hover:bg-slate-900 uppercase text-xs tracking-widest font-sans uppercase tracking-widest uppercase tracking-widest">Hantar Permohonan</button></form></Card>
                        </div>
                        <div className="space-y-6">
                            {(currentUser.role !== 'staff') && (
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700 mb-4 uppercase tracking-tighter font-sans uppercase tracking-wider text-sm tracking-widest uppercase tracking-widest uppercase tracking-widest font-sans">Panel Timesheet Staff</h3>
                                    <div className="space-y-4">
                                        {users.filter(u => u.role === 'staff').map(staff => (<Card key={`staff-card-${staff.id}`} className="p-4 shadow-sm hover:shadow-md transition-shadow font-sans uppercase tracking-widest"><div className="flex justify-between items-center mb-2"><span className="font-bold font-sans text-slate-700 tracking-tight uppercase tracking-wider">{staff.name}</span><Badge status={getTimesheetStatusFromDB(staff.id).status} /></div>{showAdminTimesheet === staff.id ? (
                                            <div className="mt-2 animate-in fade-in duration-300 font-sans uppercase tracking-widest">
                                                <TimesheetWidget targetUserId={staff.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={toggleAttendanceDB} tsStatus={getTimesheetStatusFromDB(staff.id)} updateTimesheetStatus={updateTimesheetStatusDB} isAdminView={true} />
                                                <div className="flex gap-2 mt-2 font-sans uppercase tracking-widest">
                                                    <button onClick={() => setShowAdminTimesheet(false)} className="flex-1 text-xs text-red-500 font-bold py-2 bg-red-50 rounded uppercase transition-colors hover:bg-red-100 font-sans tracking-widest uppercase tracking-widest">Tutup</button>
                                                    <button onClick={() => updateTimesheetStatusDB(staff.id, 'Approved')} className="flex-1 text-xs text-white font-bold py-2 bg-emerald-600 rounded uppercase shadow transition-all hover:bg-emerald-700 font-sans tracking-widest uppercase tracking-widest shadow-emerald-200">Luluskan</button>
                                                </div>
                                            </div>
                                        ) : (<button onClick={() => setShowAdminTimesheet(staff.id)} className="w-full bg-slate-100 py-2 rounded text-xs font-bold font-sans hover:bg-slate-200 transition-colors uppercase font-sans tracking-widest text-[10px] uppercase tracking-widest">Semak & Luluskan</button>)}</Card>))}
                                    </div>
                                </div>
                            )}
                            <Card className="p-6 shadow-sm uppercase tracking-widest">
                                <h3 className="font-bold mb-4 font-sans text-lg border-b pb-2 tracking-tight uppercase text-slate-700 uppercase tracking-wider text-sm tracking-widest font-sans uppercase tracking-widest">Pengesahan Cuti</h3>
                                {leaves.filter(l=>l.status==='Pending').map(leave=>(<div key={`leave-p-${leave.id}`} className="p-3 border rounded mb-2 flex justify-between items-center bg-slate-50 shadow-inner transition-all hover:border-emerald-200 font-sans uppercase tracking-widest"><div className="text-xs font-sans uppercase tracking-widest"><b>{users.find(u=>u.id===leave.userId)?.nickname}</b>: {leave.startDate}</div><div className="flex gap-1 font-sans uppercase tracking-widest"><button onClick={()=>approveLeaveDB(leave.id,'Approved')} className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold shadow transition-all hover:bg-emerald-700 uppercase font-sans tracking-widest uppercase tracking-widest shadow-emerald-100">Lulus</button></div></div>))}
                                {leaves.filter(l=>l.status==='Pending').length === 0 && <p className="text-xs text-slate-400 italic font-sans uppercase tracking-widest uppercase tracking-widest">Tiada permohonan cuti.</p>}
                                {currentUser.role !== 'staff' && <LeaveHistoryViewer users={users} leaves={leaves} />}
                            </Card>
                        </div>
                    </div>
                    <div className="print:hidden"><PayslipFolderSystem currentUser={currentUser} calculatePayroll={calculatePayroll} setViewedPayslip={setViewedPayslip} timesheetStatus={getTimesheetStatusFromDB(currentUser.id)} currentDate={currentDate} /></div>
                </div>
            )}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden animate-in zoom-in duration-200 font-sans uppercase tracking-widest uppercase tracking-widest"><Card className="w-full max-w-md p-6 shadow-2xl uppercase tracking-widest"><h3 className="font-bold mb-4 font-sans text-xl tracking-tight text-slate-800 border-b pb-2 uppercase tracking-widest uppercase tracking-widest">Edit Profil: {editingUser.nickname}</h3><form onSubmit={(e)=>{e.preventDefault(); updateUserDB(editingUser);}} className="space-y-4 font-sans uppercase tracking-widest uppercase tracking-widest"><div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide uppercase tracking-widest uppercase tracking-widest font-sans">Gaji Pokok (RM)</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all font-sans uppercase tracking-widest" value={editingUser.baseSalary} onChange={e=>setEditingUser({...editingUser, baseSalary: Number(e.target.value)})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide uppercase tracking-widest uppercase tracking-widest font-sans">Elaun Tetap (RM)</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all font-sans uppercase tracking-widest" value={editingUser.fixedAllowance} onChange={e=>setEditingUser({...editingUser, fixedAllowance: Number(e.target.value)})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase tracking-wide font-sans uppercase tracking-widest uppercase tracking-widest font-sans">Kelayakan Cuti (Hari)</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all font-sans uppercase tracking-widest" value={editingUser.leaveBalance} onChange={e=>setEditingUser({...editingUser, leaveBalance: Number(e.target.value)})} /></div><div className="bg-slate-50 p-3 rounded border font-sans uppercase tracking-widest uppercase tracking-widest"><div><label className="text-xs font-bold text-slate-400 uppercase tracking-tighter uppercase tracking-widest uppercase tracking-widest font-sans tracking-widest">KWSP Manual (RM)</label><input type="number" className="w-full border p-1 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all font-sans uppercase tracking-widest uppercase tracking-widest shadow-sm" value={editingUser.customEpf || ''} onChange={e=>setEditingUser({...editingUser, customEpf: e.target.value ? Number(e.target.value) : null})} /></div></div><div className="flex gap-2 pt-4 font-sans uppercase tracking-widest"><button type="button" onClick={()=>setEditingUser(null)} className="flex-1 bg-slate-100 p-2 rounded font-bold hover:bg-slate-200 transition-colors uppercase text-xs uppercase tracking-widest font-sans uppercase tracking-widest uppercase tracking-widest">Batal</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold shadow-md hover:bg-blue-700 transition-all uppercase text-xs uppercase tracking-widest font-sans uppercase tracking-widest shadow-blue-200">Simpan</button></div></form></Card></div>
            )}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in duration-200 font-sans uppercase tracking-widest"><Card className="w-full max-w-sm p-6 shadow-2xl uppercase tracking-widest uppercase tracking-widest"><h3 className="font-bold text-lg mb-4 font-sans tracking-tight uppercase border-b pb-2 uppercase tracking-widest uppercase tracking-widest uppercase tracking-widest font-sans">Tukar Password</h3><form onSubmit={handleChangePassword} className="space-y-4 font-sans uppercase tracking-widest uppercase tracking-widest"><div><label className="text-xs font-bold text-slate-500 uppercase uppercase tracking-widest uppercase tracking-widest font-sans tracking-widest uppercase">Password Baru</label><input type="password" required className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400 transition-all font-sans uppercase tracking-widest shadow-sm" onChange={e => setNewPasswordData({...newPasswordData, new: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500 uppercase uppercase tracking-widest uppercase tracking-widest font-sans tracking-widest uppercase">Sahkan Password</label><input type="password" required className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400 transition-all font-sans uppercase tracking-widest shadow-sm" onChange={e => setNewPasswordData({...newPasswordData, confirm: e.target.value})} /></div><div className="flex gap-2 pt-2 font-sans uppercase tracking-widest"><button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 bg-slate-100 p-2 rounded font-bold uppercase transition-colors hover:bg-slate-200 uppercase tracking-widest text-xs font-sans uppercase tracking-widest">Batal</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold shadow hover:bg-blue-700 transition-colors uppercase uppercase tracking-widest text-xs font-sans uppercase tracking-widest shadow-blue-200">Tukar</button></div></form></Card></div>
            )}
        </main>
    </div>
  );
}
