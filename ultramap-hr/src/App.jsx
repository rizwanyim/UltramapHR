import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { Calendar, FileText, X, Send, Printer, ChevronLeft, ChevronRight, Eye, EyeOff, Edit2, Trash2, Settings, Download, History, ShieldCheck, Lock, Unlock, LayoutDashboard, Wallet, LogOut, Layers, ClipboardList } from 'lucide-react';

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

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Init Error:", e);
}

const SEED_USERS = [
  { email: 'hr.ultramap@gmail.com', name: 'HR Admin', nickname: 'HR', role: 'super_admin', position: 'HR ADMIN', ic: '-', baseSalary: 3000, fixedAllowance: 0, customEpf: null, customSocso: null, lindung24JamMap: {}, leaveBalance: 14 },
  { email: 'hafiz.ultramap@gmail.com', name: 'Mohd Hafiz Bin Mohd Tahir', nickname: 'Hafiz', role: 'super_admin', position: 'SUPER ADMIN', ic: '900405-01-5651', baseSalary: 5000, fixedAllowance: 500, customEpf: 550, customSocso: 19.25, lindung24JamMap: {}, leaveBalance: 20 },
  { email: 'syazwan.ultramap@gmail.com', name: 'Ahmad Syazwan Bin Zahari', nickname: 'Syazwan', role: 'manager', position: 'PROJECT MANAGER', ic: '920426-03-6249', baseSalary: 4000, fixedAllowance: 300, customEpf: 440, customSocso: 19.25, lindung24JamMap: {}, leaveBalance: 18 },
  { email: 'noorizwan.ultramap@gmail.com', name: 'Mohd Noorizwan Bin Md Yim', nickname: 'M. Noorizwan', role: 'staff', position: 'OPERATION', ic: '880112-23-5807', baseSalary: 2300, fixedAllowance: 200, customEpf: null, customSocso: null, lindung24JamMap: {}, leaveBalance: 14 },
  { email: 'taufiq.ultramap@gmail.com', name: 'Muhammad Taufiq Bin Rosli', nickname: 'Taufiq', role: 'staff', position: 'OPERATION', ic: '990807-01-6157', baseSalary: 1800, fixedAllowance: 150, customEpf: null, customSocso: null, lindung24JamMap: {}, leaveBalance: 12 },
];

const JOHOR_HOLIDAYS = [
  { date: '2025-07-07', name: 'Awal Muharram' }, 
  { date: '2025-07-27', name: 'Hol Almarhum Sultan Iskandar' }, 
  { date: '2025-07-28', name: 'Cuti Ganti (Hol Johor)' }, 
  { date: '2025-08-31', name: 'Hari Kebangsaan' },
  { date: '2025-12-25', name: 'Hari Krismas' },
  { date: '2026-02-01', name: 'Hari Thaipusam' },
  { date: '2026-02-02', name: 'Cuti Hari Thaipusam' },
  { date: '2026-02-17', name: 'Tahun Baru Cina' },
  { date: '2026-02-18', name: 'Tahun Baru Cina Hari Kedua' },
  { date: '2026-02-19', name: 'Awal Ramadan' },
  { date: '2026-03-21', name: 'Hari Raya Aidilfitri' },
  { date: '2026-03-22', name: 'Hari Raya Aidilfitri Hari Kedua' },
  { date: '2026-03-23', name: 'Hari Keputeraan Sultan Johor' },
  { date: '2026-05-01', name: 'Hari Pekerja' },
  { date: '2026-05-27', name: 'Hari Raya Haji' },
  { date: '2026-05-31', name: 'Hari Wesak' },
  { date: '2026-06-01', name: 'Hari Keputeraan YDP Agong' },
  { date: '2026-06-17', name: 'Awal Muharram' },
  { date: '2026-07-21', name: 'Hari Hol Almarhum Sultan Iskandar' },
  { date: '2026-08-25', name: 'Maulidur Rasul' },
  { date: '2026-08-31', name: 'Hari Kebangsaan' },
  { date: '2026-09-16', name: 'Hari Malaysia' },
  { date: '2026-11-08', name: 'Hari Deepavali' },
  { date: '2026-11-09', name: 'Cuti Hari Deepavali' },
  { date: '2026-12-25', name: 'Hari Krismas' },
];

// Senarai bulan bermula Ogos 2026
const getLindungMonthOptions = () => {
  const options = [];
  const start = new Date(2026, 7, 1); // Ogos 2026 (Index 7 = Ogos)
  const end = new Date(new Date().getFullYear() + 1, 11, 1);
  let curr = new Date(start);
  while (curr <= end) {
    const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
    const label = curr.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
    options.push({ key, label });
    curr.setMonth(curr.getMonth() + 1);
  }
  return options;
};

