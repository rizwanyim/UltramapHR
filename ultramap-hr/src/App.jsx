import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { Calendar, DollarSign, FileText, CheckCircle, XCircle, Menu, X, Send, Printer, ChevronLeft, ChevronRight, Eye, EyeOff, Edit2, Save, Bell, AlertCircle, Trash2, Settings, RefreshCcw, Lock, ArrowRight, User, Info, Download, Users, Database, LogOut, Key, History, FolderOpen, Folder } from 'lucide-react';

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

// --- DATA INITIAL ---
const SEED_USERS = [
  { email: 'hafiz@ultramap.com', name: 'Mohd Hafiz Bin Mohd Tahir', nickname: 'Hafiz', role: 'manager', position: 'MANAGER', ic: '80xxxx-xx-xxxx', baseSalary: 5000, fixedAllowance: 500, customEpf: 550, customSocso: 19.25, leaveBalance: 20 },
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
  // 2026
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

const getMonthList = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(d);
    }
    return months;
};

// --- HELPER COMPONENTS ---
const Card = ({ children, className = "" }) => <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>;
const Badge = ({ status }) => {
  const styles = { Pending: "bg-yellow-100 text-yellow-800 border-yellow-200", Approved: "bg-emerald-100 text-emerald-800 border-emerald-200", Rejected: "bg-red-100 text-red-800 border-red-200", Draft: "bg-gray-100 text-gray-500 border-gray-200", Submitted: "bg-blue-100 text-blue-800 border-blue-200" };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.Pending}`}>{status}</span>;
};

// --- LOGO COMPONENT (DINAMIK - BOLEH UBAH SAIZ) ---
const UltramapLogo = ({ className = "h-10" }) => (
  <img 
    src="/logo.png" 
    alt="ULTRAMAP SOLUTION" 
    className={`${className} w-auto object-contain`} 
    onError={(e) => {
      e.target.style.display = 'none';
      e.target.parentNode.innerHTML = '<span class="font-bold text-red-600 text-xl">ULTRAMAP</span>'; 
    }}
  />
);

// --- PAYSLIP DESIGN (LANDSCAPE A4) ---
const PayslipDesign = ({ data, user }) => {
  const totalEarnings = data.basicSalary + data.allowance + data.mealAllowance + data.otAllowance + data.bonus;
  const totalDeductions = data.epf + data.socso;
  const netPay = totalEarnings - totalDeductions;

  return (
    <div className="bg-slate-200 p-4 lg:p-8 flex justify-center overflow-auto min-h-screen">
      <div className="bg-white shadow-2xl p-10 w-[297mm] min-h-[210mm] min-w-[297mm] text-black font-sans text-sm relative print:shadow-none print:w-full print:min-w-0 print:absolute print:top-0 print:left-0 print:m-0 print:landscape">
        
        {/* Header - LOGO BESAR (h-24) */}
        <div className="flex justify-between items-end mb-8 border-b-2 border-slate-800 pb-4">
          <div><UltramapLogo className="h-24" /></div> 
          <div className="text-right">
            <p className="font-bold uppercase text-xs mb-1 text-slate-500">Private & Confidential</p>
            <h2 className="text-xl font-bold text-slate-800 tracking-wide">ULTRAMAP SOLUTION</h2>
            <p className="text-[10px] text-slate-400">Monthly Salary Slip</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8 border-b border-slate-300 pb-6">
          <div><span className="block font-bold text-slate-600 text-xs">NAME</span><span className="uppercase font-semibold text-base">{user.name}</span></div>
          <div><span className="block font-bold text-slate-600 text-xs">I/C NO</span><span className="font-mono text-base">{user.ic}</span></div>
          <div><span className="block font-bold text-slate-600 text-xs">JOB TITLE</span><span className="uppercase font-semibold text-base">{user.position}</span></div>
          <div className="text-right"><span className="block font-bold text-slate-600 text-xs">PAYSLIP FOR</span><span className="uppercase font-bold text-xl block">{data.month}</span></div>
        </div>
        
        <div className="grid grid-cols-2 gap-16 mb-6 font-mono text-base">
          <div>
            <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase tracking-wider font-sans">Earnings (RM)</div>
            <div className="space-y-3">
              <div className="flex justify-between"><span>BASIC SALARY</span><span>{data.basicSalary.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>ALLOWANCE</span><span>{data.allowance.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>MEAL ALLOWANCE</span><span>{data.mealAllowance.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400"><span>OT ALLOWANCE</span><span>{data.otAllowance.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400"><span>BONUS</span><span>{data.bonus.toFixed(2)}</span></div>
            </div>
            <div className="border-t border-slate-300 mt-6 pt-2 flex justify-between font-bold text-lg"><span>TOTAL EARNINGS</span><span>{totalEarnings.toFixed(2)}</span></div>
          </div>
          <div className="flex flex-col h-full">
            <div>
                <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase tracking-wider font-sans">Deduction (RM)</div>
                <div className="space-y-3">
                <div className="flex justify-between"><span>EPF</span><span className="text-red-600">{data.epf.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>SOCSO</span><span className="text-red-600">{data.socso.toFixed(2)}</span></div>
                </div>
            </div>
            <div className="border-t border-slate-300 mt-auto pt-2 flex justify-between font-bold text-lg text-slate-600"><span>TOTAL DEDUCTION</span><span>{totalDeductions.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="mt-12 bg-slate-100 border-y-4 border-slate-800 py-6 px-8 flex justify-between items-center"><span className="font-bold text-xl uppercase tracking-widest text-slate-700">NET PAY</span><span className="font-bold text-4xl text-slate-900 font-mono">RM {netPay.toFixed(2)}</span></div>
        <div className="text-center text-[10px] text-slate-400 absolute bottom-8 left-0 right-0"><p>This monthly salary slip is electronically generated and does not require any signature.</p><p className="font-bold mt-1">ULTRAMAP SOLUTION (JM0876813-V)</p></div>
      </div>
    </div>
  );
};

// --- TIMESHEET WIDGET ---
const TimesheetWidget = ({ targetUserId, currentDate, customSubmissionDate, attendance, setAttendance, tsStatus, updateTimesheetStatus, isAdminView }) => {
  const [swipeIndex, setSwipeIndex] = useState(0);
  const isPastCutoff = customSubmissionDate !== null && currentDate.getDate() >= customSubmissionDate;
  const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + swipeIndex, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();
  const getMonthStr = (d) => d.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
  const getLastDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const autoLastDay = getLastDayOfMonth(currentDate);
  const effectiveOpenDate = customSubmissionDate ? customSubmissionDate : autoLastDay;
  const isSubmissionOpen = currentDate.getDate() >= effectiveOpenDate;
  const canSubmit = isSubmissionOpen && (tsStatus.status === 'Draft' || tsStatus.status === 'Rejected');
  
  const activeHolidays = JOHOR_HOLIDAYS.filter(h => {
    const hDate = new Date(h.date);
    return hDate.getMonth() === displayMonth && hDate.getFullYear() === displayYear;
  });

  const handleToggle = (day) => {
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holidayInfo = JOHOR_HOLIDAYS.find(h => h.date === dateStr);
    
    let isLocked = false;
    if (swipeIndex === 0 && isPastCutoff && day <= customSubmissionDate) isLocked = true;
    if (!isAdminView && (tsStatus.status === 'Submitted' || tsStatus.status === 'Approved')) isLocked = true;
    if (isLocked && !isAdminView) { alert("Tarikh ini dikunci."); return; }

    const isCurrentlySite = attendance.some(a => a.date === dateStr && a.userId === targetUserId);
    if (!isCurrentlySite) {
        if (holidayInfo) { if (!window.confirm(`Hari ini ${holidayInfo.name}. Confirm kerja Site?`)) return; }
        const clickedDate = new Date(displayYear, displayMonth, day);
        if (clickedDate.getDay() === 0) { if (!window.confirm("Hari ini Ahad. Confirm kerja Site?")) return; }
    }
    const existingIndex = attendance.findIndex(a => a.date === dateStr && a.userId === targetUserId);
    if (existingIndex >= 0) setAttendance(dateStr, targetUserId, 'site', true); 
    else setAttendance(dateStr, targetUserId, 'site', false); 
  };

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const dayArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: new Date(displayYear, displayMonth, 1).getDay() });
  
  let displayCount = 0; let countLabel = "Hari";
  if (isPastCutoff && swipeIndex === 1) {
      const current = attendance.filter(a => new Date(a.date).getMonth() === displayMonth && a.userId === targetUserId).length;
      const prevCutoff = new Date(displayYear, displayMonth - 1, customSubmissionDate);
      const rollover = attendance.filter(a => new Date(a.date).getMonth() === prevCutoff.getMonth() && new Date(a.date).getDate() > customSubmissionDate && a.userId === targetUserId).length;
      displayCount = current + rollover; countLabel = `(Ogos: ${current} + Baki: ${rollover})`;
  } else {
      displayCount = attendance.filter(a => new Date(a.date).getMonth() === displayMonth && a.userId === targetUserId).length;
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg flex items-center gap-2 text-slate-700"><Calendar size={20} /> Timesheet</h3>{isPastCutoff ? (<div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200"><button onClick={() => setSwipeIndex(0)} className={`p-1.5 rounded-full ${swipeIndex === 0 ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><ChevronLeft size={16} /></button><span className="text-[10px] font-bold px-3 text-slate-600 uppercase min-w-[80px] text-center">{getMonthStr(displayDate)}</span><button onClick={() => setSwipeIndex(1)} className={`p-1.5 rounded-full ${swipeIndex === 1 ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><ChevronRight size={16} /></button></div>) : <Badge status={tsStatus.status} />}</div>
      <div className="mb-4"><div className="grid grid-cols-7 gap-1">{['A','I','S','R','K','J','S'].map(d => (<div key={d} className="text-center text-[10px] font-bold text-slate-400 mb-1">{d}</div>))}{emptySlots.map((_, i) => <div key={`empty-${i}`}></div>)}{dayArray.map(day => {
            const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSite = attendance.some(a => a.date === dateStr && a.userId === targetUserId && a.type === 'site');
            const isHoliday = JOHOR_HOLIDAYS.find(h => h.date === dateStr);
            const isSunday = new Date(displayYear, displayMonth, day).getDay() === 0;
            let isVisualLock = (swipeIndex === 0 && isPastCutoff && day <= customSubmissionDate) || isAdminView || (tsStatus.status === 'Submitted' || tsStatus.status === 'Approved');
            let btnClass = "bg-white text-slate-500 border-slate-100 hover:border-blue-300";
            if (isHoliday) btnClass = "bg-orange-100 text-orange-600 border-orange-200 font-bold";
            else if (isSite) btnClass = isVisualLock ? "bg-slate-400 text-white border-slate-500" : "bg-emerald-500 text-white shadow-md border-emerald-600";
            else if (isSunday) btnClass = "bg-slate-200 text-slate-400 border-slate-300";
            else if (isVisualLock) btnClass = "opacity-50 cursor-not-allowed bg-slate-50 text-slate-300";
            return <button key={day} onClick={() => handleToggle(day)} disabled={isVisualLock && !isAdminView} className={`aspect-square rounded flex flex-col items-center justify-center border text-xs relative ${btnClass}`}><span className="font-bold">{day}</span>{isSite && !isVisualLock && <span className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full"></span>}{isVisualLock && isSite && <span className="absolute top-0.5 right-0.5"><Lock size={8} /></span>}</button>;
      })}</div></div>
      <div className="mt-auto flex justify-between items-center border-t pt-4"><div><p className="text-xs text-slate-500 uppercase font-bold">Total ({getMonthStr(displayDate)})</p><p className="text-xl font-bold text-emerald-600">{displayCount} <span className="text-[10px] font-normal text-slate-500">{countLabel}</span></p></div>
      {isAdminView ? (
          <div className="flex gap-2">
             <button onClick={() => updateTimesheetStatus(targetUserId, 'Rejected')} className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Reject</button>
             <button onClick={() => updateTimesheetStatus(targetUserId, 'Approved')} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold shadow">Approve</button>
          </div>
      ) : (
          !isPastCutoff && tsStatus.status !== 'Submitted' && tsStatus.status !== 'Approved' && (<button disabled={!canSubmit} onClick={canSubmit ? () => updateTimesheetStatus(targetUserId, 'Submitted') : undefined} className={`px-4 py-2 rounded font-bold text-xs shadow-lg transition-all ${canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>{isSubmissionOpen ? "Hantar untuk Semakan" : `Hantar (Dibuka ${effectiveOpenDate}hb)`}</button>)
      )}
      {isPastCutoff && !isAdminView && <div className="text-right"><p className="text-[10px] text-slate-400 italic">{swipeIndex === 0 ? `1-${customSubmissionDate}hb Dikunci` : "Termasuk Baki"}</p></div>}</div>
    </Card>
  );
};

