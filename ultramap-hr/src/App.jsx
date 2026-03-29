import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { Calendar, DollarSign, FileText, CheckCircle, XCircle, Menu, X, Send, Printer, ChevronLeft, ChevronRight, Eye, EyeOff, Edit2, Save, Bell, AlertCircle, Trash2, Settings, RefreshCcw, Lock, ArrowRight, User, Info, Download, Users, Database, LogOut, Key, History, FolderOpen, Folder, ShieldCheck, MapPin } from 'lucide-react';

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

const UltramapLogo = ({ className = "h-10" }) => (
  <div className="flex justify-start">
    <img 
      src="/logo.png" 
      alt="ULTRAMAP SOLUTION" 
      className={`${className} w-auto object-contain`} 
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.parentNode.innerHTML = '<span class="font-bold text-red-600 text-2xl tracking-tighter">ULTRAMAP</span>'; 
      }}
    />
  </div>
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
  const totalEarnings = data.basicSalary + data.allowance + data.mealAllowance;
  const totalDeductions = data.epf + data.socso;
  const netPay = totalEarnings - totalDeductions;
  return (
    <div className="bg-slate-200 p-4 lg:p-8 flex justify-center overflow-auto min-h-screen print:bg-white print:p-0">
      <div className="bg-white shadow-2xl p-12 w-[297mm] h-[210mm] text-black font-sans relative print:shadow-none flex flex-col box-border">
        <div className="flex-grow pb-[70mm]">
            <div className="flex justify-between items-end mb-8 border-b-2 border-slate-800 pb-4">
              <div><UltramapLogo className="h-20" /></div> 
              <div className="text-right">
                <p className="font-bold uppercase text-xs mb-1 text-slate-500 tracking-widest uppercase">Private & Confidential</p>
                <h2 className="text-xl font-bold text-slate-800 tracking-wide uppercase">ULTRAMAP SOLUTION</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter uppercase">Monthly Salary Slip</p>
              </div>
            </div>
            <div className="flex justify-between mb-8 border-b border-slate-300 pb-6 gap-10">
                <div className="space-y-3 w-1/2">
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-bold uppercase">Name</span><span className="uppercase font-semibold">: {user.name}</span></div>
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-bold uppercase">I/C No</span><span className="font-semibold uppercase">: {user.ic}</span></div>
                </div>
                <div className="space-y-3 w-1/2 pl-8 border-l border-dashed border-slate-200">
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-bold uppercase">Job Title</span><span className="uppercase font-semibold">: {user.position}</span></div>
                    <div className="flex items-center text-sm"><span className="text-slate-500 w-32 font-bold uppercase">Payslip For</span><span className="uppercase font-semibold">: {data.month}</span></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-16 mb-4 h-[250px]">
              <div>
                <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase text-sm text-slate-700">Earnings (RM)</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>BASIC SALARY</span><span className="font-semibold">{data.basicSalary.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>ALLOWANCE</span><span className="font-semibold">{data.allowance.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>MEAL ALLOWANCE</span><span className="font-semibold">{data.mealAllowance.toFixed(2)}</span></div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-base mt-4 text-slate-900 uppercase"><span>TOTAL EARNINGS</span><span>{totalEarnings.toFixed(2)}</span></div>
              </div>
              <div className="pl-8 border-l border-dashed border-slate-200">
                <div className="border-b-2 border-slate-800 pb-2 mb-4 font-bold uppercase text-sm text-slate-700">Deduction (RM)</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>EPF (KWSP)</span><span className="text-red-600 font-semibold">{data.epf.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>SOCSO (PERKESO)</span><span className="text-red-600 font-semibold">{data.socso.toFixed(2)}</span></div>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-base mt-auto text-slate-600 uppercase"><span>TOTAL DEDUCTION</span><span>{totalDeductions.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="bg-slate-100 border-y-4 border-slate-800 py-5 px-8 flex justify-between items-center mt-4">
              <span className="font-bold text-lg uppercase tracking-widest text-slate-700">NET PAY</span>
              <span className="font-bold text-2xl text-slate-900">RM {netPay.toFixed(2)}</span>
            </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center px-12">
            <div className="border-t border-slate-200 pt-3 text-center">
                <p className="text-[10px] text-slate-400 leading-tight italic uppercase">This monthly salary slip is electronically generated and does not require any signature.</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase">ULTRAMAP SOLUTION (JM0876813-V)</p>
            </div>
        </div>
        <div className="absolute top-4 right-4 print:hidden"><button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"><Printer size={20} /> Cetak / Simpan PDF</button></div>
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
        else if (!isAdminView) { alert("Hanya bulan semasa sahaja."); }
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
        if (clickedDate.getDay() === 0 && !window.confirm("Hari ini Ahad. Confirm kerja Site?")) return;
        setSelectedDayInfo({ day, dateStr });
        setTempRemark("");
        setIsRemarkModalOpen(true);
    }
  };

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
              <span className="text-[10px] font-bold px-3 text-slate-600 uppercase min-w-[80px] text-center">{getMonthStr(displayDate)}</span>
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
        <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: new Date(displayYear, displayMonth, 1).getDay() }).map((_, i) => <div key={`e-${i}`}></div>)}
            {Array.from({ length: lastDayOfDispMonth }, (_, i) => i + 1).map(day => {
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
            <div><p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Jumlah Hari Kerja</p><p className="text-xl font-bold text-emerald-600 tracking-tight uppercase">{attendance.filter(a => { const d = new Date(a.date); return a.userId === targetUserId && d.getMonth() === displayMonth && d.getFullYear() === displayYear; }).length} Hari</p></div>
            {!isAdminView && (tsStatus.status === 'Draft' || tsStatus.status === 'Rejected') && swipeIndex === 0 && (
                <button disabled={!isSubmissionOpen} onClick={() => updateTimesheetStatus(targetUserId, 'Submitted')} className={`px-4 py-2 rounded font-bold text-xs shadow-lg uppercase tracking-widest transition-all ${isSubmissionOpen ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                    {isSubmissionOpen ? "Hantar untuk Semakan" : `Hantar (${effectiveCutoff}hb)`}
                </button>
            )}
        </div>
      </div>
      {isRemarkModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
                  <div className="flex justify-between items-start mb-4">
                      <div><h4 className="font-bold text-slate-800 text-lg uppercase">Nota Kehadiran</h4><p className="text-xs text-slate-500">{selectedDayInfo?.day}hb {getMonthStr(displayDate)}</p></div>
                      <button onClick={() => setIsRemarkModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
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

// --- MAIN APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
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

  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        onSnapshot(query(collection(db, "users"), where("email", "==", user.email)), (s) => { if (!s.empty) setCurrentUser({ ...s.docs[0].data(), id: s.docs[0].id }); });
      } else setCurrentUser(null);
    });
    // PASTIKAN RULES FIRESTORE DIBUKA UNTUK KOLEKSI-KOLEKSI INI
    onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "attendance"), (s) => setAttendance(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "leaves"), (s) => setLeaves(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(collection(db, "timesheets"), (s) => setTimesheets(s.docs.map(d => ({...d.data(), id: d.id}))));
    onSnapshot(doc(db, "settings", "global"), (s) => { if(s.exists()) setSettings(s.data()); });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { alert("Gagal Log Masuk!"); } };
  
  const updateTimesheetStatusDB = async (userId, status) => {
      const today = new Date();
      const mStr = (today.getDate() <= 5 ? new Date(today.getFullYear(), today.getMonth() - 1, 1) : today).toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase();
      const existing = timesheets.find(t => t.userId === userId && t.month === mStr);
      if (existing) { await updateDoc(doc(db, "timesheets", existing.id), { status, approvedBy: status === 'Approved' ? currentUser.nickname : null }); } 
      else { await addDoc(collection(db, "timesheets"), { userId, month: mStr, status, approvedBy: status === 'Approved' ? currentUser.nickname : null }); }
  };

  const calculatePayroll = (userId, forMonthDate = currentDate) => {
    const user = users.find(u => u.id === userId);
    if (!user) return {};
    const epf = user.customEpf ?? (user.baseSalary * 0.11);
    const socso = user.customSocso ?? (user.baseSalary * 0.005 + 5);
    const siteDays = attendance.filter(a => { const d = new Date(a.date); return a.userId === userId && d.getMonth() === forMonthDate.getMonth() && d.getFullYear() === forMonthDate.getFullYear(); }).length;
    const meal = user.role === 'staff' ? siteDays * 15 : 0;
    return { month: forMonthDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase(), basicSalary: user.baseSalary, allowance: user.fixedAllowance, mealAllowance: meal, epf, socso, netPay: (user.baseSalary + user.fixedAllowance + meal - epf - socso) };
  };

  const lastDayOfMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const effectiveCutoff = settings.customSubmissionDate || lastDayOfMonthDate;
  const isCutoffReached = currentDate.getDate() >= effectiveCutoff;

  if (!currentUser) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans"><Card className="w-full max-w-sm p-8 shadow-2xl"><div className="flex justify-center mb-6"><UltramapLogo /></div><form onSubmit={handleLogin} className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded outline-none" required /></div><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded outline-none" required /></div><button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold uppercase tracking-widest text-sm shadow-md">Masuk</button></form></Card></div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
        <nav className="bg-white border-b sticky top-0 z-20 px-4 h-16 flex items-center justify-between shadow-sm print:hidden">
            <UltramapLogo /><button onClick={() => signOut(auth)} className="text-xs bg-slate-200 px-3 py-1 rounded font-bold uppercase tracking-widest hover:bg-slate-300">Keluar</button>
        </nav>
        <main className="max-w-7xl mx-auto p-4 lg:p-8">
            {viewedPayslip ? (
                <div><button onClick={() => setViewedPayslip(null)} className="mb-4 flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-slate-800"><ChevronLeft size={16} /> Kembali</button><PayslipDesign data={viewedPayslip.data} user={viewedPayslip.user} /></div>
            ) : (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-widest border-b-2 border-blue-600 inline-block uppercase">Hi! {currentUser.nickname}!</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 rounded-xl p-5 text-white shadow-lg relative">
                            <div className="flex justify-between items-start"><p className="text-slate-400 text-xs mb-1 uppercase tracking-widest">Anggaran Gaji</p><button onClick={() => setHideSalary(!hideSalary)} className="text-slate-400 hover:text-white transition-colors">{hideSalary ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
                            <h2 className="text-2xl lg:text-3xl font-bold mt-1">{hideSalary ? 'RM ****' : `RM ${calculatePayroll(currentUser.id).netPay?.toFixed(2)}`}</h2>
                            <button onClick={() => setViewedPayslip({ data: calculatePayroll(currentUser.id), user: currentUser })} className="bg-white/20 py-1 px-3 rounded text-[10px] font-bold mt-2 uppercase tracking-widest hover:bg-white/30">Slip Gaji</button>
                        </div>
                        <div className="bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-center"><p className="text-slate-500 text-xs mb-1 uppercase tracking-widest">Baki Cuti</p><h2 className="text-3xl font-bold text-slate-800">{(users.find(u=>u.id===currentUser.id)?.leaveBalance || 14) - leaves.filter(l=>l.userId===currentUser.id && l.status==='Approved').reduce((acc,curr)=>acc+(curr.days||0),0)} Hari</h2></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {currentUser.role !== 'staff' ? (
                                <>
                                    <Card className="p-6 border-l-4 border-l-blue-600 shadow-sm"><h3 className="font-bold text-lg mb-1 flex items-center gap-2 uppercase tracking-widest text-sm"><Settings size={20}/> Tetapan Cutoff</h3><p className="text-[10px] text-slate-400 mb-4 italic uppercase">Biarkan 0 jika ikut tarikh akhir bulan.</p><input type="number" placeholder="Bulan" value={settings.customSubmissionDate || ''} onChange={(e) => updateDoc(doc(db, "settings", "global"), { customSubmissionDate: e.target.value ? Number(e.target.value) : null })} className="w-20 border rounded p-1 font-bold text-lg text-center focus:ring-2 focus:ring-blue-400 outline-none" /></Card>
                                    <Card className="p-6 shadow-sm"><h3 className="font-bold text-lg mb-4 flex items-center gap-2 uppercase tracking-widest text-sm"><Edit2 size={20}/> Tetapan Gaji & Cuti</h3><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase"><tr><th className="p-2 text-[10px]">Nama</th><th className="p-2 text-[10px]">Basic</th><th className="p-2 text-[10px]">Elaun</th><th className="p-2 text-[10px] text-center">Cuti</th><th className="p-2 text-[10px]">Edit</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b font-sans hover:bg-slate-50"><td className="p-2 font-bold uppercase">{u.nickname}</td><td className="p-2">{u.baseSalary?.toFixed(2)}</td><td className="p-2">{u.fixedAllowance?.toFixed(2)}</td><td className="p-2 text-center">{u.leaveBalance}</td><td><button onClick={() => setEditingUser(u)} className="text-blue-600 underline font-bold uppercase text-[10px] hover:text-blue-800">Edit</button></td></tr>))}</tbody></table></Card>
                                </>
                            ) : (
                                <TimesheetWidget targetUserId={currentUser.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={(dateStr, userId, type, shouldDelete, remark) => { const existing = attendance.find(a => a.date === dateStr && a.userId === userId); if (shouldDelete && existing) deleteDoc(doc(db, "attendance", existing.id)); else if (existing) updateDoc(doc(db, "attendance", existing.id), { remark }); else addDoc(collection(db, "attendance"), { date: dateStr, userId, type, remark }); }} tsStatus={timesheets.find(t => t.userId === currentUser.id && t.month === currentDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase()) || { status: 'Draft' }} updateTimesheetStatus={updateTimesheetStatusDB} isAdminView={false} />
                            )}
                            <Card className="p-6 shadow-sm"><h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm"><Send size={18} /> Permohonan Cuti</h3><form onSubmit={(e)=>{e.preventDefault(); const f=e.target; addDoc(collection(db,'leaves'),{userId:currentUser.id,startDate:f.s.value,endDate:f.e.value,reason:f.r.value,status:'Pending',days:calculateLeaveDuration(f.s.value, f.e.value)}); f.reset(); alert("Permohonan dihantar!");}} className="space-y-3"><div className="grid grid-cols-2 gap-2"><input name="s" type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none" required/><input name="e" type="date" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none" required/></div><input name="r" placeholder="Sebab Cuti" className="border p-2 rounded w-full focus:ring-2 focus:ring-slate-400 outline-none" required/><button className="bg-slate-800 text-white w-full py-3 rounded font-bold uppercase text-xs shadow-md">Hantar Permohonan</button></form></Card>
                        </div>
                        <div className="space-y-6">
                            {currentUser.role !== 'staff' && (
                                <>
                                    <div><h3 className="font-bold text-lg text-slate-700 mb-4 uppercase tracking-widest text-sm">Panel Timesheet Staff</h3><div className="space-y-4">{users.filter(u => u.role === 'staff').map(staff => {
                                        const ts = timesheets.find(t => t.userId === staff.id && t.month === currentDate.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' }).toUpperCase()) || { status: 'Draft' };
                                        return (<Card key={staff.id} className="p-4 shadow-sm"><div className="flex justify-between items-center mb-2"><span className="font-bold text-slate-700 uppercase">{staff.name}</span><Badge status={ts.status} /></div>{showAdminTimesheet === staff.id ? (
                                            <div className="mt-2 space-y-2">
                                                <TimesheetWidget targetUserId={staff.id} currentDate={currentDate} customSubmissionDate={settings.customSubmissionDate} attendance={attendance} setAttendance={()=>{}} tsStatus={ts} updateTimesheetStatus={updateTimesheetStatusDB} isAdminView={true} />
                                                <div className="flex gap-2"><button onClick={() => setShowAdminTimesheet(false)} className="flex-1 text-xs text-red-500 font-bold py-2 bg-red-50 rounded uppercase transition-all">Tutup</button>{ts.status === 'Approved' ? (<button onClick={() => updateTimesheetStatusDB(staff.id, 'Draft')} className="flex-1 text-xs text-white font-bold py-2 bg-orange-500 rounded uppercase shadow-sm">Buka Semula (Draft)</button>) : (<button disabled={!isCutoffReached} onClick={() => updateTimesheetStatusDB(staff.id, 'Approved')} className={`flex-1 text-xs text-white font-bold py-2 rounded uppercase shadow-sm transition-all ${isCutoffReached ? 'bg-emerald-600' : 'bg-slate-300'}`}>{isCutoffReached ? "Luluskan" : `Lulus (Hanya ${effectiveCutoff}hb)`}</button>)}</div>
                                            </div>
                                        ) : (<button onClick={() => setShowAdminTimesheet(staff.id)} className="w-full bg-slate-100 py-2 rounded text-xs font-bold uppercase hover:bg-slate-200">Semak & Luluskan</button>)}</Card>);
                                    })}</div></div>
                                    <Card className="p-6 shadow-sm"><h3 className="font-bold mb-4 uppercase text-sm tracking-widest border-b pb-2">Pengesahan Cuti (Admin)</h3>{leaves.filter(l=>l.status==='Pending').map(leave=>(<div key={leave.id} className="p-3 border rounded mb-2 flex justify-between items-center bg-slate-50 hover:border-emerald-200 transition-all"><div className="text-xs uppercase font-bold">{users.find(u=>u.id===leave.userId)?.nickname}: {leave.startDate}</div><button onClick={()=>updateDoc(doc(db, "leaves", leave.id), { status: 'Approved', approvedBy: currentUser.nickname })} className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-bold shadow-sm hover:bg-emerald-700 transition-colors">Lulus</button></div>))}{leaves.filter(l=>l.status==='Pending').length === 0 && <p className="text-xs text-slate-400 italic">Tiada permohonan baru.</p>}<LeaveHistoryViewer users={users} leaves={leaves} /></Card>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><Card className="w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200"><h3 className="font-bold mb-4 text-xl border-b pb-2 uppercase tracking-widest">Edit: {editingUser.nickname}</h3><form onSubmit={async (e)=>{e.preventDefault(); await updateDoc(doc(db, "users", editingUser.id), { baseSalary: editingUser.baseSalary, fixedAllowance: editingUser.fixedAllowance, customEpf: editingUser.customEpf, customSocso: editingUser.customSocso, leaveBalance: editingUser.leaveBalance }); setEditingUser(null); alert("Berjaya disimpan!");}} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Gaji Pokok (RM)</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={editingUser.baseSalary} onChange={e=>setEditingUser({...editingUser, baseSalary: Number(e.target.value)})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Elaun Tetap (RM)</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={editingUser.fixedAllowance} onChange={e=>setEditingUser({...editingUser, fixedAllowance: Number(e.target.value)})} /></div>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs font-bold text-slate-400 uppercase">KWSP Manual</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={editingUser.customEpf || ''} onChange={e=>setEditingUser({...editingUser, customEpf: e.target.value ? Number(e.target.value) : null})} /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase">SOCSO Manual</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={editingUser.customSocso || ''} onChange={e=>setEditingUser({...editingUser, customSocso: e.target.value ? Number(e.target.value) : null})} /></div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Cuti (Hari)</label><input type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none transition-all" value={editingUser.leaveBalance} onChange={e=>setEditingUser({...editingUser, leaveBalance: Number(e.target.value)})} /></div>
                    <div className="flex gap-2 pt-4"><button type="button" onClick={()=>setEditingUser(null)} className="flex-1 bg-slate-100 p-2 rounded font-bold uppercase text-xs hover:bg-slate-200">Batal</button><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold uppercase text-xs shadow-md shadow-blue-200 hover:bg-blue-700">Simpan</button></div>
                </form></Card></div>
            )}
        </main>
    </div>
  );
}
