import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { Calendar, DollarSign, FileText, CheckCircle, XCircle, Menu, X, Send, Printer, ChevronLeft, ChevronRight, Eye, EyeOff, Edit2, Save, Bell, AlertCircle, Trash2, Settings, RefreshCcw, Lock, ArrowRight, User, Info, Download, Users, Database, LogOut, Key } from 'lucide-react';

// --- 1. CONFIG FIREBASE (DIPERBETULKAN) ---
const firebaseConfig = {
  apiKey: "AIzaSyD_1BO0kY9CpzselHNIG-NiuNbqitaywE8", 
  authDomain: "ultramap-hr.firebaseapp.com",
  projectId: "ultramap-hr",
  storageBucket: "ultramap-hr.appspot.com",
  messagingSenderId: "409015904834",
  appId: "1:409015904834:web:8f4a7b59f6cc86585c9bdb",
  measurementId: "G-40VRCBXNL8"
};

// Initialize Firebase (Clean Initialization)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATA INITIAL ---
const SEED_USERS = [
  // Admin 1
  { email: 'hafiz@ultramap.com', name: 'Mohd Hafiz Bin Mohd Tahir', nickname: 'Hafiz', role: 'super_admin', position: 'SUPER ADMIN', ic: '80xxxx-xx-xxxx', baseSalary: 5000, fixedAllowance: 500, customEpf: 550, customSocso: 19.25, leaveBalance: 20 },
  // Admin 2
  { email: 'syazwan@ultramap.com', name: 'Ahmad Syazwan Bin Zahari', nickname: 'Syazwan', role: 'manager', position: 'PROJECT MANAGER', ic: '920426-03-6249', baseSalary: 4000, fixedAllowance: 300, customEpf: 440, customSocso: 19.25, leaveBalance: 18 },
  // Staff 1
  { email: 'noorizwan@ultramap.com', name: 'Mohd Noorizwan Bin Md Yim', nickname: 'M. Noorizwan', role: 'staff', position: 'OPERATION', ic: '880112-23-5807', baseSalary: 2300, fixedAllowance: 200, customEpf: null, customSocso: null, leaveBalance: 14 },
  // Staff 2
  { email: 'taufiq@ultramap.com', name: 'Muhammad Taufiq Bin Rosli', nickname: 'Taufiq', role: 'staff', position: 'OPERATION', ic: '990807-01-6157', baseSalary: 1800, fixedAllowance: 150, customEpf: null, customSocso: null, leaveBalance: 12 },
];

