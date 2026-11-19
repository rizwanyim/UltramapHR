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