// --- LEAVE HISTORY VIEWER (ADMIN) ---
const LeaveHistoryViewer = ({ users, leaves }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><History size={14}/> Sejarah Cuti Semua Staff</h4>
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {users.map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u.id === selectedUser ? null : u.id)} className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${selectedUser === u.id ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>{u.nickname}</button>
                ))}
            </div>
            {selectedUser && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {leaves.filter(l => l.userId === selectedUser).map(l => (
                        <div key={l.id} className="flex justify-between items-center text-sm border-b pb-1 bg-white p-2 rounded">
                            <div><span className="font-bold block">{l.startDate} - {l.endDate}</span><span className="text-xs text-slate-500">{l.reason}</span></div>
                            <Badge status={l.status} />
                        </div>
                    ))}
                    {leaves.filter(l => l.userId === selectedUser).length === 0 && <p className="text-xs text-slate-400 text-center">Tiada rekod cuti.</p>}
                </div>
            )}
        </div>
    );
};

// --- PAYSLIP LIST (FOLDER SYSTEM) ---
const PayslipFolderSystem = ({ currentUser, calculatePayroll, setViewedPayslip, timesheetStatus }) => {
    const [selectedYear, setSelectedYear] = useState(2025); 

    const getAvailableMonths = (year) => {
        const months = [];
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); 

        if (year === 2025) {
            // Only Dec 2025
            months.push(new Date(2025, 11, 1)); 
        } else if (year === 2026) {
            for (let i = 0; i < 12; i++) {
                const d = new Date(2026, i, 1);
                if (d > today) break;
                // For Staff, only show if Approved OR current month not ended
                if (currentUser.role === 'staff') {
                   if (i === currentMonth && currentYear === 2026 && timesheetStatus.status !== 'Approved') continue;
                }
                months.push(d);
            }
        }
        return months;
    };

    const availableMonths = getAvailableMonths(selectedYear);

    return (
        <div className="mt-8 pt-8 border-t">
            <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2"><FileText size={20}/> Arkib Slip Gaji</h3>
            <div className="flex gap-4 mb-4">
                <button onClick={() => setSelectedYear(2025)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-all ${selectedYear === 2025 ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                    {selectedYear === 2025 ? <FolderOpen size={18}/> : <Folder size={18}/>}<span className="font-bold">2025</span>
                </button>
                <button onClick={() => setSelectedYear(2026)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-all ${selectedYear === 2026 ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                    {selectedYear === 2026 ? <FolderOpen size={18}/> : <Folder size={18}/>}<span className="font-bold">2026</span>
                </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-b-lg rounded-tr-lg border border-slate-200 min-h-[100px]">
                {availableMonths.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableMonths.map((date, idx) => (
                            <button key={idx} onClick={() => setViewedPayslip({ data: calculatePayroll(currentUser.id, date), user: currentUser })} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-2"><FileText size={16} className="text-red-500"/><span className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{date.toLocaleDateString('ms-MY', { month: 'short' }).toUpperCase()}</span></div><Download size={14} className="text-slate-300 group-hover:text-blue-500"/>
                            </button>
                        ))}
                    </div>
                ) : <div className="text-center text-slate-400 py-4 text-xs italic">Tiada rekod.</div>}
            </div>
        </div>
    );
};

// --- BORANG CUTI ---
const LeaveForm = ({ currentUser, leaves, setLeaves, deleteLeaveDB }) => {
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', type: 'AL', reason: '' });
  const leaveDuration = calculateLeaveDuration(newLeave.startDate, newLeave.endDate);
  const handleLeaveSubmit = (e) => { e.preventDefault(); setLeaves({ ...newLeave, id: Date.now(), userId: currentUser.id, status: 'Pending', days: leaveDuration }); setNewLeave({ startDate: '', endDate: '', type: 'AL', reason: '' }); alert("Permohonan cuti dihantar!"); };
  const handleWithdrawLeave = (leaveId) => { if (window.confirm("Adakah anda pasti mahu membatalkan cuti ini?")) { deleteLeaveDB(leaveId); } };

  return (
    <Card className="p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Send size={18} /> Permohonan Cuti</h3>
      <form onSubmit={handleLeaveSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-500">Mula</label><input type="date" required className="w-full border rounded p-2 text-sm" value={newLeave.startDate} onChange={e => setNewLeave({...newLeave, startDate: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500">Tamat</label><input type="date" required className="w-full border rounded p-2 text-sm" value={newLeave.endDate} onChange={e => setNewLeave({...newLeave, endDate: e.target.value})} /></div></div>
        {leaveDuration > 0 && (<div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">Jumlah Cuti: <b>{leaveDuration} Hari</b> (Tolak Ahad & Cuti Am)</div>)}
        <div><label className="text-xs font-bold text-slate-500">Tujuan</label><textarea rows="2" placeholder="..." required className="w-full border rounded p-2 text-sm" value={newLeave.reason} onChange={e => setNewLeave({...newLeave, reason: e.target.value})} /></div>
        <button className="w-full bg-slate-800 text-white py-2 rounded text-sm font-bold hover:bg-slate-900">Hantar</button>
      </form>
      <div className="mt-6 pt-4 border-t"><h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2"><History size={14}/> Sejarah Cuti Saya</h4><div className="space-y-2 max-h-40 overflow-y-auto">{leaves.filter(l => l.userId === currentUser.id).map(l => (
        <div key={l.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm"><div><span className="font-bold block">{l.startDate} - {l.endDate}</span> <span className="text-slate-500 text-xs italic">{l.reason} • {l.days} Hari</span></div><div className="flex items-center gap-2"><Badge status={l.status} />{(l.status === 'Pending' || l.status === 'Approved') && (<button type="button" onClick={() => handleWithdrawLeave(l.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Batalkan"><Trash2 size={16} /></button>)}</div></div>))}</div></div>
    </Card>
  );
}