const JOHOR_HOLIDAYS = [
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

// --- HELPER COMPONENTS ---
const Card = ({ children, className = "" }) => <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>;
const Badge = ({ status }) => {
  const styles = { Pending: "bg-yellow-100 text-yellow-800 border-yellow-200", Approved: "bg-emerald-100 text-emerald-800 border-emerald-200", Rejected: "bg-red-100 text-red-800 border-red-200", Draft: "bg-gray-100 text-gray-500 border-gray-200", Submitted: "bg-blue-100 text-blue-800 border-blue-200" };
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

// --- PAYSLIP (LANDSCAPE) ---
const PayslipDesign = ({ data, user }) => {
  const totalEarnings = data.basicSalary + data.allowance + data.mealAllowance + data.otAllowance + data.bonus;
  const totalDeductions = data.epf + data.socso;
  const netPay = totalEarnings - totalDeductions;
  return (
    <div className="bg-slate-200 p-4 lg:p-8 flex justify-center overflow-auto min-h-screen">
      <div className="bg-white shadow-2xl p-10 w-[297mm] min-h-[210mm] min-w-[297mm] text-black font-sans text-sm relative print:shadow-none print:w-full print:min-w-0 print:absolute print:top-0 print:left-0 print:m-0 print:landscape">
        <div className="flex justify-between items-end mb-8 border-b-2 border-slate-800 pb-4">
          <div><UltramapLogo /></div>
          <div className="text-right"><p className="font-bold uppercase text-xs mb-1 text-slate-500">Private & Confidential</p><h2 className="text-xl font-bold text-slate-800 tracking-wide">ULTRAMAP SOLUTION</h2><p className="text-[10px] text-slate-400">Monthly Salary Slip</p></div>
        </div>
        <div className="grid grid-cols-4 gap-6 mb-8 border-b border-slate-300 pb-6">
          <div><span className="block font-bold text-slate-600 text-xs">NAME</span><span className="uppercase font-semibold text-base">{user.name}</span></div>
          <div><span className="block font-bold text-slate-600 text-xs">I/C NO</span><span className="font-mono text-base">{user.ic}</span></div>
          <div><span className="block font-bold text-slate-600 text-xs">JOB TITLE</span><span className="uppercase font-semibold text-base">{user.position}</span></div>
          <div className="text-right"><span className="block font-bold text-slate-600 text-xs">PAYSLIP FOR</span><span className="uppercase font-bold text-xl block">{data.month}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-16 mb-6">
          <div>
            <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase tracking-wider text-base">Earnings (RM)</div>
            <div className="space-y-3 text-base">
              <div className="flex justify-between"><span>BASIC SALARY</span><span className="font-mono">{data.basicSalary.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>ALLOWANCE</span><span className="font-mono">{data.allowance.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>MEAL ALLOWANCE</span><span className="font-mono">{data.mealAllowance.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400"><span>OT ALLOWANCE</span><span className="font-mono">{data.otAllowance.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-400"><span>BONUS</span><span className="font-mono">{data.bonus.toFixed(2)}</span></div>
            </div>
            <div className="border-t border-slate-300 mt-6 pt-2 flex justify-between font-bold text-lg"><span>TOTAL EARNINGS</span><span>{totalEarnings.toFixed(2)}</span></div>
          </div>
          <div className="flex flex-col h-full">
            <div>
                <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase tracking-wider text-base">Deduction (RM)</div>
                <div className="space-y-3 text-base">
                <div className="flex justify-between"><span>EPF</span><span className="font-mono text-red-600">{data.epf.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>SOCSO</span><span className="font-mono text-red-600">{data.socso.toFixed(2)}</span></div>
                </div>
            </div>
            <div className="border-t border-slate-300 mt-auto pt-2 flex justify-between font-bold text-lg text-slate-600"><span>TOTAL DEDUCTION</span><span>{totalDeductions.toFixed(2)}</span></div>
          </div>
        </div>
        <div className="mt-12 bg-slate-100 border-y-4 border-slate-800 py-6 px-8 flex justify-between items-center"><span className="font-bold text-xl uppercase tracking-widest text-slate-700">NET PAY</span><span className="font-bold text-4xl text-slate-900">RM {netPay.toFixed(2)}</span></div>
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
  
  const handleToggle = (day) => {
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (JOHOR_HOLIDAYS.find(h => h.date === dateStr)) return;
    let isLocked = false;
    if (swipeIndex === 0 && isPastCutoff && day <= customSubmissionDate) isLocked = true;
    if (isAdminView || tsStatus.status === 'Submitted' || tsStatus.status === 'Approved') isLocked = true;
    if (isLocked) { if (!isAdminView) alert("Tarikh ini dikunci."); return; }
    const clickedDate = new Date(displayYear, displayMonth, day);
    if (clickedDate.getDay() === 0) { 
        if (!attendance.some(a => a.date === dateStr && a.userId === targetUserId)) { if (!window.confirm("Hari ini Ahad. Confirm kerja Site?")) return; }
    }
    const existingIndex = attendance.findIndex(a => a.date === dateStr && a.userId === targetUserId);
    let newAttendance = [...attendance];
    if (existingIndex >= 0) newAttendance.splice(existingIndex, 1);
    else newAttendance.push({ date: dateStr, userId: targetUserId, type: 'site' });
    setAttendance(dateStr, targetUserId, 'site'); 
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
            if (isHoliday) btnClass = "bg-orange-100 text-orange-600 border-orange-200 cursor-not-allowed font-bold";
            else if (isSite) btnClass = isVisualLock ? "bg-slate-400 text-white border-slate-500" : "bg-emerald-500 text-white shadow-md border-emerald-600";
            else if (isSunday) btnClass = "bg-slate-200 text-slate-400 border-slate-300";
            else if (isVisualLock) btnClass = "opacity-50 cursor-not-allowed bg-slate-50 text-slate-300";
            return <button key={day} onClick={() => handleToggle(day)} disabled={isHoliday || (isVisualLock && !isSite)} className={`aspect-square rounded flex flex-col items-center justify-center border text-xs relative ${btnClass}`}><span className="font-bold">{day}</span>{isSite && !isVisualLock && !isHoliday && <span className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full"></span>}{isVisualLock && isSite && <span className="absolute top-0.5 right-0.5"><Lock size={8} /></span>}</button>;
      })}</div></div>
      <div className="mt-auto flex justify-between items-center border-t pt-4"><div><p className="text-xs text-slate-500 uppercase font-bold">Total ({getMonthStr(displayDate)})</p><p className="text-xl font-bold text-emerald-600">{displayCount} <span className="text-[10px] font-normal text-slate-500">{countLabel}</span></p></div>{!isAdminView && !isPastCutoff && tsStatus.status !== 'Submitted' && tsStatus.status !== 'Approved' && (<button disabled={!canSubmit} onClick={canSubmit ? () => updateTimesheetStatus(targetUserId, 'Submitted') : undefined} className={`px-4 py-2 rounded font-bold text-xs shadow-lg transition-all ${canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>{isSubmissionOpen ? "Hantar untuk Semakan" : `Hantar (Dibuka ${effectiveOpenDate}hb)`}</button>)}{isPastCutoff && <div className="text-right"><p className="text-[10px] text-slate-400 italic">{swipeIndex === 0 ? `1-${customSubmissionDate}hb Dikunci` : "Termasuk Baki"}</p></div>}</div>
    </Card>
  );
};

// --- MAIN APP ---
export default function App() {
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
  
  // SEED DB FOR FIRST RUN
  const handleSeedData = async () => {
    if (!confirm("Adakah anda pasti? Ini akan masukkan data asal jika database kosong.")) return;
    try {
        await setDoc(doc(db, "settings", "global"), { customSubmissionDate: null });
        for (const u of SEED_USERS) {
            const q = query(collection(db, "users"), where("email", "==", u.email));
            // Just add, no complex check for this simple seed script
            await addDoc(collection(db, "users"), u);
        }
        alert("Database seeded! Sila create akaun di Firebase Auth tab dengan email yang sama.");
    } catch(e) {
        alert("Error seeding: " + e.message);
    }
  };

  const toggleAttendanceDB = async (dateStr, userId, type) => {
      const existing = attendance.find(a => a.date === dateStr && a.userId === userId);
      if (existing) await deleteDoc(doc(db, "attendance", existing.id));
      else await addDoc(collection(db, "attendance"), { date: dateStr, userId, type });
  };
  const submitLeaveDB = async (leaveData) => { await addDoc(collection(db, "leaves"), leaveData); alert("Permohonan cuti dihantar!"); };
  const deleteLeaveDB = async (id) => { if(confirm("Padam?")) await deleteDoc(doc(db, "leaves", id)); };
  const approveLeaveDB = async (id, status) => { await updateDoc(doc(db, "leaves", id), { status }); };
  const updateSettingsDB = async (val) => { await updateDoc(doc(db, "settings", "global"), { customSubmissionDate: val }); };
  const updateUserDB = async (u) => { await updateDoc(doc(db, "users", u.id), { baseSalary: u.baseSalary, fixedAllowance: u.fixedAllowance, customEpf: u.customEpf, customSocso: u.customSocso, leaveBalance: u.leaveBalance }); setEditingUser(null); alert("Data Staff Dikemaskini"); };
  
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

  const calculatePayroll = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return {};
    const monthStr = currentDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Use fallback to 0 or auto calculation if null
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
       if (currentDate.getDate() >= customDate) {
           const excludedLate = attendance.filter(a => { const d = new Date(a.date); return a.userId === userId && a.type === 'site' && d.getMonth() === month && d.getDate() > customDate; }).length;
           siteDaysCount -= excludedLate; 
           if(excludedLate > 0) rolloverNote += " (Gaji Awal: Baki dibawa ke depan)";
       }
    }
    mealAllowance = siteDaysCount * 15;
    return { month: monthStr, basicSalary: user.baseSalary, allowance: user.fixedAllowance, mealAllowance, rolloverNote, otAllowance: 0, bonus: 0, epf, socso, netPay: (user.baseSalary + user.fixedAllowance + mealAllowance - epf - socso) };
  };

  if (!currentUser) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4"><Card className="w-full max-w-sm p-8 bg-white"><div className="flex justify-center mb-6"><UltramapLogo /></div><h2 className="text-center font-bold text-slate-800 mb-6">Log Masuk HR System</h2><form onSubmit={handleLogin} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="nama@ultramap.com" required /></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded" placeholder="******" required /></div><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Masuk</button></form><div className="mt-8 border-t pt-4 text-center"><button onClick={handleSeedData} className="text-xs text-slate-300 hover:text-slate-500 flex items-center justify-center gap-1 mx-auto"><Database size={12}/> Setup Database (First Run)</button></div></Card></div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
        <nav className="bg-white border-b sticky top-0 z-20 px-4 h-16 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3"><UltramapLogo /></div>
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
                            <button onClick={() => setViewedPayslip({ data: calculatePayroll(currentUser.id), user: currentUser })} className="bg-white/20 hover:bg-white/30 text-white py-1 px-3 rounded text-[10px] font-bold flex items-center gap-2 w-fit mt-2"><Download size={12}/> Slip Gaji</button>
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
                                    <Card className="p-6">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle size={20}/> Pengesahan Cuti</h3>
                                        {leaves.filter(l => l.status === 'Pending').map(leave => (
                                            <div key={leave.id} className="p-3 border rounded bg-slate-50 mb-2">
                                                <div className="flex justify-between"><span className="font-bold text-sm">{users.find(u => u.id === leave.userId)?.nickname}</span><Badge status="Pending"/></div>
                                                <p className="text-xs text-slate-500 mt-1">{leave.startDate} - {leave.endDate} ({leave.days} Hari)</p>
                                                <div className="flex gap-2 mt-2"><button onClick={() => approveLeaveDB(leave.id, 'Approved')} className="flex-1 bg-emerald-500 text-white text-xs py-1 rounded">Lulus</button><button onClick={() => approveLeaveDB(leave.id, 'Rejected')} className="flex-1 bg-red-500 text-white text-xs py-1 rounded">Tolak</button></div>
                                            </div>
                                        ))}
                                        {leaves.filter(l => l.status === 'Pending').length === 0 && <p className="text-xs text-slate-400 italic">Tiada permohonan.</p>}
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
                            <Card className="p-6">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Send size={18} /> Permohonan Cuti</h3>
                                <form onSubmit={(e) => { e.preventDefault(); const form = e.target; submitLeaveDB({ userId: currentUser.id, startDate: form.start.value, endDate: form.end.value, reason: form.reason.value, status: 'Pending', days: 1 }); form.reset(); }} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-500">Mula</label><input name="start" type="date" required className="w-full border rounded p-2 text-sm" /></div><div><label className="text-xs font-bold text-slate-500">Tamat</label><input name="end" type="date" required className="w-full border rounded p-2 text-sm" /></div></div><div><label className="text-xs font-bold text-slate-500">Tujuan</label><textarea name="reason" rows="2" required className="w-full border rounded p-2 text-sm"></textarea></div><button className="w-full bg-slate-800 text-white py-2 rounded text-sm font-bold">Hantar</button>
                                </form>
                                <div className="mt-4 pt-4 border-t space-y-2">{leaves.filter(l => l.userId === currentUser.id).map(l => (<div key={l.id} className="flex justify-between items-center text-sm border-b pb-1"><span>{l.startDate} <span className="text-xs text-slate-400">({l.status})</span></span><button onClick={() => deleteLeaveDB(l.id)} className="text-red-500"><Trash2 size={14}/></button></div>))}</div>
                            </Card>
                            {(currentUser.role === 'super_admin' || currentUser.role === 'manager') && (
                                <div>
                                    <h3 className="font-bold text-lg text-slate-700 mb-4">Timesheet Staff</h3>
                                    <div className="space-y-4">{users.filter(u => u.role === 'staff').map(staff => (<Card key={staff.id} className="p-4"><div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700">{staff.name}</span></div>{showAdminTimesheet === staff.id ? (<div className="mt-2"><TimesheetWidget targetUserId={staff.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={toggleAttendanceDB} tsStatus={{status: 'Draft'}} updateTimesheetStatus={()=>{}} isAdminView={true} /><button onClick={() => setShowAdminTimesheet(false)} className="mt-2 w-full text-xs text-red-500 py-2 bg-red-50 rounded font-bold">Tutup</button></div>) : (<button onClick={() => setShowAdminTimesheet(staff.id)} className="w-full bg-slate-100 text-slate-600 py-2 rounded text-xs font-bold hover:bg-slate-200">Semak</button>)}</Card>))}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-md p-6"><h3 className="font-bold text-lg mb-4">Edit: {editingUser.nickname}</h3><form onSubmit={(e) => { e.preventDefault(); updateUserDB(editingUser); }} className="space-y-3"><input type="number" className="border w-full p-2 mb-2" value={editingUser.baseSalary} onChange={e => setEditingUser({...editingUser, baseSalary: Number(e.target.value)})} placeholder="Basic"/><input type="number" className="border w-full p-2 mb-2" value={editingUser.fixedAllowance} onChange={e => setEditingUser({...editingUser, fixedAllowance: Number(e.target.value)})} placeholder="Allowance"/><input type="number" className="border w-full p-2 mb-2" value={editingUser.leaveBalance} onChange={e => setEditingUser({...editingUser, leaveBalance: Number(e.target.value)})} placeholder="Leave"/><div className="flex gap-2"><button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-200 py-2 rounded">Cancel</button><button className="flex-1 bg-blue-600 text-white py-2 rounded">Save</button></div></form></Card></div>
            )}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-sm p-6"><h3 className="font-bold text-lg mb-4">Tukar Password</h3><form onSubmit={handleChangePassword} className="space-y-3"><div><label className="text-xs font-bold text-slate-500">Password Baru</label><input type="password" required className="w-full border p-2 rounded" onChange={e => setNewPasswordData({...newPasswordData, new: e.target.value})} /></div><div><label className="text-xs font-bold text-slate-500">Sahkan Password</label><input type="password" required className="w-full border p-2 rounded" onChange={e => setNewPasswordData({...newPasswordData, confirm: e.target.value})} /></div><div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 bg-slate-200 py-2 rounded">Batal</button><button className="flex-1 bg-blue-600 text-white py-2 rounded">Tukar</button></div></form></Card></div>
            )}
        </main>
    </div>
  );
}