// --- HELPER COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <div className={`hr-card bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
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
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.Pending}`}>{status}</span>;
};

const UltramapLogo = ({ className = "h-10" }) => (
  <img 
    src="/logo.png" 
    alt="ULTRAMAP SOLUTION" 
    className={`${className} w-auto object-contain mx-0`} 
    onError={(e) => {
      e.target.style.display = 'none';
      e.target.parentNode.innerHTML = '<span class="font-bold text-red-600 text-2xl">ULTRAMAP</span>'; 
    }}
  />
);

const calculateLeaveDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  let count = 0;
  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const isSunday = current.getDay() === 0;
    const isHoliday = JOHOR_HOLIDAYS.some(h => h.date === dateStr);
    if (!isSunday && !isHoliday) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const PayslipDesign = ({ data, user }) => {
  const totalEarnings = data.basicSalary + data.allowance + data.mealAllowance + data.otAllowance + data.bonus;
  const totalDeductions = data.epf + data.socso;
  const netPay = totalEarnings - totalDeductions;
  return (
    <div className="bg-slate-200 p-4 lg:p-8 flex justify-center overflow-auto min-h-screen print:bg-white print:p-0 print:m-0 print:overflow-hidden">
      <style>{`@media print { @page { size: A4 landscape; margin: 0; } body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; } }`}</style>
      <div className="bg-white shadow-2xl p-12 w-[297mm] h-[210mm] text-black font-sans relative print:shadow-none print:w-[297mm] print:h-[210mm] print:absolute print:top-0 print:left-0 print:scale-[0.96] print:origin-top-left flex flex-col box-border overflow-hidden">
        <div className="flex-grow pb-[70mm]">
            <div className="flex justify-between items-end mb-8 border-b-2 border-slate-800 pb-4">
              <div><UltramapLogo /></div> 
              <div className="text-right">
                <p className="font-bold text-xs mb-1 text-slate-500 font-sans tracking-widest text-right uppercase">Private & Confidential</p>
                <h2 className="text-xl font-bold text-slate-800 tracking-wide font-sans text-right uppercase">ULTRAMAP SOLUTION</h2>
                <p className="text-[10px] text-slate-400 font-sans text-right tracking-tighter uppercase">Monthly Salary Slip</p>
              </div>
            </div>
            <div className="flex justify-between mb-8 border-b border-slate-300 pb-6 gap-10">
                <div className="space-y-3 w-1/2">
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-normal uppercase">Name</span><span className="uppercase font-semibold truncate">: {user.name}</span></div>
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-normal uppercase">I/C No</span><span className="font-semibold font-sans">: {user.ic}</span></div>
                </div>
                <div className="space-y-3 w-1/2 pl-8 border-l border-dashed border-slate-200">
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-normal tracking-tight uppercase tracking-wider text-right md:text-left">Job Title</span><span className="uppercase font-semibold">: {user.position}</span></div>
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-normal tracking-tight uppercase tracking-wider text-right md:text-left">Payslip For</span><span className="uppercase font-semibold">: {data.month}</span></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-16 mb-4 h-[250px]">
              <div className="flex flex-col justify-between">
                <div>
                    <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold tracking-wider text-sm font-sans text-slate-700 uppercase tracking-widest">Earnings (RM)</div>
                    <div className="space-y-2 text-sm font-sans">
                      <div className="flex justify-between"><span>BASIC SALARY</span><span className="font-semibold">{data.basicSalary.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>ALLOWANCE</span><span className="font-semibold">{data.allowance.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>MEAL ALLOWANCE</span><span className="font-semibold">{data.mealAllowance.toFixed(2)}</span></div>
                      <div className="flex justify-between text-slate-400 font-medium"><span>OT ALLOWANCE</span><span className="font-semibold">{data.otAllowance.toFixed(2)}</span></div>
                      <div className="flex justify-between text-slate-400 font-medium"><span>BONUS</span><span className="font-semibold">{data.bonus.toFixed(2)}</span></div>
                    </div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-base mt-4 font-sans text-slate-900 uppercase"><span>TOTAL EARNINGS</span><span>{totalEarnings.toFixed(2)}</span></div>
              </div>
              <div className="flex flex-col justify-between pl-8 border-l border-dashed border-slate-200">
                <div>
                  <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold tracking-wider text-sm font-sans text-slate-700 uppercase tracking-widest">Deduction (RM)</div>
                  <div className="space-y-2 text-sm font-sans">
                    <div className="flex justify-between"><span>EPF (KWSP)</span><span className="text-red-600 font-semibold">{data.epf.toFixed(2)}</span></div>
                    {user.role === 'staff' && (
                        <div className="flex justify-between">
                          <span>SOCSO (PERKESO)</span>
                          <span className="text-red-600 font-semibold">{data.socso.toFixed(2)}</span>
                        </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-base mt-auto text-slate-600 font-sans uppercase"><span>TOTAL DEDUCTION</span><span>{totalDeductions.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-slate-100 border-y-4 border-slate-800 py-5 px-8 flex justify-between items-center mt-4">
              <span className="font-bold text-lg tracking-widest text-slate-700 font-sans tracking-tight uppercase">NET PAY</span>
              <span className="font-bold text-2xl text-slate-900 font-sans tracking-tight">RM {netPay.toFixed(2)}</span>
            </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center px-12 pointer-events-none">
            <div className="border-t border-slate-200 pt-3 text-center">
                <p className="text-[10px] text-slate-400 leading-tight italic font-sans tracking-wider uppercase tracking-widest">This monthly salary slip is electronically generated and does not require any signature.</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest font-sans">ULTRAMAP SOLUTION (JM0876813-V)</p>
            </div>
        </div>
        <div className="absolute top-4 right-4 print:hidden"><button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95 shadow-blue-200"><Printer size={20} /> Cetak / Simpan PDF</button></div>
      </div>
    </div>
  );
};

const TimesheetWidget = ({ targetUserId, currentDate, customSubmissionDate, attendance, setAttendance, tsStatus, updateTimesheetStatus, isAdminView }) => {
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [tempRemark, setTempRemark] = useState("");
  const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + swipeIndex, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();
  const getMonthStr = (d) => d.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
  
  const lastDayOfDispMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const effectiveCutoff = customSubmissionDate || lastDayOfDispMonth;
  const isSubmissionOpen = (swipeIndex === 0 && currentDate.getDate() >= effectiveCutoff);
  const isPastCutoff = customSubmissionDate !== null && currentDate.getDate() >= customSubmissionDate;

  const handleToggle = (day) => {
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holidayInfo = JOHOR_HOLIDAYS.find(h => h.date === dateStr);
    
    const isCurrentMonthView = swipeIndex === 0;
    const entry = attendance.find(a => a.date === dateStr && a.userId === targetUserId);

    if (isAdminView || !isCurrentMonthView) {
        if (entry) { setSelectedDayInfo({ day, dateStr, existingRemark: entry.remark }); setTempRemark(entry.remark || ""); setIsRemarkModalOpen(true); }
        else if (!isAdminView) { alert("Anda hanya boleh mengemaskini timesheet untuk bulan semasa."); }
        return; 
    }

    let isLocked = (isPastCutoff && day <= customSubmissionDate) || (tsStatus.status === 'Submitted' || tsStatus.status === 'Approved');
    if (isLocked) { alert("Tarikh ini dikunci."); return; }
    
    if (holidayInfo) {
      if (!window.confirm(`Hari ini Cuti Umum (${holidayInfo.name}). Confirm kerja Site?`)) return;
    }

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

  const dayArray = Array.from({ length: lastDayOfDispMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: new Date(displayYear, displayMonth, 1).getDay() });
  const displayCount = attendance.filter(a => {
      const d = new Date(a.date);
      return a.userId === targetUserId && d.getMonth() === displayMonth && d.getFullYear() === displayYear;
  }).length;
  const currentMonthHolidays = JOHOR_HOLIDAYS.filter(h => {
    const hd = new Date(h.date);
    return hd.getMonth() === displayMonth && hd.getFullYear() === displayYear;
  });

  return (
    <Card className="p-6 relative shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700 font-sans uppercase tracking-widest"><Calendar size={20} /> Timesheet</h3>
          <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
              <button onClick={() => setSwipeIndex(prev => Math.max(-6, prev - 1))} className={`p-1.5 rounded-full transition-all ${swipeIndex > -6 ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><ChevronLeft size={16} /></button>
              <span className="text-[10px] font-bold px-3 text-slate-600 uppercase min-w-[80px] text-center font-sans">{getMonthStr(displayDate)}</span>
              <button onClick={() => setSwipeIndex(prev => Math.min(1, prev + 1))} className={`p-1.5 rounded-full transition-all ${swipeIndex < 1 ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><ChevronRight size={16} /></button>
          </div>
      </div>
      {tsStatus.status === 'Approved' && tsStatus.approvedBy && (
          <div className="mb-2 flex justify-end">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded flex items-center gap-1 font-sans uppercase tracking-widest">
                  <ShieldCheck size={10} /> Disahkan oleh: <b>{tsStatus.approvedBy}</b>
              </span>
          </div>
      )}
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-1 font-sans tracking-tighter uppercase mb-2">
            {['A','I','S','R','K','J','S'].map((d, i) => (<div key={`h-${i}`} className="text-center text-[10px] font-bold text-slate-400">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1 font-sans">
            {emptySlots.map((_, i) => <div key={`e-${i}`}></div>)}
            {dayArray.map(day => {
                const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const entry = attendance.find(a => a.date === dateStr && a.userId === targetUserId && a.type === 'site');
                const isSite = !!entry;
                const holidayInfo = JOHOR_HOLIDAYS.find(h => h.date === dateStr);
                const isHoliday = !!holidayInfo;
                const isSunday = new Date(displayYear, displayMonth, day).getDay() === 0;
                let isVisualLock = (swipeIndex === 0 && isPastCutoff && day <= customSubmissionDate) || (!isAdminView && (tsStatus.status === 'Submitted' || tsStatus.status === 'Approved'));
                let btnClass = isHoliday ? "bg-orange-100 text-orange-600 border-orange-200" : isSite ? (isVisualLock ? "bg-slate-400 text-white" : "bg-emerald-500 text-white shadow-md") : isSunday ? "bg-slate-200 text-slate-400" : "bg-white text-slate-500 border-slate-100";
                return <button key={`d-${day}`} onClick={() => handleToggle(day)} className={`aspect-square rounded flex flex-col items-center justify-center border text-xs relative ${btnClass}`} title={isHoliday ? holidayInfo.name : ""}>
                    <span className="font-bold">{day}</span>
                    {isSite && <span className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full"></span>}
                </button>;
            })}
        </div>
      </div>
      <div className="mt-auto border-t pt-4">
        {currentMonthHolidays.length > 0 && (
            <div className="mb-3 space-y-1">
                {currentMonthHolidays.map((h, i) => (
                    <p key={`h-rem-${i}`} className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">{new Date(h.date).getDate()}hb - {h.name}</p>
                ))}
            </div>
        )}
        <div className="flex justify-between items-center">
            <div><p className="text-xs text-slate-500 uppercase font-bold font-sans tracking-widest">Jumlah Hari Kerja</p><p className="text-xl font-bold text-emerald-600 font-sans tracking-tight uppercase">{displayCount} Hari</p></div>
            {!isAdminView && (tsStatus.status === 'Draft' || tsStatus.status === 'Rejected') && swipeIndex === 0 && (
                <button 
                  disabled={!isSubmissionOpen}
                  onClick={() => updateTimesheetStatus(targetUserId, 'Submitted')} 
                  className={`px-4 py-2 rounded font-bold text-xs shadow-lg uppercase tracking-widest transition-all ${isSubmissionOpen ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    {isSubmissionOpen ? "Hantar untuk Semakan" : `Hantar (${effectiveCutoff}hb)`}
                </button>
            )}
        </div>
      </div>
      {isRemarkModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                      <div><h4 className="font-bold text-slate-800 text-lg uppercase font-sans">Nota Kehadiran</h4><p className="text-xs text-slate-500">{selectedDayInfo?.day}hb {getMonthStr(displayDate)}</p></div>
                      <button onClick={() => setIsRemarkModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                  </div>
                  <textarea className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 outline-none mb-4" rows="3" value={tempRemark} onChange={(e) => setTempRemark(e.target.value)} readOnly={isAdminView || swipeIndex !== 0} />
                  {!isAdminView && swipeIndex === 0 && (
                    <div className="flex gap-2">
                        {selectedDayInfo?.existingRemark !== undefined && <button onClick={() => { if(confirm("Padam?")) { setAttendance(selectedDayInfo.dateStr, targetUserId, 'site', true); setIsRemarkModalOpen(false); } }} className="p-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={20}/></button>}
                        <button onClick={() => { setAttendance(selectedDayInfo.dateStr, targetUserId, 'site', false, tempRemark); setIsRemarkModalOpen(false); }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-xs tracking-widest">Simpan</button>
                    </div>
                  )}
              </Card>
          </div>
      )}
    </Card>
  );
};

const PayslipFolderSystem = ({ currentUser, calculatePayroll, setViewedPayslip, timesheetStatus, currentDate }) => {
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear()); 
    const getAvailableMonths = (year) => {
        const months = [];
        const today = new Date();
        const currentMonth = today.getMonth(); 
        if (year === 2025) { months.push(new Date(2025, 11, 1)); } 
        else {
            for (let i = 0; i <= currentMonth; i++) {
                const d = new Date(year, i, 1);
                if (d > today) break;
                if (currentUser.role === 'staff' && year === today.getFullYear() && i === currentMonth && timesheetStatus.status !== 'Approved') continue;
                months.push(d);
            }
        }
        return months;
    };
    const availableMonths = getAvailableMonths(selectedYear);
    return (
        <div className="mt-8 pt-8 border-t no-print">
            <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2 font-sans uppercase tracking-widest text-sm"><FileText size={20}/> Arkib Slip Gaji</h3>
            <div className="flex gap-4 mb-4">
                {[2025, 2026].map(year => (<button key={year} onClick={() => setSelectedYear(year)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 font-sans transition-colors ${selectedYear === year ? 'border-blue-600 text-blue-600 bg-blue-50 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>{year}</button>))}
            </div>
            <div className="bg-slate-50 p-4 rounded-b-lg border border-slate-200 min-h-[100px]">
                {availableMonths.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableMonths.map((date, idx) => (
                            <button key={idx} onClick={() => setViewedPayslip({ data: calculatePayroll(currentUser.id, date), user: currentUser })} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-300 transition-all">
                                <span className="text-sm font-bold uppercase font-sans">{date.toLocaleDateString('ms-MY', { month: 'short' })}</span><Download size={14} className="text-slate-300"/>
                            </button>
                        ))}
                    </div>
                ) : <div className="text-center text-slate-400 py-4 text-xs italic">Tiada rekod tersedia bagi tahun ini.</div>}
            </div>
        </div>
    );
};

const LeaveHistoryViewer = ({ users, leaves, getRemainingLeave }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    return (
        <Card className="mt-4 p-4 bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2 tracking-widest"><History size={14}/> Sejarah Cuti Semua Staff</h4>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {users.map(u => (<button key={u.id} onClick={() => setSelectedUser(u.id === selectedUser ? null : u.id)} className={`px-3 py-1 rounded text-[10px] font-bold whitespace-nowrap uppercase ${selectedUser === u.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white border text-slate-600'}`}>{u.nickname}</button>))}
            </div>
            {selectedUser && (
                <div className="space-y-2">
                    <p className="text-[10px] bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 font-bold uppercase tracking-widest mb-2">Baki cuti tinggal {getRemainingLeave(selectedUser)} Hari</p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {leaves.filter(l => l.userId === selectedUser).map((l, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b pb-1 bg-white p-2 rounded shadow-sm">
                                <div><span className="font-bold block">{l.startDate} - {l.endDate}</span><span className="text-[10px] text-slate-500 uppercase">{l.reason} ({l.days} Hari)</span></div>
                                <Badge status={l.status} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

const HR_THEME = `
.hr-ui {
  --ink: #17263b;
  --muted: #51637a;
  --line: #dce5ef;
  --surface: #f3f7fb;
  --accent: #0e665e;
  --accent-pale: #e2f3ef;
  --sidebar: #102b32;
  min-height: 100vh;
  color: var(--ink);
  background: var(--surface);
  font: 1rem/1.5 "Inter", "Segoe UI", system-ui, sans-serif;
}
.hr-ui *, .hr-ui *::before, .hr-ui *::after { box-sizing: border-box; }
.hr-ui .hr-dashboard .font-sans { font-family: inherit; }
.hr-ui button { cursor: pointer; }
.hr-ui button:disabled { cursor: not-allowed; }
.hr-ui :is(input, select, textarea, button, a):focus-visible {
  outline: 3px solid #4b90eb;
  outline-offset: 3px;
}
.hr-ui .hr-card {
  border-color: var(--line);
  border-radius: 16px;
  box-shadow: 0 4px 16px #17263b08;
}
.hr-ui input, .hr-ui select, .hr-ui textarea {
  color: var(--ink);
  border: 1px solid #bfcddd;
  border-radius: 9px;
  min-height: 40px;
  font-size: .925rem;
}
.hr-brand { display: flex; align-items: center; gap: 12px; color: white; }
.hr-brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #123a34;
  background: #a6ebd6;
  flex: none;
}
.hr-brand strong { display: block; font-size: 1.13rem; letter-spacing: -.02em; }
.hr-brand small { display: block; color: #bdccd7; font-size: .77rem; }
.hr-login { display: grid; grid-template-columns: minmax(300px, .94fr) minmax(340px, 1.06fr); }
.hr-login-brand {
  background: radial-gradient(ellipse at 12% 100%, #1d625c, #102b32 65%);
  color: white;
  padding: clamp(28px, 5vw, 72px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(36px, 14vh, 148px);
}
.hr-login-intro { max-width: 510px; }
.hr-login-intro h1 { font-size: clamp(2.1rem, 4.7vw, 4.6rem); line-height: 1.03; letter-spacing: -.06em; font-weight: 750; margin: 0; }
.hr-login-intro p { color: #d0e7e2; margin: 20px 0 26px; }
.hr-login-intro ul { list-style: none; padding: 0; display: grid; gap: 12px; }
.hr-login-intro li { display: flex; align-items: center; gap: 12px; color: #f0faf7; }
.hr-login-intro li svg { color: #a6ebd6; }
.hr-login-main { display: grid; align-items: center; justify-items: center; padding: clamp(22px, 5vw, 70px); }
.hr-login-content {
  max-width: 470px;
  width: 100%;
  padding: clamp(22px, 4vw, 44px);
  border: 1px solid var(--line);
  border-radius: 24px;
  background: white;
  box-shadow: 0 20px 64px #17263b0d;
}
.hr-login-content h2 { margin: 14px 0 4px; font-size: 2rem; letter-spacing: -.045em; font-weight: 750; }
.hr-login-content p { color: var(--muted); margin: 0 0 27px; }
.hr-login-content label { font-size: .9rem; font-weight: 650; display: block; margin: 14px 0 6px; }
.hr-login-content input { width: 100%; padding: 11px 12px; background: white; color: var(--ink); }
.hr-password { position: relative; }
.hr-password input { padding-right: 50px; }
.hr-password button { position: absolute; inset: 2px 2px 2px auto; display: grid; place-items: center; width: 42px; color: var(--muted); border-radius: 8px; }
.hr-primary { margin-top: 22px; width: 100%; padding: 11px 16px; background: var(--accent); color: white; border-radius: 9px; font-weight: 700; }
.hr-primary:hover { background: #084b46; }
.hr-workspace { display: grid; grid-template-columns: 238px minmax(0, 1fr); }
.hr-admin { --accent: #244db4; --accent-pale: #e7edff; --sidebar: #142343; }
.hr-sidebar {
  background: var(--sidebar);
  height: 100dvh;
  position: sticky;
  top: 0;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: white;
  padding: 25px 16px 18px;
}
.hr-sidebar .hr-brand { padding-inline: 8px; }
.hr-admin .hr-brand-mark { background: #c6d6ff; color: #182c64; }
.hr-sidebar-title { font-size: .8rem; font-weight: 700; color: #c4d1df; margin: 22px 8px 0; }
.hr-sidebar nav { display: grid; gap: 5px; }
.hr-sidebar a, .hr-signout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border-radius: 9px;
  font-size: .9rem;
  color: #edf4fa;
  text-decoration: none;
  text-align: left;
}
.hr-sidebar a:hover, .hr-signout:hover { background: #ffffff20; }
.hr-signout { margin-top: auto; border: 1px solid #ffffff32; }
.hr-topbar {
  background: white;
  border-bottom: 1px solid var(--line);
  padding: 12px clamp(16px, 3.2vw, 40px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: .94rem;
  font-weight: 650;
  min-height: 68px;
}
.hr-profile { display: flex; align-items: center; gap: 10px; line-height: 1.25; }
.hr-profile small { display: block; color: var(--muted); font-size: .78rem; margin-top: 4px; }
.hr-avatar {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  flex: none;
  border-radius: 50%;
  background: var(--accent-pale);
  color: var(--accent);
}
.hr-main { max-width: 1430px; margin-inline: auto; padding: clamp(16px, 3.2vw, 40px); }
.hr-dashboard, .hr-stack { display: grid; align-content: start; gap: 22px; min-width: 0; }
.hr-dashboard > *, .hr-stack > *, .hr-workspace-body { min-width: 0; }
.hr-dashboard [id^="hr-"] { scroll-margin-top: 20px; }
.hr-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.hr-heading h1 { font-size: clamp(1.85rem, 3.35vw, 3rem); font-weight: 750; letter-spacing: -.055em; line-height: 1.08; }
.hr-heading p { color: var(--muted); margin-top: 8px; }
.hr-period { display: inline-flex; gap: 8px; align-items: center; padding: 8px 12px; border-radius: 9px; background: white; border: 1px solid var(--line); font-size: .875rem; color: var(--muted); }
.hr-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.hr-team { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.hr-metric {
  background: white;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: clamp(16px, 2.5vw, 24px);
  box-shadow: 0 4px 16px #17263b08;
}
.hr-metric p { margin: 11px 0 4px; color: var(--muted); font-size: .91rem; font-weight: 650; }
.hr-metric strong { display: block; font-size: clamp(1.65rem, 3vw, 2.6rem); line-height: 1.14; font-weight: 750; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.hr-icon { display: block; box-sizing: content-box; padding: 9px; border-radius: 11px; color: var(--accent); background: var(--accent-pale); }
.hr-salary { background: var(--sidebar); color: white; border-color: transparent; }
.hr-salary p { color: #d4e2ec; }
.hr-metric-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.hr-metric-top button { padding: 8px; border-radius: 8px; }
.hr-salary-action { display: inline-flex; align-items: center; gap: 8px; background: #ffffff1c; padding: 7px 11px; font-size: .88rem; border-radius: 9px; margin-top: 13px; }
.hr-salary-action:hover, .hr-metric-top button:hover { background: #ffffff32; }
.hr-admin-grid, .hr-staff-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 22px; }
.hr-staff-grid > .hr-stack { display: contents; }
.hr-dashboard h3, .hr-dashboard h4 { text-transform: none; letter-spacing: -.015em; color: var(--ink); font-size: 1.06rem; }
.hr-dashboard .hr-card :is(button:not(.aspect-square), label, th) { font-size: .875rem; text-transform: none; letter-spacing: normal; }
.hr-dashboard th { white-space: nowrap; }
.hr-dashboard td { white-space: nowrap; }
.hr-dashboard .bg-blue-600 { background-color: var(--accent); }
.hr-dashboard .hr-card input[type="date"] { min-width: 0; }
.hr-dashboard #hr-attendance .aspect-square { border-radius: 8px; font-size: .875rem; }
.hr-dashboard #hr-leave .bg-slate-800 { background: var(--accent); }
.hr-dashboard #hr-payslips > div { margin: 0; background: white; border: 1px solid var(--line); padding: 22px; border-radius: 16px; }
@media (max-width: 1180px) {
  .hr-admin-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 850px) {
  .hr-workspace { display: block; }
  .hr-sidebar { position: relative; height: auto; padding: 14px 16px; gap: 12px; flex-direction: row; flex-wrap: wrap; align-items: center; }
  .hr-sidebar-title { display: none; }
  .hr-sidebar nav { display: flex; overflow: auto; width: 100%; order: 3; }
  .hr-sidebar a { white-space: nowrap; }
  .hr-signout { margin: 0 0 0 auto; }
  .hr-login { grid-template-columns: minmax(0, 1fr); }
  .hr-login-brand { gap: 18px; padding: 25px 22px; }
  .hr-login-intro p { margin: 8px 0 0; }
  .hr-login-intro ul { display: none; }
  .hr-login-main { align-items: start; }
}
@media (max-width: 590px) {
  .hr-staff-grid, .hr-metrics { grid-template-columns: minmax(0, 1fr); }
  .hr-team { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hr-team > :first-child { grid-column: 1 / -1; }
  .hr-dashboard .hr-card { padding: 16px; }
}
@media print {
  .hr-workspace, .hr-main, .hr-workspace-body { display: block; margin: 0; padding: 0; max-width: none; background: white; }
  .hr-sidebar, .hr-topbar, .hr-payslip-back { display: none !important; }
}
`;

const HrBrand = () => (
  <div className="hr-brand">
    <span className="hr-brand-mark"><Layers size={21} aria-hidden="true" /></span>
    <div><strong>Ultramap</strong><small>Solution · Portal HR</small></div>
  </div>
);

const SummaryTile = ({ icon: Icon, label, value }) => (
  <article className="hr-metric">
    <Icon className="hr-icon" size={22} aria-hidden="true" />
    <p>{label}</p>
    <strong>{value}</strong>
  </article>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timesheets, setTimesheets] = useState([]); 
  const [settings, setSettings] = useState({ customSubmissionDate: null });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [viewedPayslip, setViewedPayslip] = useState(null);
  const [currentDate] = useState(new Date()); 
  const [hideSalary, setHideSalary] = useState(false);
  const [showAdminTimesheet, setShowAdminTimesheet] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isBaseFieldsUnlocked, setIsBaseFieldsUnlocked] = useState(false);
  const [isLindungUnlocked, setIsLindungUnlocked] = useState(true);
  const [selectedLindungMonth, setSelectedLindungMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [tempCutoff, setTempCutoff] = useState('');

  const lindungMonthOptions = getLindungMonthOptions();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!auth || !db) return;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userQuery = query(collection(db, "users"), where("email", "==", user.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          const seedMatch = SEED_USERS.find(su => su.email === user.email);
          if (seedMatch) {
            const docRef = await addDoc(collection(db, "users"), seedMatch);
            setCurrentUser({ ...seedMatch, id: docRef.id });
          } else {
            alert("Akaun wujud dalam Auth tetapi tiada profil dalam Firestore.");
          }
        } else {
          setCurrentUser({ ...userSnapshot.docs[0].data(), id: userSnapshot.docs[0].id });
        }
      } else {
        setCurrentUser(null);
      }
    });

    const initSeedUsers = async () => {
      const allUsersSnap = await getDocs(collection(db, "users"));
      if (allUsersSnap.empty) {
        for (const su of SEED_USERS) {
          await addDoc(collection(db, "users"), su);
        }
      }
    };
    initSeedUsers();

    onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "attendance"), (s) => setAttendance(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "leaves"), (s) => setLeaves(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "timesheets"), (s) => setTimesheets(s.docs.map(d => ({...d.data(), id: d.id}))));
    
    onSnapshot(doc(db, "settings", "global"), (s) => { 
        if(s.exists()) {
            setSettings(s.data()); 
            setTempCutoff(s.data().customSubmissionDate || '');
        } 
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async (e) => { 
    e.preventDefault(); 
    try { 
      await signInWithEmailAndPassword(auth, email, password);
      setPassword('');
      setShowPassword(false); 
    } catch (err) { 
      console.error("Login Error:", err);
      alert(`Gagal Log Masuk: ${err.message}`); 
    } 
  };
  
  const handleSaveCutoff = async () => {
    try {
        await setDoc(doc(db, "settings", "global"), { 
            customSubmissionDate: tempCutoff ? Number(tempCutoff) : null 
        }, { merge: true });
        alert("Tetapan Cutoff berjaya disimpan!");
    } catch (err) {
        console.error(err);
        alert("Ralat semasa menyimpan Tetapan Cutoff");
    }
  };

  const updateTimesheetStatusDB = async (userId, status) => {
      const today = new Date();
      const mStr = (today.getDate() <= 5 ? new Date(today.getFullYear(), today.getMonth() - 1, 1) : today).toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
      const existing = timesheets.find(t => t.userId === userId && t.month === mStr);
      if (existing) { await updateDoc(doc(db, "timesheets", existing.id), { status, approvedBy: status === 'Approved' ? currentUser.nickname : null }); } 
      else { await addDoc(collection(db, "timesheets"), { userId, month: mStr, status, approvedBy: status === 'Approved' ? currentUser.nickname : null }); }
  };

  const getRemainingLeave = (uid) => {
      const u = users.find(x => x.id === uid);
      const currentYr = new Date().getFullYear();
      const approvedDaysThisYear = leaves
          .filter(l => l.userId === uid && l.status === 'Approved' && new Date(l.startDate).getFullYear() === currentYr)
          .reduce((acc, curr) => acc + (curr.days || 0), 0);
      return (u?.leaveBalance || 14) - approvedDaysThisYear;
  };

  const calculatePayroll = (userId, forMonthDate = currentDate) => {
    const user = users.find(u => u.id === userId);
    if (!user) return {};
    const epf = (user.customEpf !== null && user.customEpf !== undefined) ? Number(user.customEpf) : (Number(user.baseSalary) * 0.11);
    
    let socso = 0;
    let lindungAmount = 0;

    if (user.role === 'staff') {
        const baseSocso = (user.customSocso !== null && user.customSocso !== undefined && Number(user.customSocso) !== 0) 
          ? Number(user.customSocso) 
          : ((Number(user.baseSalary) * 0.005) + 5);
        
        const targetYear = forMonthDate.getFullYear();
        const targetMonth = forMonthDate.getMonth();
        const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
        
        const isAfterAug2026 = (targetYear > 2026) || (targetYear === 2026 && targetMonth >= 7);
        
        if (isAfterAug2026 && user.lindung24JamMap && user.lindung24JamMap[monthKey] !== undefined) {
            lindungAmount = Number(user.lindung24JamMap[monthKey]) || 0;
        }
        
        socso = baseSocso + lindungAmount;
    }

    const siteDays = attendance.filter(a => { const d = new Date(a.date); return a.userId === userId && d.getMonth() === forMonthDate.getMonth() && d.getFullYear() === forMonthDate.getFullYear(); }).length;
    const meal = user.role === 'staff' ? siteDays * 15 : 0;
    
    return { 
      month: forMonthDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase(), 
      basicSalary: Number(user.baseSalary), 
      allowance: Number(user.fixedAllowance), 
      mealAllowance: meal, 
      otAllowance: 0, 
      bonus: 0, 
      epf, 
      socso, 
      lindungAmount,
      netPay: (Number(user.baseSalary) + Number(user.fixedAllowance) + meal - epf - socso) 
    };
  };

  const openEditModal = (userObj) => {
    const now = new Date();
    const defaultKey = (now.getFullYear() > 2026 || (now.getFullYear() === 2026 && now.getMonth() >= 7))
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      : '2026-08';

    const existingMap = userObj.lindung24JamMap || {};
    const hasSavedValue = existingMap[defaultKey] !== undefined && existingMap[defaultKey] !== null && existingMap[defaultKey] !== '';
    const initialVal = hasSavedValue ? existingMap[defaultKey] : '';

    setSelectedLindungMonth(defaultKey);
    // Kunci medan asas secara default
    setIsBaseFieldsUnlocked(false);
    // Jika bulan tersebut sudah ada rekod disimpan, auto-lock. Jika belum diisi, buka untuk isi.
    setIsLindungUnlocked(!hasSavedValue);

    setEditingUser({
      ...userObj,
      lindung24JamMap: existingMap,
      currentLindungInput: initialVal === 0 && !hasSavedValue ? '' : initialVal
    });
  };

  const lastDayOfMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const effectiveCutoff = settings.customSubmissionDate || lastDayOfMonthDate;
  const isCutoffReached = currentDate.getDate() >= effectiveCutoff;

  if (!currentUser) return (
    <div className="hr-ui hr-login">
      <style>{HR_THEME}</style>
      <aside className="hr-login-brand">
        <HrBrand />
        <div className="hr-login-intro">
          <h1>Urusan kerja dalam satu portal.</h1>
          <p>Semak slip gaji, urus cuti dan rekod kehadiran bersama Ultramap Solution.</p>
          <ul>{[[Wallet, 'Gaji & slip gaji'], [Calendar, 'Permohonan cuti'], [ClipboardList, 'Timesheet kerja']].map(([Icon, title]) => (
            <li key={title}><Icon size={19} aria-hidden="true" />{title}</li>
          ))}</ul>
        </div>
      </aside>
      <main className="hr-login-main">
        <div className="hr-login-content">
          <ShieldCheck size={26} className="hr-icon" aria-hidden="true" />
          <h2>Log masuk</h2>
          <p>Gunakan e-mel dan kata laluan akaun Ultramap anda.</p>
          <form onSubmit={handleLogin}>
            <label htmlFor="hr-email">E-mel</label>
            <input id="hr-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
            <label htmlFor="hr-password">Kata laluan</label>
            <div className="hr-password">
              <input id="hr-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" aria-label={showPassword ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'} onClick={() => setShowPassword(value => !value)}>
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <button type="submit" className="hr-primary">Log masuk</button>
          </form>
        </div>
      </main>
    </div>
  );

  const isAdmin = currentUser.role !== 'staff';
  const portalTitle = isAdmin ? 'Panel Admin' : 'Portal Pekerja';
  const monthLabel = currentDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
  const navItems = [
    ['hr-overview', LayoutDashboard, 'Ringkasan'],
    ...(isAdmin ? [['hr-payroll', Settings, 'Tetapan Gaji'], ['hr-attendance', ClipboardList, 'Timesheet Staf'], ['hr-approvals', ShieldCheck, 'Kelulusan Cuti']]
      : [['hr-attendance', ClipboardList, 'Timesheet']]),
    ['hr-leave', Calendar, 'Cuti Saya'],
    ['hr-payslips', FileText, 'Slip Gaji'],
  ];

  return (
    <div className={`hr-ui hr-workspace ${isAdmin ? 'hr-admin' : 'hr-employee'}`}>
        <style>{HR_THEME}</style>
        <aside className="hr-sidebar print:hidden">
          <HrBrand />
          <p className="hr-sidebar-title">{portalTitle}</p>
          <nav aria-label="Navigasi portal">
            {navItems.map(([id, Icon, title]) => (
              <a key={id} href={`#${id}`} onClick={event => {
                event.preventDefault();
                setViewedPayslip(null);
                window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
              }}><Icon size={18} aria-hidden="true" />{title}</a>
            ))}
          </nav>
          <button className="hr-signout" onClick={() => { setViewedPayslip(null); setEditingUser(null); setShowAdminTimesheet(false); signOut(auth); }}>
            <LogOut size={18} aria-hidden="true" /> Keluar
          </button>
        </aside>
        <div className="hr-workspace-body">
          <header className="hr-topbar print:hidden">
            <span>{portalTitle}</span>
            <div className="hr-profile">
              <span className="hr-avatar" aria-hidden="true">{(currentUser.nickname || currentUser.name || 'U').trim().slice(0, 2).toUpperCase()}</span>
              <div><strong>{currentUser.name}</strong><small>{currentUser.role === 'manager' ? 'Manager' : currentUser.role === 'super_admin' ? 'Super Admin' : 'Pekerja'}</small></div>
            </div>
          </header>
        <main className="hr-main">
            {viewedPayslip ? (
                <div><button onClick={() => setViewedPayslip(null)} className="hr-payslip-back mb-4 flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-slate-800"><ChevronLeft size={16} /> Kembali</button><PayslipDesign data={viewedPayslip.data} user={viewedPayslip.user} /></div>
            ) : (
                <div className="hr-dashboard">
                    <header id="hr-overview" className="hr-heading">
                        <div>
                            <h1>{isAdmin ? 'Pengurusan HR' : `Hai, ${currentUser.nickname}!`}</h1>
                            <p>{isAdmin ? 'Gaji, kehadiran dan permohonan cuti staf.' : 'Ringkasan gaji, cuti dan kehadiran anda.'}</p>
                        </div>
                        <span className="hr-period"><Calendar size={17} aria-hidden="true" />{monthLabel}</span>
                    </header>
                    {isAdmin && <div className="hr-metrics hr-team">
                        <SummaryTile icon={Layers} label="Bilangan Staf" value={users.filter(u => u.role === 'staff').length} />
                        <SummaryTile icon={ShieldCheck} label="Cuti Menunggu Kelulusan" value={leaves.filter(l => l.status === 'Pending').length} />
                        <SummaryTile icon={Calendar} label="Tarikh Akhir Timesheet" value={`${effectiveCutoff} hb`} />
                    </div>}
                    <div className="hr-metrics">
                        <article className="hr-metric hr-salary">
                            <div className="hr-metric-top">
                                <Wallet className="hr-icon" size={22} aria-hidden="true" />
                                <button type="button" aria-label={hideSalary ? 'Tunjukkan gaji' : 'Sembunyikan gaji'} onClick={() => setHideSalary(!hideSalary)}>
                                  {hideSalary ? <EyeOff size={19} /> : <Eye size={19} />}
                                </button>
                            </div>
                            <p>{isAdmin ? 'Anggaran Gaji Saya' : 'Anggaran Gaji'}</p>
                            <strong>{hideSalary ? 'RM ••••' : `RM ${calculatePayroll(currentUser.id).netPay?.toFixed(2)}`}</strong>
                            <button className="hr-salary-action" onClick={() => setViewedPayslip({ data: calculatePayroll(currentUser.id), user: currentUser })}><FileText size={16} aria-hidden="true" /> Lihat slip gaji</button>
                        </article>
                        <SummaryTile icon={Calendar} label={isAdmin ? 'Baki Cuti Saya' : 'Baki Cuti'} value={`${getRemainingLeave(currentUser.id)} hari`} />
                    </div>
                    <div className={isAdmin ? 'hr-admin-grid' : 'hr-staff-grid'}>
                        <div className="hr-stack">
                            {currentUser.role !== 'staff' ? (
                                <section id="hr-payroll" className="hr-stack">
                                    <Card className="p-6">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 uppercase tracking-widest text-sm"><Settings size={20}/> Tetapan Cutoff</h3>
                                        <div className="flex items-center gap-3">
                                            <input type="number" placeholder="Hujung Bulan" value={tempCutoff} onChange={(e) => setTempCutoff(e.target.value)} className="w-20 border rounded p-1 font-bold text-lg text-center focus:ring-2 focus:ring-blue-400 outline-none" />
                                            <span className="text-xs font-bold text-slate-500 uppercase">hb</span>
                                            <button onClick={handleSaveCutoff} className="ml-auto bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors shadow">Simpan</button>
                                        </div>
                                    </Card>
                                    <Card className="p-6 shadow-sm overflow-x-auto">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 uppercase tracking-widest text-sm"><Edit2 size={20}/> Tetapan Gaji & Cuti</h3>
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 uppercase">
                                                <tr>
                                                    <th className="p-2 text-[10px]">Nama</th>
                                                    <th className="p-2 text-[10px]">Basic</th>
                                                    <th className="p-2 text-[10px]">Elaun</th>
                                                    <th className="p-2 text-[10px]">Lindung 24J (Bulan Ini)</th>
                                                    <th className="p-2 text-[10px] text-center">Cuti</th>
                                                    <th className="p-2 text-[10px]">Edit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(u => {
                                                    const currVal = (u.lindung24JamMap && u.lindung24JamMap[currentMonthKey] !== undefined) 
                                                      ? u.lindung24JamMap[currentMonthKey] 
                                                      : 0;
                                                    return (
                                                      <tr key={u.id} className="border-b font-sans hover:bg-slate-50">
                                                          <td className="p-2 font-bold uppercase">{u.nickname}</td>
                                                          <td className="p-2">{Number(u.baseSalary).toFixed(2)}</td>
                                                          <td className="p-2">{Number(u.fixedAllowance).toFixed(2)}</td>
                                                          <td className="p-2 text-blue-600 font-semibold">{u.role === 'staff' ? Number(currVal).toFixed(2) : '-'}</td>
                                                          <td className="p-2 text-center">{u.leaveBalance}</td>
                                                          <td><button onClick={() => openEditModal(u)} className="text-blue-600 underline font-bold uppercase text-[10px] hover:text-blue-800">Edit</button></td>
                                                      </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </Card>
                                </section>
                            ) : (
                                <section id="hr-attendance"><TimesheetWidget targetUserId={currentUser.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={(dateStr, userId, type, shouldDelete, remark) => { const existing = attendance.find(a => a.date === dateStr && a.userId === userId); if (shouldDelete && existing) deleteDoc(doc(db, "attendance", existing.id)); else if (existing) updateDoc(doc(db, "attendance", existing.id), { remark }); else addDoc(collection(db, "attendance"), { date: dateStr, userId, type, remark }); }} tsStatus={timesheets.find(t => t.userId === currentUser.id && t.month === currentDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase()) || { status: 'Draft' }} updateTimesheetStatus={updateTimesheetStatusDB} isAdminView={false} /></section>
                            )}
                            <section id="hr-leave" className="hr-stack">
                            <Card className="p-6 shadow-sm"><h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm"><Send size={18} /> Permohonan Cuti</h3><form onSubmit={(e)=>{e.preventDefault(); const f=e.target; addDoc(collection(db,'leaves'),{userId:currentUser.id,startDate:f.s.value,endDate:f.e.value,reason:f.r.value,status:'Pending',days:calculateLeaveDuration(f.s.value, f.e.value)}); f.reset(); alert("Permohonan dihantar!");}} className="space-y-3"><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input aria-label="Tarikh mula cuti" name="s" type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none" required/><input aria-label="Tarikh akhir cuti" name="e" type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none" required/></div><input aria-label="Sebab cuti" name="r" placeholder="Sebab Cuti" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none" required/><button className="bg-slate-800 text-white w-full py-3 rounded font-bold uppercase text-xs tracking-widest hover:bg-slate-900 transition-colors shadow">Hantar Permohonan</button></form></Card>
                            <Card className="p-6 shadow-sm">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest"><History size={18} /> Sejarah Cuti Saya</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {leaves.filter(l => l.userId === currentUser.id).sort((a,b) => new Date(b.startDate) - new Date(a.startDate)).map(leave => (
                                        <div key={leave.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50 transition-all hover:border-blue-200 shadow-sm">
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{leave.startDate} - {leave.endDate}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">{leave.reason} ({leave.days} Hari)</p>
                                                {leave.status === 'Approved' && leave.approvedBy && (<p className="text-[9px] text-emerald-600 font-bold mt-1">Approved by {leave.approvedBy}</p>)}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge status={leave.status} />
                                                {new Date() <= new Date(leave.endDate) && (<button onClick={async () => { if(confirm("Batal permohonan ini?")) await deleteDoc(doc(db, "leaves", leave.id)); }} className="text-red-400 p-1 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>)}
                                            </div>
                                        </div>
                                    ))}
                                    {leaves.filter(l => l.userId === currentUser.id).length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Tiada rekod cuti.</p>}
                                </div>
                            </Card>
                            </section>
                        </div>
                        {isAdmin && <div className="hr-stack">
                                    <section id="hr-attendance"><h3 className="font-bold text-lg text-slate-700 mb-4 uppercase tracking-widest text-sm">Panel Timesheet Staff</h3><div className="space-y-4">{users.filter(u => u.role === 'staff').map(staff => {
                                        const ts = timesheets.find(t => t.userId === staff.id && t.month === currentDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase()) || { status: 'Draft' };
                                        return (<Card key={staff.id} className="p-4 shadow-sm"><div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700 uppercase">{staff.name}</span><Badge status={ts.status} /></div>{showAdminTimesheet === staff.id ? (
                                            <div className="mt-2 space-y-2">
                                                <TimesheetWidget targetUserId={staff.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={()=>{}} tsStatus={ts} updateTimesheetStatus={updateTimesheetStatusDB} isAdminView={true} />
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowAdminTimesheet(false)} className="flex-1 text-xs text-red-500 font-bold py-2 bg-red-50 rounded uppercase hover:bg-red-100 transition-colors">Tutup</button>
                                                    {ts.status === 'Approved' ? (
                                                        <button onClick={() => updateTimesheetStatusDB(staff.id, 'Draft')} className="flex-1 text-xs text-white font-bold py-2 bg-orange-500 rounded uppercase shadow-sm hover:bg-orange-600 transition-colors">Buka Semula (Draft)</button>
                                                    ) : (
                                                        <button disabled={!isCutoffReached} onClick={() => updateTimesheetStatusDB(staff.id, 'Approved')} className={`flex-1 text-xs text-white font-bold py-2 rounded uppercase shadow-sm transition-all ${isCutoffReached ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}>{isCutoffReached ? "Luluskan" : `Lulus (Hanya ${effectiveCutoff}hb)`}</button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (<button onClick={() => setShowAdminTimesheet(staff.id)} className="w-full bg-slate-100 py-2 rounded text-xs font-bold uppercase hover:bg-slate-200 transition-colors">Semak & Luluskan</button>)}</Card>);
                                    })}</div></section>
                                    <section id="hr-approvals"><Card className="p-6 shadow-sm"><h3 className="font-bold mb-4 uppercase text-sm tracking-widest border-b pb-2">Pengesahan Cuti (Admin)</h3>
                                        {leaves.filter(l=>l.status==='Pending').map(leave=>(<div key={leave.id} className="p-3 border rounded mb-2 flex justify-between items-center bg-slate-50 hover:border-emerald-200 transition-all"><div className="text-xs"><b>{users.find(u=>u.id===leave.userId)?.nickname}</b>: {leave.startDate}</div><button onClick={()=>updateDoc(doc(db, "leaves", leave.id), { status: 'Approved', approvedBy: currentUser.nickname })} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors">Sahkan Cuti</button></div>))}
                                        {leaves.filter(l=>l.status==='Pending').length === 0 && <p className="text-xs text-slate-400 italic">Tiada permohonan cuti baru.</p>}
                                        <LeaveHistoryViewer users={users} leaves={leaves} getRemainingLeave={getRemainingLeave} />
                                    </Card></section>
                        </div>}
                    </div>
                    <div id="hr-payslips" className="print:hidden"><PayslipFolderSystem currentUser={currentUser} calculatePayroll={calculatePayroll} setViewedPayslip={setViewedPayslip} timesheetStatus={timesheets.find(t => t.userId === currentUser.id && t.month === currentDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase()) || { status: 'Draft' }} currentDate={currentDate} /></div>
                </div>
            )}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg max-h-[90dvh] overflow-y-auto p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="font-bold text-lg uppercase tracking-widest">Edit Profil: {editingUser.nickname}</h3>
                            <button 
                                type="button" 
                                onClick={() => setIsBaseFieldsUnlocked(!isBaseFieldsUnlocked)} 
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isBaseFieldsUnlocked ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
                                title="Buka kunci untuk edit Gaji Pokok, Elaun, KWSP, SOCSO & Cuti"
                            >
                                <Edit2 size={12} />
                                {isBaseFieldsUnlocked ? 'Kunci Tetapan' : 'Edit Tetapan'}
                            </button>
                        </div>

                        <form onSubmit={async (e)=>{
                            e.preventDefault(); 
                            const hasValue = editingUser.currentLindungInput !== '' && editingUser.currentLindungInput !== null;
                            const parsedAmount = hasValue ? (parseFloat(editingUser.currentLindungInput) || 0) : 0;

                            const updatedMap = { ...(editingUser.lindung24JamMap || {}) };
                            if (hasValue) {
                                updatedMap[selectedLindungMonth] = parsedAmount;
                            } else {
                                delete updatedMap[selectedLindungMonth];
                            }

                            await updateDoc(doc(db, "users", editingUser.id), { 
                                baseSalary: Number(editingUser.baseSalary), 
                                fixedAllowance: Number(editingUser.fixedAllowance), 
                                customEpf: editingUser.customEpf !== null && editingUser.customEpf !== '' ? Number(editingUser.customEpf) : null, 
                                customSocso: editingUser.customSocso !== null && editingUser.customSocso !== '' ? Number(editingUser.customSocso) : null, 
                                lindung24JamMap: updatedMap, 
                                leaveBalance: Number(editingUser.leaveBalance) 
                            }); 
                            setEditingUser(null); 
                            alert(`Berjaya disimpan! Lindung 24J (${selectedLindungMonth}): RM ${parsedAmount.toFixed(2)}`);
                        }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        Gaji Pokok (RM) {!isBaseFieldsUnlocked && <Lock size={10} className="text-slate-400" />}
                                    </label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        disabled={!isBaseFieldsUnlocked}
                                        className={`w-full border p-2 rounded outline-none transition-all ${!isBaseFieldsUnlocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-400'}`} 
                                        value={editingUser.baseSalary} 
                                        onChange={e=>setEditingUser({...editingUser, baseSalary: Number(e.target.value)})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        Elaun Tetap (RM) {!isBaseFieldsUnlocked && <Lock size={10} className="text-slate-400" />}
                                    </label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        disabled={!isBaseFieldsUnlocked}
                                        className={`w-full border p-2 rounded outline-none transition-all ${!isBaseFieldsUnlocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-400'}`} 
                                        value={editingUser.fixedAllowance} 
                                        onChange={e=>setEditingUser({...editingUser, fixedAllowance: Number(e.target.value)})} 
                                    />
                                </div>
                            </div>
                            
                            <div className={`grid ${editingUser.role === 'staff' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'} gap-2 items-start`}>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        KWSP Manual {!isBaseFieldsUnlocked && <Lock size={9} className="text-slate-400" />}
                                    </label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        disabled={!isBaseFieldsUnlocked}
                                        className={`w-full border p-2 rounded outline-none transition-all ${!isBaseFieldsUnlocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-400'}`} 
                                        value={editingUser.customEpf || ''} 
                                        onChange={e=>setEditingUser({...editingUser, customEpf: e.target.value ? Number(e.target.value) : null})} 
                                    />
                                </div>
                                
                                {editingUser.role === 'staff' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                SOCSO (RM) {!isBaseFieldsUnlocked && <Lock size={9} className="text-slate-400" />}
                                            </label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                disabled={!isBaseFieldsUnlocked}
                                                className={`w-full border p-2 rounded outline-none transition-all ${!isBaseFieldsUnlocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-400'}`} 
                                                value={editingUser.customSocso || ''} 
                                                onChange={e=>setEditingUser({...editingUser, customSocso: e.target.value ? Number(e.target.value) : null})} 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                                    Lindung 24J {!isLindungUnlocked && <Lock size={9} className="text-blue-600" />}
                                                </label>
                                                {!isLindungUnlocked && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setIsLindungUnlocked(true)} 
                                                        className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-50 transition-colors"
                                                        title="Edit nilai Lindung 24 Jam bulan ini"
                                                    >
                                                        <Edit2 size={11} />
                                                    </button>
                                                )}
                                            </div>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="0.00" 
                                                disabled={!isLindungUnlocked}
                                                className={`w-full border p-2 rounded outline-none transition-all font-semibold ${!isLindungUnlocked ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed' : 'border-blue-300 bg-blue-50/40 text-blue-800 focus:ring-2 focus:ring-blue-400'}`} 
                                                value={editingUser.currentLindungInput} 
                                                onChange={e => {
                                                  const val = e.target.value;
                                                  setEditingUser({
                                                    ...editingUser, 
                                                    currentLindungInput: val,
                                                    lindung24JamMap: {
                                                      ...(editingUser.lindung24JamMap || {}),
                                                      [selectedLindungMonth]: val !== '' ? parseFloat(val) : 0
                                                    }
                                                  });
                                                }} 
                                            />
                                            <select 
                                                value={selectedLindungMonth} 
                                                onChange={(e) => {
                                                  const newKey = e.target.value;
                                                  const hasSaved = editingUser.lindung24JamMap && editingUser.lindung24JamMap[newKey] !== undefined && editingUser.lindung24JamMap[newKey] !== null && editingUser.lindung24JamMap[newKey] !== '';
                                                  const savedVal = hasSaved ? editingUser.lindung24JamMap[newKey] : '';
                                                  
                                                  setSelectedLindungMonth(newKey);
                                                  setIsLindungUnlocked(!hasSaved);
                                                  setEditingUser({
                                                    ...editingUser,
                                                    currentLindungInput: savedVal === 0 && !hasSaved ? '' : savedVal
                                                  });
                                                }}
                                                className="w-full border border-blue-200 bg-white p-1.5 rounded text-[11px] font-bold text-slate-700 uppercase outline-none focus:border-blue-500 cursor-pointer"
                                            >
                                                {lindungMonthOptions.map(opt => (
                                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    Kelayakan Cuti (Hari) {!isBaseFieldsUnlocked && <Lock size={10} className="text-slate-400" />}
                                </label>
                                <input 
                                    type="number" 
                                    disabled={!isBaseFieldsUnlocked}
                                    className={`w-full border p-2 rounded outline-none transition-all ${!isBaseFieldsUnlocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-400'}`} 
                                    value={editingUser.leaveBalance} 
                                    onChange={e=>setEditingUser({...editingUser, leaveBalance: Number(e.target.value)})} 
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={()=>setEditingUser(null)} className="flex-1 bg-slate-100 p-2 rounded font-bold uppercase text-xs hover:bg-slate-200 transition-colors">Batal</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold uppercase text-xs shadow-md shadow-blue-200 hover:bg-blue-700 transition-all">Simpan</button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </main>
        </div>
    </div>
  );
}