// --- MAIN APP ---
export default function UltramapLiveV24() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [settings, setSettings] = useState({ customSubmissionDate: null });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [viewedPayslip, setViewedPayslip] = useState(null);
  const [currentDate] = useState(new Date(2025, 11, 9)); 
  const [hideSalary, setHideSalary] = useState(false);
  const [showAdminTimesheet, setShowAdminTimesheet] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordData, setNewPasswordData] = useState({ new: '', confirm: '' });

  // DB LISTENERS
  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, "users"), where("email", "==", user.email));
        onSnapshot(q, (snapshot) => { if (!snapshot.empty) setCurrentUser({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id }); });
      } else setCurrentUser(null);
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({...d.data(), id: d.id}))));
    const unsubAtt = onSnapshot(collection(db, "attendance"), (s) => setAttendance(s.docs.map(d => ({...d.data(), id: d.id}))));
    const unsubLeaves = onSnapshot(collection(db, "leaves"), (s) => setLeaves(s.docs.map(d => ({...d.data(), id: d.id}))));
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (s) => { if(s.exists()) setSettings(s.data()); });
    return () => { unsubscribeAuth(); unsubUsers(); unsubAtt(); unsubLeaves(); unsubSettings(); };
  }, []);

  const handleLogin = async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { alert("Login Gagal: " + err.message); } };
  const handleLogout = () => signOut(auth);
  
  const handleSeedData = async () => {
    if (!confirm("Adakah anda pasti? Ini akan masukkan data asal jika database kosong.")) return;
    try {
        await setDoc(doc(db, "settings", "global"), { customSubmissionDate: null });
        for (const u of SEED_USERS) {
            const q = query(collection(db, "users"), where("email", "==", u.email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { await addDoc(collection(db, "users"), u); }
        }
        alert("Database seeded! (Duplicates prevented). Sila create akaun di Firebase Auth tab dengan email yang sama.");
    } catch(e) {
        alert("Error seeding: " + e.message);
    }
  };

  const toggleAttendanceDB = async (dateStr, userId, type, shouldDelete) => {
      if (shouldDelete) {
          const existing = attendance.find(a => a.date === dateStr && a.userId === userId);
          if (existing) await deleteDoc(doc(db, "attendance", existing.id));
      } else {
          await addDoc(collection(db, "attendance"), { date: dateStr, userId, type });
      }
  };
  const submitLeaveDB = async (leaveData) => { await addDoc(collection(db, "leaves"), leaveData); alert("Permohonan cuti dihantar!"); };
  const deleteLeaveDB = async (id) => { if(confirm("Padam?")) await deleteDoc(doc(db, "leaves", id)); };
  const approveLeaveDB = async (id, status) => { await updateDoc(doc(db, "leaves", id), { status }); };
  const updateSettingsDB = async (val) => { await updateDoc(doc(db, "settings", "global"), { customSubmissionDate: val }); };
  const updateUserDB = async (u) => { await updateDoc(doc(db, "users", u.id), { baseSalary: u.baseSalary, fixedAllowance: u.fixedAllowance, customEpf: u.customEpf, customSocso: u.customSocso, leaveBalance: u.leaveBalance }); setEditingUser(null); alert("Data Staff Dikemaskini"); };
  
  const updateTimesheetStatusDB = async (userId, status) => {
      // Find existing status doc for this month or create new
      // Note: For simplicity in this demo we use local state logic mapped to DB, 
      // but ideally you'd have a 'timesheets' collection. 
      // Here we assume basic flow.
      alert("Status dikemaskini: " + status);
  };

  const handleChangePassword = async (e) => {
      e.preventDefault();
      if(newPasswordData.new !== newPasswordData.confirm) return alert("Password tidak sama!");
      if(newPasswordData.new.length < 6) return alert("Minima 6 karakter.");
      try {
          await updatePassword(auth.currentUser, newPasswordData.new);
          alert("Berjaya tukar password! Sila login semula.");
          setShowPasswordModal(false);
          handleLogout();
      } catch(err) { alert("Gagal: " + err.message + ". Sila login semula dan cuba lagi."); }
  };

  const calculatePayroll = (userId, forMonthDate = currentDate) => {
    const user = users.find(u => u.id === userId);
    if (!user) return {};
    const monthStr = forMonthDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
    const year = forMonthDate.getFullYear();
    const month = forMonthDate.getMonth();
    
    const epf = (user.customEpf !== null && user.customEpf !== undefined) ? user.customEpf : (user.baseSalary * 0.11);
    const socso = (user.customSocso !== null && user.customSocso !== undefined) ? user.customSocso : (user.baseSalary * 0.005 + 5);

    if (user.role === 'super_admin' || user.role === 'manager') {
       return { month: monthStr, basicSalary: user.baseSalary, allowance: user.fixedAllowance, mealAllowance: 0, rolloverNote: "", otAllowance: 0, bonus: 0, epf, socso, netPay: (user.baseSalary + user.fixedAllowance - epf - socso) };
    }

    let mealAllowance = 0, siteDaysCount = 0, rolloverNote = "";
    const prevMonthDate = new Date(year, month - 1, 1);
    const customDate = settings.customSubmissionDate;
    const currentMonthSite = attendance.filter(a => { const d = new Date(a.date); return a.userId === userId && a.type === 'site' && d.getMonth() === month && d.getFullYear() === year; }).length;
    siteDaysCount += currentMonthSite;

    if (customDate !== null) {
       const prevMonthSiteRemainder = attendance.filter(a => { const d = new Date(a.date); return a.userId === userId && a.type === 'site' && d.getMonth() === prevMonthDate.getMonth() && d.getDate() > customDate; }).length;
       if (prevMonthSiteRemainder > 0) { siteDaysCount += prevMonthSiteRemainder; rolloverNote = `Termasuk ${prevMonthSiteRemainder} hari baki bulan lepas.`; }
       if (forMonthDate.getDate() >= customDate) {
           const excludedLate = attendance.filter(a => { const d = new Date(a.date); return a.userId === userId && a.type === 'site' && d.getMonth() === month && d.getDate() > customDate; }).length;
           siteDaysCount -= excludedLate; 
           if(excludedLate > 0) rolloverNote += " (Gaji Awal: Baki dibawa ke depan)";
       }
    }
    mealAllowance = siteDaysCount * 15;
    return { month: monthStr, basicSalary: user.baseSalary, allowance: user.fixedAllowance, mealAllowance, rolloverNote, otAllowance: 0, bonus: 0, epf, socso, netPay: (user.baseSalary + user.fixedAllowance + mealAllowance - epf - socso) };
  };

  if (!currentUser) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4"><Card className="w-full max-w-sm p-8 bg-white"><div className="flex justify-center mb-6"><UltramapLogo className="h-10" /></div><h2 className="text-center font-bold text-slate-800 mb-6">Log Masuk HR System</h2><form onSubmit={handleLogin} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="nama@ultramap.com" required /></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded" placeholder="******" required /></div><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Masuk</button></form><div className="mt-8 border-t pt-4 text-center"><button onClick={handleSeedData} className="text-xs text-slate-300 hover:text-slate-500 flex items-center justify-center gap-1 mx-auto"><Database size={12}/> Setup Database (First Run)</button></div></Card></div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
        <nav className="bg-white border-b sticky top-0 z-20 px-4 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3"><UltramapLogo className="h-10" /></div>
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold hidden md:block uppercase text-slate-500">{currentUser.nickname}</span>
                <button onClick={() => setShowPasswordModal(true)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><Settings size={16}/></button>
                <button onClick={handleLogout} className="text-xs bg-slate-200 px-3 py-2 rounded font-bold flex items-center gap-2"><LogOut size={14}/> Keluar</button>
            </div>
        </nav>
        
        <main className="max-w-6xl mx-auto p-4 lg:p-8">
            {viewedPayslip ? (
                <div><button onClick={() => setViewedPayslip(null)} className="mb-4 flex items-center gap-2 text-slate-500"><ChevronLeft size={16} /> Kembali</button><PayslipDesign data={viewedPayslip.data} user={viewedPayslip.user} /></div>
            ) : (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-slate-800">Hi! <span className="text-blue-600">{currentUser.nickname}</span>!</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 rounded-xl p-5 text-white shadow-lg relative">
                            <div className="flex justify-between items-start"><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Anggaran Gaji</p><button onClick={() => setHideSalary(!hideSalary)} className="text-slate-400 hover:text-white">{hideSalary ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
                            <h2 className="text-2xl lg:text-3xl font-bold mt-1">{hideSalary ? 'RM ****' : `RM ${calculatePayroll(currentUser.id).netPay?.toFixed(2)}`}</h2>
                        </div>
                        <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-center"><p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Baki Cuti</p><h2 className="text-3xl font-bold text-slate-800">{currentUser.leaveBalance} Hari</h2></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {(currentUser.role === 'super_admin' || currentUser.role === 'manager') ? (
                                <>
                                    <Card className="p-6 border-l-4 border-l-blue-600">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={20} className="text-slate-400"/> Tetapan Cutoff</h3>
                                        <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
                                            <div className="flex-1"><p className="text-xs font-bold text-slate-500 uppercase mb-1">Tarikh Submission</p><div className="flex items-center gap-2"><input type="number" min="1" max="31" placeholder="Auto" value={settings.customSubmissionDate || ''} onChange={(e) => updateSettingsDB(e.target.value ? Number(e.target.value) : null)} className="w-16 border rounded text-center font-bold text-lg p-1" /><span className="text-sm font-bold text-slate-600">hb</span>{settings.customSubmissionDate !== null && <button onClick={() => updateSettingsDB(null)} className="ml-2 text-xs bg-slate-200 px-2 py-1 rounded">Reset</button>}</div></div>
                                        </div>
                                    </Card>
                                    {currentUser.role === 'super_admin' && (
                                        <Card className="p-6"><h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Edit2 size={20}/> Tetapan Gaji & Cuti</h3><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-100 text-slate-500"><tr><th className="p-3">Nama</th><th className="p-3">Basic (RM)</th><th className="p-3">Cuti</th><th className="p-3">Edit</th></tr></thead><tbody className="divide-y">{users.map(u => (<tr key={u.id}><td className="p-3 font-medium">{u.nickname}</td><td className="p-3">{u.baseSalary}</td><td className="p-3">{u.leaveBalance}</td><td className="p-3"><button onClick={() => setEditingUser(u)} className="text-blue-600 hover:underline">Edit</button></td></tr>))}</tbody></table></div></Card>
                                    )}
                                    
                                    {/* LEAVE BALANCE LIST (NEW FEATURE REQUEST) */}
                                    <Card className="p-6">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Users size={20}/> Senarai Baki Cuti Staff</h3>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {users.map(u => {
                                                const approvedDays = leaves.filter(l => l.userId === u.id && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0);
                                                const remaining = u.leaveBalance - approvedDays;
                                                return (
                                                    <div key={u.id} className="flex justify-between items-center text-sm border-b pb-1">
                                                        <span className="font-bold text-slate-700">{u.nickname}</span>
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Baki: {remaining} / {u.leaveBalance}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>

                                    <Card className="p-6">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle size={20}/> Pengesahan Cuti</h3>
                                        {leaves.filter(l => l.status === 'Pending').map(leave => (
                                            <div key={leave.id} className="p-3 border rounded bg-slate-50 mb-2">
                                                <div className="flex justify-between"><span className="font-bold text-sm">{users.find(u => u.id === leave.userId)?.nickname}</span><Badge status="Pending"/></div>
                                                <p className="text-xs text-slate-500 mt-1">{leave.startDate} - {leave.endDate} ({leave.days} Hari) : "{leave.reason}"</p>
                                                <div className="flex gap-2 mt-2"><button onClick={() => approveLeaveDB(leave.id, 'Approved')} className="flex-1 bg-emerald-500 text-white text-xs py-1 rounded">Lulus</button><button onClick={() => approveLeaveDB(leave.id, 'Rejected')} className="flex-1 bg-red-500 text-white text-xs py-1 rounded">Tolak</button></div>
                                            </div>
                                        ))}
                                        {leaves.filter(l => l.status === 'Pending').length === 0 && <p className="text-xs text-slate-400 italic">Tiada permohonan.</p>}
                                        <LeaveHistoryViewer users={users} leaves={leaves} />
                                    </Card>
                                </>
                            ) : (
                                <TimesheetWidget 
                                    targetUserId={currentUser.id} 
                                    currentDate={currentDate} 
                                    customSubmissionDate={settings.customSubmissionDate} 
                                    attendance={attendance} 
                                    setAttendance={toggleAttendanceDB} 
                                    tsStatus={{ status: 'Draft' }} 
                                    updateTimesheetStatus={()=>{}} 
                                    isAdminView={false} 
                                />
                            )}
                        </div>
                        <div className="space-y-6">
                            {(currentUser.role === 'staff') && <LeaveForm currentUser={currentUser} leaves={leaves} setLeaves={submitLeaveDB} deleteLeaveDB={deleteLeaveDB} />}
                            
                            {(currentUser.role === 'super_admin' || currentUser.role === 'manager') && (
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700 mb-4">Timesheet Staff</h3>
                                    <div className="space-y-4">{users.filter(u => u.role === 'staff').map(staff => (<Card key={staff.id} className="p-4"><div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700">{staff.name}</span></div>{showAdminTimesheet === staff.id ? (<div className="mt-2"><TimesheetWidget targetUserId={staff.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={toggleAttendanceDB} tsStatus={{status: 'Draft'}} updateTimesheetStatus={()=>{}} isAdminView={true} /><div className="flex gap-2 mt-2"><button onClick={() => setShowAdminTimesheet(false)} className="flex-1 text-xs text-slate-500 py-2 bg-slate-100 rounded font-bold">Tutup</button><button className="flex-1 text-xs text-white py-2 bg-blue-600 rounded font-bold" onClick={() => updateTimesheetStatusDB(staff.id, 'Approved')}>Luluskan</button></div></div>) : (<button onClick={() => setShowAdminTimesheet(staff.id)} className="w-full bg-slate-100 text-slate-600 py-2 rounded text-xs font-bold hover:bg-slate-200">Semak</button>)}</Card>))}</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <PayslipFolderSystem currentUser={currentUser} calculatePayroll={calculatePayroll} setViewedPayslip={setViewedPayslip} timesheetStatus={{status: 'Approved'}} />
                </div>
            )}
            
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-md p-6"><h3 className="font-bold text-lg mb-4">Edit: {editingUser.nickname}</h3><form onSubmit={(e) => { e.preventDefault(); updateUserDB(editingUser); }} className="space-y-3">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Gaji Kasar (RM)</label><input type="number" className="border w-full p-2 rounded" value={editingUser.baseSalary} onChange={e => setEditingUser({...editingUser, baseSalary: Number(e.target.value)})} /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Elaun Tetap (RM)</label><input type="number" className="border w-full p-2 rounded" value={editingUser.fixedAllowance} onChange={e => setEditingUser({...editingUser, fixedAllowance: Number(e.target.value)})} /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Jumlah Cuti (Hari)</label><input type="number" className="border w-full p-2 rounded" value={editingUser.leaveBalance} onChange={e => setEditingUser({...editingUser, leaveBalance: Number(e.target.value)})} /></div>
                    <div className="bg-slate-50 p-3 rounded border space-y-2"><p className="text-xs font-bold text-slate-700">Potongan Manual (Kosong = Auto)</p><div><label className="text-xs text-slate-500">KWSP (RM)</label><input type="number" className="w-full border p-2 rounded" placeholder="Auto (11%)" value={editingUser.customEpf || ''} onChange={e => setEditingUser({...editingUser, customEpf: e.target.value ? Number(e.target.value) : null})} /></div><div><label className="text-xs text-slate-500">SOCSO (RM)</label><input type="number" className="w-full border p-2 rounded" placeholder="Auto" value={editingUser.customSocso || ''} onChange={e => setEditingUser({...editingUser, customSocso: e.target.value ? Number(e.target.value) : null})} /></div></div><div className="flex gap-2"><button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-200 py-2 rounded">Cancel</button><button className="flex-1 bg-blue-600 text-white py-2 rounded">Save</button></div></form></Card></div>
            )}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-sm p-6"><h3 className="font-bold text-lg mb-4">Tukar Password</h3><form onSubmit={handleChangePassword} className="space-y-3"><div><label className="text-xs font-bold text-slate-500">Password Baru</label><input type="password" required className="w-full border p-2 rounded" onChange={e => setNewPasswordData({...newPasswordData, new: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500">Sahkan Password</label><input type="password" required className="w-full border p-2 rounded" onChange={e => setNewPasswordData({...newPasswordData, confirm: e.target.value})} /></div><div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 bg-slate-200 py-2 rounded">Batal</button><button className="flex-1 bg-blue-600 text-white py-2 rounded">Tukar</button></div></form></Card></div>
            )}
        </main>
    </div>
  );
}