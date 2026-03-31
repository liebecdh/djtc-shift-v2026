import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  Save,
  MapPin,
  Clock,
  X,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  FileText,
  Brush,
  Sun,
  Moon,
  Home,
  Coffee,
  Trash2,
  Key,
  Bell,
} from 'lucide-react';

// [🚨 중요] 본인의 Firebase 설정값
const firebaseConfig = {
  apiKey: 'AIzaSyBKuKbTyQJwEwfsnMQni2X7hiZnS09oiF4',
  authDomain: 'dhfc-shift.firebaseapp.com',
  projectId: 'dhfc-shift',
  storageBucket: 'dhfc-shift.firebasestorage.app',
  messagingSenderId: '182895450339',
  appId: '1:182895450339:web:5e5b03916e7233fdbf0dd6',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId =
  typeof __app_id !== 'undefined' ? __app_id : 'daejeon-shift-pro-test-sandbox';
const STORAGE_KEY = 'TEST_SANDBOX_USER_V308_04';

// 공휴일 데이터
const getHolidays = (y) => {
  const h = {};
  h[`${y}-1-1`] = '신정';
  h[`${y}-3-1`] = '삼일절';
  h[`${y}-5-5`] = '어린이날';
  h[`${y}-6-6`] = '현충일';
  h[`${y}-7-17`] = '제헌절';
  h[`${y}-8-15`] = '광복절';
  h[`${y}-10-3`] = '개천절';
  h[`${y}-10-9`] = '한글날';
  h[`${y}-12-25`] = '성탄절';
  const lunarData = {
    2026: { seol: '2-17', buddha: '5-24', chu: '9-25' },
    2027: { seol: '2-6', buddha: '5-13', chu: '9-15' },
    2028: { seol: '1-26', buddha: '5-2', chu: '10-3' },
    2029: { seol: '2-13', buddha: '5-20', chu: '9-22' },
    2030: { seol: '2-3', buddha: '5-9', chu: '9-12' },
  };
  if (lunarData[y]) {
    const { seol, buddha, chu } = lunarData[y];
    const sDate = new Date(`${y}-${seol}`);
    h[`${y}-${sDate.getMonth() + 1}-${sDate.getDate() - 1}`] = '설연휴';
    h[`${y}-${sDate.getMonth() + 1}-${sDate.getDate()}`] = '설날';
    h[`${y}-${sDate.getMonth() + 1}-${sDate.getDate() + 1}`] = '설연휴';
    h[`${y}-${buddha}`] = '부처님오신날';
    const cDate = new Date(`${y}-${chu}`);
    h[`${y}-${cDate.getMonth() + 1}-${cDate.getDate() - 1}`] = '추석연휴';
    h[`${y}-${cDate.getMonth() + 1}-${cDate.getDate()}`] = '추석';
    h[`${y}-${cDate.getMonth() + 1}-${cDate.getDate() + 1}`] = '추석연휴';
  }
  const checkAltHoliday = (dateStr) => {
    const dObj = new Date(dateStr);
    const day = dObj.getDay();
    if (day === 0 || day === 6) {
      let nextDay = new Date(dObj);
      nextDay.setDate(nextDay.getDate() + (day === 6 ? 2 : 1));
      while (
        h[
          `${nextDay.getFullYear()}-${
            nextDay.getMonth() + 1
          }-${nextDay.getDate()}`
        ]
      ) {
        nextDay.setDate(nextDay.getDate() + 1);
      }
      h[
        `${nextDay.getFullYear()}-${
          nextDay.getMonth() + 1
        }-${nextDay.getDate()}`
      ] = '대체공휴일';
    }
  };
  checkAltHoliday(`${y}-3-1`);
  checkAltHoliday(`${y}-5-5`);
  checkAltHoliday(`${y}-8-15`);
  checkAltHoliday(`${y}-10-3`);
  checkAltHoliday(`${y}-10-9`);
  checkAltHoliday(`${y}-12-25`);
  if (lunarData[y]) checkAltHoliday(`${y}-${lunarData[y].buddha}`);
  return h;
};

const formatPopupDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m - 1, d);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${
      months[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

const formatHolidayText = (name) => {
  if (!name) return [];
  if (name === '대체공휴일') return ['대체', '공휴일'];
  if (name === '추석연휴') return ['추석', '연휴'];
  if (name === '설연휴') return ['설연휴'];
  if (name === '부처님오신날') return ['부처님', '오신날'];
  return [name];
};

const GGUMDORI_URL =
  'https://raw.githubusercontent.com/liebecdh/ggumdori/d3fae1262ef50794739cd6b9bf8c6862aea6512d/IMG_4504.png';

export default function App() {
  const [isTailwindLoaded, setIsTailwindLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // 🚨 1. 상단 색상 동기화
  useEffect(() => {
    const bgColor = showSplash ? '#1a050a' : '#0a0c10';
    document.body.style.backgroundColor = bgColor;
    document.body.style.transition = 'background-color 0.5s ease-in-out';
    
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", bgColor);
    }
  }, [showSplash]);

  useEffect(() => {
    if (window.tailwind) {
      setIsTailwindLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.tailwindcss.com';
    script.onload = () => setIsTailwindLoaded(true);
    document.head.appendChild(script);
  }, []);

  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isMinLoadingTimeDone, setIsMinLoadingTimeDone] = useState(false);
  const [splashDotCount, setSplashDotCount] = useState(0); 
  const [masterData, setMasterData] = useState({ schedules: {}, editPassword: "1234" });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [familyKey, setFamilyKey] = useState("");
  const [editPass, setEditPass] = useState("");
  const [newPass, setNewPass] = useState(""); 
  const [showPwdChange, setShowPwdChange] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); 
  const [viewModal, setViewModal] = useState({ isOpen: false, memo: null, dateKey: null });
  const [modalState, setModalState] = useState({ isOpen: false, type: null, dateKey: null, data: {} });
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [drawMode, setDrawMode] = useState(null); 
  const [showSettings, setShowSettings] = useState(false);
  const [showShiftMenu, setShowShiftMenu] = useState(false);
  const [showNightMenu, setShowNightMenu] = useState(false); 
  const [scheduleHistory, setScheduleHistory] = useState([]); 
  const [redoHistory, setRedoHistory] = useState([]); 
  const [loadedScheduleText, setLoadedScheduleText] = useState("");

  const syncUnsub = useRef(null);
  const touchStart = useRef({ x: null, y: null, time: null });
  const touchEnd = useRef({ x: null, y: null });
  const [toast, setToast] = useState(null);

  const buttonRefs = useRef({});
  const prevIndRef = useRef({ left: 0, width: 0 }); 
  const toolbarScrollRef = useRef(null);
  
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, scale: 1, opacity: 0, transition: 'none' });
  const [pressedKey, setPressedKey] = useState(null); 
  const [animTrigger, setAnimTrigger] = useState(0); 
  const activeKey = showShiftMenu ? 'shift' : (showNightMenu ? 'night' : drawMode);

  const showToast = (message) => { setToast(message); setTimeout(() => setToast(null), 2500); };

  const monthlyWorkCount = useMemo(() => {
    let dayCount = 0; let nightCount = 0; let dutyCount = 0;
    const year = currentDate.getFullYear(); const month = currentDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`;
      if (masterData.schedules && masterData.schedules[key]) {
        if (masterData.schedules[key].type === 'day') dayCount++;
        if (masterData.schedules[key].type === 'night') nightCount++;
        if (masterData.schedules[key].type === 'night_duty') {
          nightCount++; 
          dutyCount++;
        }
      }
    }
    return { day: dayCount, night: nightCount, duty: dutyCount };
  }, [currentDate, masterData.schedules]);

  const currentYear = currentDate.getFullYear();
  const cachedHolidays = useMemo(() => {
    return { ...getHolidays(currentYear - 1), ...getHolidays(currentYear), ...getHolidays(currentYear + 1) };
  }, [currentYear]);

  useEffect(() => {
    let interval;
    if (showSplash) { interval = setInterval(() => { setSplashDotCount(prev => (prev + 1) % 4); }, 400); }
    return () => clearInterval(interval);
  }, [showSplash]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
             await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenError) {
             console.warn("Token auth failed, falling back to anonymous auth");
             await signInAnonymously(auth);
          }
        } 
        else { await signInAnonymously(auth); }
      } catch (e) {
        console.error("Auth error:", e);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => { 
      if (u) { 
        setUser(u); 
        setIsAuthReady(true); 
      } 
    });
    const timer = setTimeout(() => {
      setIsMinLoadingTimeDone(true);
      setTimeout(() => setShowSplash(false), 500);
    }, 3500); 
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const connectServer = async (targetKey, inputPass, isAuto = false) => {
    const key = targetKey || familyKey.trim();
    const pass = inputPass || editPass;

    if (!key) { if (!isAuto) showToast("🟡 공유코드 입력 필요"); return; }
    if (!pass) { if (!isAuto) showToast("🟡 비밀번호 입력 필요"); return; }
    if (!user) { if (!isAuto) showToast("🔴 서버 연결 준비중..."); return; }

    if (syncUnsub.current) syncUnsub.current();
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'userSchedules_v305', key);

    syncUnsub.current = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data().content;
        if (data.editPassword === pass) {
          if (!data.schedules) data.schedules = {};
          setMasterData(data);
          setIsAuthenticated(true);
          if (!isAuto) showToast("🟢 접속 성공");
          if (!isAuto) setShowSettings(false);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, pass }));
        } else {
          if (!isAuto) showToast("🔴 비밀번호가 틀립니다");
          setIsAuthenticated(false);
          setShowSettings(true);
          localStorage.removeItem(STORAGE_KEY);
          if (syncUnsub.current) syncUnsub.current();
        }
      } else {
        const newData = { schedules: {}, editPassword: pass };
        setMasterData(newData);
        setIsAuthenticated(true);
        if (!isAuto) showToast("🟢 새 달력 생성됨");
        if (!isAuto) setShowSettings(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, pass }));
        setDoc(docRef, { content: newData, updatedAt: new Date().toISOString() });
      }
    }, (error) => { if (!isAuto) showToast("🔴 네트워크 확인 필요"); });
  };

  useEffect(() => {
    if (isAuthReady && user) {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && saved.key && saved.pass) {
          setFamilyKey(saved.key);
          setEditPass(saved.pass);
          connectServer(saved.key, saved.pass, true);
        } else {
          setShowSettings(true); 
        }
      } catch (e) {
        setShowSettings(true);
      }
    }
  }, [isAuthReady, user]);

  useEffect(() => {
    let timeoutId1, timeoutId2;
    const targetKey = pressedKey || activeKey;
    const trackKey = (targetKey === 'night_duty' || targetKey === 'night_choice') ? 'night' : targetKey;

    if (isEditing && trackKey && buttonRefs.current && buttonRefs.current[trackKey]) {
      const el = buttonRefs.current[trackKey];
      const targetLeft = el.offsetLeft;
      const targetWidth = el.offsetWidth;
      const currentLeft = prevIndRef.current.left;
      const dist = Math.abs(targetLeft - currentLeft);
      const isMoving = currentLeft !== 0 && dist > 0;
      const duration = Math.min(0.2 + (dist / 400) * 0.2, 0.4);

      if (pressedKey) {
        if (isMoving) {
          setIndicatorStyle({
            left: targetLeft > currentLeft ? currentLeft : targetLeft, 
            width: dist + targetWidth,
            scale: 0.95, opacity: 1, 
            transition: `left ${duration}s cubic-bezier(0.22, 1, 0.36, 1), width ${duration}s cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}s ease`
          });
          timeoutId1 = setTimeout(() => {
            if (pressedKey) {
              setIndicatorStyle({
                left: targetLeft, width: targetWidth, scale: 1.5, opacity: 1,
                transition: `left 0.2s ease-out, width 0.2s ease-out, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)`
              });
              timeoutId2 = setTimeout(() => {
                setIndicatorStyle({ left: targetLeft, width: targetWidth, scale: 1, opacity: 1, transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` });
              }, 150);
            }
          }, duration * 1000);
        } else {
          setIndicatorStyle({ left: targetLeft, width: targetWidth, scale: 1.5, opacity: 1, transition: `transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)` });
          timeoutId1 = setTimeout(() => {
             setIndicatorStyle({ left: targetLeft, width: targetWidth, scale: 1, opacity: 1, transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` });
          }, 150);
        }
      } else {
        setIndicatorStyle({
          left: targetLeft, width: targetWidth, scale: 1, opacity: 1,
          transition: `left ${duration}s cubic-bezier(0.22, 1, 0.36, 1), width ${duration}s cubic-bezier(0.22, 1, 0.36, 1), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`
        });
      }
      prevIndRef.current = { left: targetLeft, width: targetWidth };
    } else {
      setIndicatorStyle({ left: 0, width: 0, scale: 1, opacity: 0, transition: 'none' }); 
      prevIndRef.current = { left: 0, width: 0 };
    }
    return () => { clearTimeout(timeoutId1); clearTimeout(timeoutId2); };
  }, [pressedKey, activeKey, isEditing, animTrigger]);

  const onTouchStart = (e) => { touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY, time: Date.now() }; touchEnd.current = { x: null, y: null }; };
  const onTouchMove = (e) => { touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY }; };
  const onTouchEnd = () => {
    if (touchStart.current.x === null || touchEnd.current.x === null) { touchStart.current = { x: null, y: null, time: null }; return; }
    const deltaX = touchStart.current.x - touchEnd.current.x; const deltaY = touchStart.current.y - touchEnd.current.y;
    const duration = Date.now() - touchStart.current.time;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && duration < 500) {
      const direction = deltaX > 0 ? 1 : -1;
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    }
    touchStart.current = { x: null, y: null, time: null }; touchEnd.current = { x: null, y: null };
  };

  const saveToHistory = () => {
    setScheduleHistory(prev => [...prev, JSON.parse(JSON.stringify({ schedules: masterData.schedules || {} }))].slice(-10));
    setRedoHistory([]); 
  };

  const handleUndo = () => {
    if (scheduleHistory.length === 0) return;
    const newHistory = [...scheduleHistory]; const previousState = newHistory.pop();
    setRedoHistory(prev => [...prev, JSON.parse(JSON.stringify({ schedules: masterData.schedules || {} }))].slice(-10));
    setScheduleHistory(newHistory); setMasterData(prev => ({ ...prev, schedules: previousState.schedules }));
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const newRedo = [...redoHistory]; const nextState = newRedo.pop();
    setScheduleHistory(prev => [...prev, JSON.parse(JSON.stringify({ schedules: masterData.schedules || {} }))].slice(-10));
    setRedoHistory(newRedo); setMasterData(prev => ({ ...prev, schedules: nextState.schedules }));
  };

  const applyPattern = (group) => {
    if (!isEditing) return;
    saveToHistory();
    const pat = ['day','day','day','day','day','day','day', 'night', 'off', 'night', 'off', 'night', 'off', 'night', 'off', 'night', 'off', 'night', 'off', 'night', 'off'];
    const newScheds = JSON.parse(JSON.stringify(masterData.schedules || {}));
    const baseDate = new Date(2026, 2, 9, 0, 0, 0); 
    let offset = group === 'eul' ? 0 : (group === 'gap' ? 14 : 7);
    let startDate; let endDate;
    if (selectedDayKey && drawMode === 'shift') {
      const [y, m, d] = selectedDayKey.split('-').map(Number);
      startDate = new Date(y, m - 1, d, 0, 0, 0); endDate = new Date(y + 5, 11, 31, 0, 0, 0);
    } else { startDate = new Date(2026, 0, 1, 0, 0, 0); endDate = new Date(2030, 11, 31, 0, 0, 0); }
    const totalDaysToApply = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    for (let i = 0; i < totalDaysToApply; i++) {
      let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i, 0, 0, 0);
      let diffDays = Math.round((d - baseDate) / (1000 * 60 * 60 * 24));
      let patternIdx = ((diffDays + offset) % 21 + 21) % 21;
      let k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      newScheds[k] = { ...newScheds[k], type: pat[patternIdx] };
    }
    setMasterData(prev => ({ ...prev, schedules: newScheds }));
    setSelectedDayKey(null); setShowShiftMenu(false); setDrawMode(null); showToast("🟢 근무조 반영 완료");
  };

  const maps = { 
    'day': { i: <Sun size={20}/>, l: 'DAY', tc: 'text-[#F59E0B]' }, 
    'night': { i: <Moon size={20}/>, l: 'NIGHT', tc: 'text-indigo-400' }, 
    'night_duty': { i: <Moon size={20}/>, l: 'NIGHT', tc: 'text-indigo-400' }, 
    'off': { i: <Home size={20}/>, l: 'OFF', tc: 'text-teal-400' }, 
    'holiday': { i: <Coffee size={20}/>, l: 'REST', tc: 'text-rose-400' }, 
    'schedule': { i: <Calendar size={20}/>, l: 'PLAN', tc: 'text-sky-400' }, 
    'memo': { i: <FileText size={20}/>, l: 'MEMO', tc: 'text-fuchsia-400' }, 
    'erase': { i: <Brush size={20}/>, l: 'DEL', tc: 'text-red-500' },
  };

  const renderDayCell = (d, monthType) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth() + (monthType === 'prev' ? -1 : monthType === 'next' ? 1 : 0);
    const dateObj = new Date(year, month, d); const key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
    const s = masterData.schedules?.[key] || {};
    
    const holName = cachedHolidays[key]; const isToday = new Date().toDateString() === dateObj.toDateString();
    const isSelected = selectedDayKey === key;
    
    const dateColor = dateObj.getDay() === 0 || holName ? 'text-[#e55a5a]' : dateObj.getDay() === 6 ? 'text-[#5a8be5]' : 'text-slate-400';
    const bgClass = isSelected ? 'bg-[#2a2a2c]/80 border border-[#60a5fa]/50 scale-[1.02]' : 'bg-[#1c1c1e]/60 border border-white/5';
    
    return (
      <div key={`${monthType}-${d}`} onClick={() => {
          if (isEditing) {
            // 🚨 3. SHIFT 모드일 때는 날짜를 눌러도 툴바가 안 닫히게 수정
            if (drawMode !== 'shift' && showShiftMenu) setShowShiftMenu(false);
            if (drawMode !== 'night' && showNightMenu) setShowNightMenu(false);

            if (!drawMode) return; 
            if (drawMode === 'shift') { 
              // 🚨 3. 이미 선택된 날짜를 한 번 더 누르면 선택 해제 (토글 방식)
              setSelectedDayKey(prev => prev === key ? null : key); 
              return; 
            }
            if (drawMode === 'memo') { setModalState({ isOpen: true, type: 'memo', dateKey: key, data: { text: s.memo || '' } }); return; }
            if (drawMode === 'erase') { saveToHistory(); const newData = JSON.parse(JSON.stringify(masterData)); if (newData.schedules[key]?.memo) delete newData.schedules[key].memo; setMasterData(newData); } 
            else if (['day', 'night', 'night_duty', 'off', 'holiday', 'schedule'].includes(drawMode)) { 
              saveToHistory(); const newData = JSON.parse(JSON.stringify(masterData)); if(!newData.schedules[key]) newData.schedules[key] = {}; newData.schedules[key].type = drawMode; if (drawMode === 'schedule') { newData.schedules[key].text = loadedScheduleText; } setMasterData(newData); 
            }
          } else { if (s.memo) setViewModal({ isOpen: true, memo: s.memo, dateKey: key }); }
        }} 
        className={`flex-1 h-[105px] mx-[2px] rounded-[1.1rem] relative flex flex-col shadow-sm cursor-pointer overflow-hidden ${bgClass} ${monthType !== 'current' ? 'opacity-40' : ''} active:scale-[0.92] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none`}
        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
        <div className="w-full flex justify-between items-start px-2 pt-1.5 shrink-0 h-[22px]" style={{ pointerEvents: 'none' }}>
          <span className={`text-[11px] font-black ${dateColor}`}>{d}</span>
          {holName && (<div className="flex flex-col items-end leading-[9px] text-right">{formatHolidayText(holName).map((line, idx) => (<span key={idx} className="text-[7px] font-black text-[#e55a5a] whitespace-nowrap">{line}</span>))}</div>)}
        </div>
        <div className="w-full h-[22px] flex justify-center items-center shrink-0" style={{ pointerEvents: 'none' }}>
          {s.type && <div className={`${maps[s.type]?.tc} drop-shadow-sm scale-[0.85]`}>{maps[s.type]?.i}</div>}
        </div>
        
        <div className="flex-1 w-full flex flex-col px-0.5 pb-[4px]" style={{ pointerEvents: 'none' }}>
          <div className="w-full h-[18px] flex items-start justify-center overflow-hidden shrink-0">
            {s.type === 'schedule' && s.text && <div className="w-[92%] mx-auto text-[8px] font-black py-[2px] rounded-full text-center bg-cyan-900/40 text-cyan-400 border-[0.5px] border-cyan-500/30 truncate">{s.text}</div>}
            {s.type === 'night_duty' && <div className="w-[92%] mx-auto text-[8px] font-black py-[2px] rounded-full text-center bg-[#2e1065]/40 border-[0.5px] border-[#4c1d95]/70 text-[#c4b5fd] truncate">당직</div>}
          </div>
          
          <div className="w-full h-[10px] shrink-0"></div>
          
          <div className="w-full flex-1 flex items-start justify-center overflow-hidden min-h-[20px]">
            {s.memo && <div className="w-[92%] mx-auto text-[8px] font-black py-[2px] rounded-full text-center bg-indigo-500/20 border-[0.5px] border-indigo-400/30 text-indigo-300 truncate shadow-sm">{s.memo}</div>}
          </div>
        </div>
        
        {isToday && <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_6px_rgba(212,175,55,0.8)]" style={{ pointerEvents: 'none' }}></div>}
      </div>
    );
  };

  const renderDaysGrid = () => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth(); const firstDay = new Date(year, month, 1).getDay(); const lastDate = new Date(year, month + 1, 0).getDate(); const prevMonthLastDate = new Date(year, month, 0).getDate();
    const days = []; for (let i = firstDay - 1; i >= 0; i--) days.push(renderDayCell(prevMonthLastDate - i, 'prev')); for (let d = 1; d <= lastDate; d++) days.push(renderDayCell(d, 'current')); const rows = Math.ceil(days.length / 7); const targetCells = rows * 7; const remaining = targetCells - days.length; for (let i = 1; i <= remaining; i++) days.push(renderDayCell(i, 'next'));
    const gridRows = []; for (let i = 0; i < days.length; i += 7) gridRows.push(<div key={i} className="flex justify-between mb-2 px-1 flex-1">{days.slice(i, i + 7)}</div>); return gridRows;
  };

  if (!isTailwindLoaded) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0c10', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '20px', letterSpacing: '2px', fontFamily: 'sans-serif' }}>LOADING DESIGN...</h1>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          /* 🚨 2. 스크롤 뻑뻑함을 풀기 위해 앱 전체의 overscroll-behavior: none 족쇄 제거 */
          body, html { margin: 0; padding: 0; background-color: #0a0c10; }
          @keyframes modalSpring { 0% { opacity: 0; transform: scale(0.85) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
          .animate-modal-spring { animation: modalSpring 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
          @keyframes floating { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
          .animate-floating { animation: floating 3.5s ease-in-out infinite; }
          .subtle-gold-text { background: linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #9C7C38 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; text-shadow: 0px 2px 4px rgba(0,0,0,0.5); }
          .ios-select { -webkit-appearance: none; -moz-appearance: none; appearance: none; background-image: none; }
          .frost-border { box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>
      
      {toast && (<div className="fixed top-12 left-1/2 -translate-x-1/2 z-[99999] animate-in slide-in-from-top-2 fade-in duration-200" style={{ pointerEvents: 'none' }}><div className="bg-[#1c1c1e]/70 backdrop-blur-xl frost-border px-4 py-2.5 rounded-full flex items-center justify-center min-w-[140px]"><span className="text-white text-[13px] font-black tracking-wide">{toast}</span></div></div>)}
      
      {showSplash && (
        // 🚨 1. 로딩 화면 그라데이션 수정 (사선->수직) 및 상단 색상(15% 영역) 완벽 고정
        <div className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-500 ${(isAuthReady && isMinLoadingTimeDone) ? 'opacity-0' : 'opacity-100'}`} style={{ background: 'linear-gradient(to bottom, #1a050a 0%, #1a050a 15%, #4a161c 100%)', pointerEvents: 'none' }} >
          <div className="relative z-10 flex flex-col items-center w-full px-6">
            <div className="relative w-60 h-60 animate-floating -mb-10">
              <div className="absolute inset-0 bg-[#D4AF37] blur-[50px] opacity-15 rounded-full"></div>
              <img src={GGUMDORI_URL} alt="Kkumdori" className="relative w-full h-full object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]" />
            </div>
            <h1 className="text-3xl font-[900] uppercase tracking-widest subtle-gold-text mb-2 relative z-10">DJTC SHIFT</h1>
            <div className="relative z-10 flex justify-center text-[12px] font-black tracking-widest text-[#D4AF37]/70 drop-shadow-md animate-pulse">
              <span className="relative inline-block">
                CONNECTING<span className="absolute left-full top-0 w-[24px] text-left">{".".repeat(splashDotCount)}</span>
              </span>
            </div>
            <p className="absolute -bottom-24 text-[10px] font-bold text-white/40 tracking-widest uppercase relative z-10">V2.02.03</p>
          </div>
        </div>
      )}

      <div className="max-w-[500px] mx-auto min-h-screen flex flex-col relative shadow-2xl font-sans overflow-hidden" style={{ backgroundColor: '#0a0c10' }}>
        <header className="pt-3 pb-3 px-5 rounded-b-[2rem] shadow-xl z-20 relative border-b border-[#D4AF37]/20" style={{ background: 'linear-gradient(145deg, #4a161c 0%, #1a050a 100%)' }}>
          <div className="flex justify-between items-center mb-3 mt-2">
            <div className="bg-white/5 backdrop-blur-md frost-border px-3 py-1.5 rounded-full flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#D4AF37]" /><span className="text-[10px] font-black tracking-widest uppercase text-white/80">DJTC SHIFT V2.02.03</span></div>
            <button onClick={() => { if(isAuthenticated) setShowSettings(!showSettings); }} className="p-2 text-white/80 hover:bg-white/10 rounded-full transition-transform active:scale-[0.85] relative z-30" style={{ WebkitTapHighlightColor: 'transparent' }}><Settings size={20}/></button>
          </div>
          <div className="flex justify-between items-center mb-1 px-2 relative z-30">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 relative z-40 transition-transform active:scale-[0.85]" style={{ WebkitTapHighlightColor: 'transparent' }}><ChevronLeft size={28} className="text-white/80"/></button>
            <div className="flex flex-col items-center justify-center"><h1 onClick={() => setCurrentDate(new Date())} className="text-2xl font-black tracking-tighter text-white drop-shadow-sm cursor-pointer px-4 py-2 relative z-40 select-none transition-transform active:scale-[0.92]" style={{ WebkitTapHighlightColor: 'transparent' }}>{currentDate.getFullYear()}년 {currentDate.getMonth()+1}월</h1></div>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 relative z-40 transition-transform active:scale-[0.85]" style={{ WebkitTapHighlightColor: 'transparent' }}><ChevronRight size={28} className="text-white/80"/></button>
          </div>
        </header>

        <div className={`overflow-hidden transition-all duration-500 ease-in-out z-20 ${showSettings ? 'max-h-[800px] opacity-100 mt-2 px-4' : 'max-h-0 opacity-0'}`}>
          <div className="p-5 bg-[#1c1c1e]/80 backdrop-blur-xl frost-border rounded-[2.5rem] flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2.5">
              <input value={familyKey} onChange={(e)=>setFamilyKey(e.target.value)} onBlur={(e) => { if (e.target.value) connectServer(e.target.value, true); }} placeholder="공유코드" className="w-[65%] h-12 px-5 bg-black/40 border border-white/10 rounded-full text-[16px] font-bold text-white outline-none focus:border-[#60a5fa]/50 transition-colors" />
              <button onClick={()=>connectServer(familyKey, editPass, false)} className="w-[32%] h-12 border border-emerald-500/50 text-emerald-400 bg-emerald-500/10 rounded-full font-black text-[12px] transition-transform active:scale-[0.92]" style={{ WebkitTapHighlightColor: 'transparent' }}>연결/접속</button>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <div className="relative w-[65%] h-12">
                <input type="password" value={editPass} onChange={(e)=>setEditPass(e.target.value)} placeholder="비밀번호" className="w-full h-full px-5 pr-12 bg-black/40 border border-white/10 rounded-full text-[16px] font-bold text-white outline-none focus:border-[#60a5fa]/50 transition-colors" />
                {isEditing && (
                  <button onClick={() => setShowPwdChange(!showPwdChange)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-transform active:scale-[0.85]" style={{ WebkitTapHighlightColor: 'transparent' }}>
                    <Key size={14} className="text-slate-400" />
                  </button>
                )}
              </div>
              <button onClick={()=>{ if (!isAuthenticated) { showToast('🟡 먼저 연결/접속을 눌러주세요'); return; } if (isEditing) { setIsEditing(false); showToast('🟡 보호 모드 전환'); } else { setIsEditing(true); setShowSettings(false); showToast('🔴 편집 모드 켜짐'); } }} className={`w-[32%] h-12 rounded-full font-black text-[12px] bg-transparent border flex justify-center items-center gap-1.5 transition-transform active:scale-[0.92] ${isEditing ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/50 text-rose-400 bg-rose-500/10'}`} style={{ WebkitTapHighlightColor: 'transparent' }}>{isEditing ? "보호모드" : "편집모드"}</button>
            </div>
            {isEditing && showPwdChange && (
              <div className="flex items-center justify-between gap-2.5 pt-2 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                <input type="password" value={newPass} onChange={(e)=>setNewPass(e.target.value)} placeholder="새 비밀번호 입력" className="w-[65%] h-12 px-5 bg-black/40 border border-[#60a5fa]/40 rounded-full text-[16px] font-bold text-white outline-none focus:border-[#60a5fa]/80 transition-colors" />
                <button onClick={async () => { if(!newPass) return showToast("🟡 새 비밀번호를 입력하세요"); const newData = { ...masterData, editPassword: newPass }; setMasterData(newData); if(familyKey) { const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'userSchedules_v305', familyKey.trim()); await setDoc(docRef, { content: newData, updatedAt: new Date().toISOString() }); } setEditPass(newPass); localStorage.setItem(STORAGE_KEY, JSON.stringify({ key: familyKey.trim(), pass: newPass })); setNewPass(""); setShowPwdChange(false); showToast("🟢 비밀번호 변경 완료"); }} className="w-[32%] h-12 rounded-full font-black text-[12px] border border-[#60a5fa]/50 text-[#60a5fa] bg-[#60a5fa]/10 transition-transform active:scale-[0.92]" style={{ WebkitTapHighlightColor: 'transparent' }}>변경저장</button>
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 px-4 flex flex-col overflow-hidden mt-4 relative`} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} >
          <div className="flex justify-between items-center px-5 py-3 mx-1 mb-4 bg-white/5 backdrop-blur-md frost-border rounded-full relative z-10"><span className="text-[12px] font-black text-white/60 tracking-widest">{currentDate.getMonth()+1}월 근무</span><div className="flex gap-3"><div className="flex items-center gap-1"><Sun size={14} className="text-yellow-500"/><span className="text-[13px] font-black text-white">{monthlyWorkCount.day}</span></div><div className="flex items-center gap-1"><Moon size={14} className="text-indigo-400"/><span className="text-[13px] font-black text-white">{monthlyWorkCount.night}</span></div><div className="flex items-center gap-1 pl-1 border-l border-white/10"><Bell size={14} className="text-violet-400"/><span className="text-[13px] font-black text-white">{monthlyWorkCount.duty}</span></div></div></div>
          <div className="grid grid-cols-7 text-center py-2 text-[10px] font-black text-slate-500 mb-1 uppercase tracking-[0.2em] border-b border-white/5 relative z-10">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w,i)=><span key={w} className={i===0?'text-[#e55a5a]':i===6?'text-[#5a8be5]':''}>{w}</span>)}</div>
          <div 
            className={`flex-1 overflow-y-auto no-scrollbar flex flex-col pt-1 relative z-10 transition-all duration-500 ${!isAuthenticated ? 'blur-[6px] opacity-30 pointer-events-none' : ''}`}
            style={{ paddingBottom: isEditing ? 'calc(95px + env(safe-area-inset-bottom, 12px))' : '20px' }}
          >
            {renderDaysGrid()}
          </div>
          
          {!isAuthenticated && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0c10]/30 backdrop-blur-[2px]">
               <ShieldCheck size={50} className="text-white/40 mb-3 drop-shadow-md" />
               <span className="text-white/80 font-black tracking-widest text-[13px] bg-black/60 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">보안 잠금 상태입니다</span>
             </div>
          )}
        </div>

        {isEditing && (
          <>
            {(!viewModal.isOpen && !modalState.isOpen && !showShiftMenu && !showNightMenu && (scheduleHistory.length > 0 || redoHistory.length > 0)) && (
              <div 
                className="fixed right-6 z-[9998] bg-[#1c1c1e]/40 backdrop-blur-md frost-border rounded-full flex items-center p-1 shadow-lg animate-in fade-in slide-in-from-bottom-2 pointer-events-auto"
                style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 12px))' }}
              >
                <button onClick={handleUndo} disabled={scheduleHistory.length === 0} className={`w-[36px] h-[36px] flex items-center justify-center rounded-full ${scheduleHistory.length > 0 ? 'text-white active:scale-75 transition-transform' : 'text-slate-600 opacity-50'}`}><RotateCcw size={16} strokeWidth={2.5} /></button>
                <div className="w-[1px] h-4 bg-white/10 mx-0.5"></div>
                <button onClick={handleRedo} disabled={redoHistory.length === 0} className={`w-[36px] h-[36px] flex items-center justify-center rounded-full ${redoHistory.length > 0 ? 'text-white active:scale-75 transition-transform' : 'text-slate-600 opacity-50'}`}><RotateCcw size={16} strokeWidth={2.5} style={{ transform: 'scaleX(-1)' }} /></button>
              </div>
            )}

            {(showShiftMenu || showNightMenu) && (
              <div 
                className="fixed w-[calc(100%-68px)] max-w-[432px] left-1/2 -translate-x-1/2 ml-[-34px] flex justify-center z-[10020] pointer-events-none"
                style={{ bottom: 'calc(70px + env(safe-area-inset-bottom, 12px))' }}
              >
                <div className="pointer-events-auto animate-modal-spring flex justify-center w-max">
                  {showShiftMenu && (
                    <div className="bg-[#1c1c1e]/95 backdrop-blur-3xl frost-border p-1.5 rounded-[1.8rem] flex gap-2 shadow-[0_15px_45px_rgba(0,0,0,0.8)] border border-white/15">
                      <button onClick={() => applyPattern('gap')} className="px-5 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-[1.3rem] text-[13px] font-black text-blue-300 transition-transform active:scale-[0.85] select-none whitespace-nowrap">갑조</button>
                      <button onClick={() => applyPattern('eul')} className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-[1.3rem] text-[13px] font-black text-emerald-300 transition-transform active:scale-[0.85] select-none whitespace-nowrap">을조</button>
                      <button onClick={() => applyPattern('byeong')} className="px-5 py-2.5 bg-purple-500/20 border border-purple-500/30 rounded-[1.3rem] text-[13px] font-black text-purple-300 transition-transform active:scale-[0.85] select-none whitespace-nowrap">병조</button>
                    </div>
                  )}
                  {showNightMenu && (
                    <div className="bg-[#1c1c1e]/95 backdrop-blur-3xl frost-border p-1.5 rounded-[1.8rem] flex gap-2 shadow-[0_15px_45px_rgba(0,0,0,0.8)] border border-white/15">
                      <button onClick={() => { setDrawMode('night'); setShowNightMenu(false); }} className="px-7 py-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-[1.3rem] text-[13px] font-black text-indigo-300 transition-transform active:scale-[0.85] select-none whitespace-nowrap">비당직</button>
                      <button onClick={() => { setDrawMode('night_duty'); setShowNightMenu(false); }} className="px-7 py-2.5 bg-violet-500/20 border border-violet-500/30 rounded-[1.3rem] text-[13px] font-black text-violet-300 transition-transform active:scale-[0.85] select-none whitespace-nowrap">당직</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div 
              className="fixed left-1/2 -translate-x-1/2 w-full max-w-[500px] px-4 z-[9999] pointer-events-none"
              style={{ bottom: 'env(safe-area-inset-bottom, 12px)' }}
            >
              <div className="w-full flex items-end gap-3 pointer-events-none relative">
                
                <div className="flex-1 relative flex flex-col min-w-0 pointer-events-auto">
                  <div className="w-full h-[64px] bg-[#1a1c23]/70 backdrop-blur-xl frost-border rounded-[2.5rem] flex items-center relative overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    <div className="flex-1 flex items-center h-full overflow-x-auto no-scrollbar relative px-2 gap-3" style={{ touchAction: 'pan-x', overscrollBehaviorX: 'none', WebkitOverscrollBehaviorX: 'none' }} onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} >
                      <div className="absolute top-1/2 z-0" style={{ marginTop: '-23px', height: '46px', borderRadius: '23px', left: indicatorStyle.left ? indicatorStyle.left - 6 : 0, width: indicatorStyle.width ? indicatorStyle.width + 12 : 0, backgroundColor: 'rgba(255, 255, 255, 0.1)', opacity: indicatorStyle.opacity, transition: indicatorStyle.transition, transform: `scale(${indicatorStyle.scale || 1})`, transformOrigin: 'center' }} />
                      {Object.entries(maps).filter(([id]) => id !== 'night_duty').map(([id, t]) => { 
                        const isSelected = (drawMode === id || (id === 'night' && (drawMode === 'night_duty' || showNightMenu))) && !showShiftMenu; 
                        return (
                          <button key={id} ref={(el) => (buttonRefs.current[id] = el)} onPointerDown={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); setPressedKey(id); }} onPointerUp={() => setPressedKey(null)} onPointerLeave={() => setPressedKey(null)} onPointerCancel={() => setPressedKey(null)} onClick={() => { 
                            setAnimTrigger(Date.now()); setModalState({ isOpen: false }); 
                            if (id === 'schedule') { setShowShiftMenu(false); setShowNightMenu(false); setDrawMode('schedule'); setTimeout(() => setModalState({ isOpen: true, type: 'scheduleInput', data: { text: '' } }), 200); } 
                            else if (id === 'night') { setShowShiftMenu(false); setShowNightMenu(!showNightMenu); setDrawMode('night'); } 
                            else { setDrawMode(id); setShowShiftMenu(false); setShowNightMenu(false); } 
                          }} className="min-w-[48px] h-[52px] flex flex-col items-center justify-center gap-1.5 relative group z-10 origin-center select-none shrink-0" style={{ WebkitTapHighlightColor: 'transparent' }}>
                            <div className={`transition-all duration-300 z-10 ${isSelected ? `scale-[1.1] ${t.tc}` : 'text-white/40'}`}>{t.i}</div>
                            <span className={`text-[8px] uppercase tracking-wider transition-all duration-300 z-10 ${isSelected ? `${t.tc} font-black scale-105` : 'text-white/30 font-bold'}`}>{t.l}</span>
                          </button>
                        );
                      })}
                      <button key="shift" ref={(el) => (buttonRefs.current['shift'] = el)} onPointerDown={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); setPressedKey('shift'); }} onPointerUp={() => setPressedKey(null)} onPointerLeave={() => setPressedKey(null)} onPointerCancel={() => setPressedKey(null)} onClick={() => { setAnimTrigger(Date.now()); setModalState({ isOpen: false }); setShowNightMenu(false); setDrawMode('shift'); setShowShiftMenu(!showShiftMenu); }} className="min-w-[48px] h-[52px] flex flex-col items-center justify-center gap-1.5 relative group z-10 origin-center select-none shrink-0 mr-1" style={{ WebkitTapHighlightColor: 'transparent' }}>
                        <div className={`transition-all duration-300 z-10 ${showShiftMenu || drawMode === 'shift' ? `scale-[1.1] text-[#60a5fa]` : 'text-white/40'}`}><RefreshCw size={20}/></div>
                        <span className={`text-[8px] uppercase tracking-wider transition-all duration-300 z-10 ${showShiftMenu || drawMode === 'shift' ? 'text-[#60a5fa] font-black scale-105' : 'text-white/30 font-bold'}`}>SHIFT</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={async () => { 
                  if(!familyKey) return showToast("🟡 공유코드 입력 필요"); if(!user) return showToast("🔴 서버 연결 준비중");
                  localStorage.setItem(STORAGE_KEY, JSON.stringify({ key: familyKey.trim(), pass: editPass }));
                  try { 
                    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'userSchedules_v305', familyKey.trim()); 
                    await setDoc(docRef, { content: masterData, updatedAt: new Date().toISOString() }); 
                    setDrawMode(null); 
                    setShowShiftMenu(false); 
                    setShowNightMenu(false); 
                    // 🚨 3. 서버 저장 시 선택되어 있던 날짜도 깔끔하게 해제
                    setSelectedDayKey(null);
                    showToast("🟢 서버 저장 완료"); 
                  } 
                  catch (e) { showToast("🔴 서버 저장 실패"); }
                }} className="w-[64px] h-[64px] shrink-0 rounded-full bg-gradient-to-br from-[#4a161c] to-[#2a0b10] border border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.25)] flex flex-col items-center justify-center gap-1 pointer-events-auto transition-transform active:scale-[0.85] select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
                  <Save size={20} className="text-[#D4AF37]"/><span className="text-[10px] font-black tracking-wider text-[#D4AF37]">SAVE</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* 팝업 모달 */}
        {modalState.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-6" style={{ WebkitTapHighlightColor: 'transparent' }}>
            {modalState.type === 'scheduleInput' && (<div className="bg-[#1e293b]/70 backdrop-blur-2xl frost-border w-full max-w-[260px] rounded-[2rem] p-5 animate-modal-spring shadow-2xl shadow-black/60"><h3 className="text-[17px] font-black mb-4 text-white text-center">일정 입력</h3><input type="text" maxLength={2} placeholder="예: 연차, 휴가" className="w-full bg-[#0f172a]/80 rounded-xl p-3 text-[16px] font-bold text-center text-white outline-none border border-white/10 focus:border-[#60a5fa]/50 transition-colors" value={modalState.data.text || ''} onChange={(e) => setModalState(prev => ({...prev, data: {...prev.data, text: e.target.value}}))} /><div className="flex gap-2 mt-4"><button onClick={() => setModalState({isOpen:false})} className="flex-1 py-2.5 border border-white/20 text-white/60 rounded-[1rem] font-black text-[14px] transition-transform active:scale-[0.92]">취소</button><button onClick={() => { setLoadedScheduleText(modalState.data.text || '일정'); setDrawMode('schedule'); setModalState({isOpen: false}); }} className="flex-1 py-2.5 border border-cyan-500/60 text-cyan-400 bg-cyan-500/10 rounded-[1rem] font-black text-[14px] transition-transform active:scale-[0.92]">확인</button></div></div>)}
            {modalState.type === 'memo' && (<div className="bg-[#131b2c]/70 backdrop-blur-2xl frost-border w-full max-w-[280px] rounded-[2rem] p-5 animate-modal-spring shadow-2xl shadow-black/60"><div className="flex justify-between items-center mb-4"><span className="text-white font-black text-[17px]">{formatPopupDate(modalState.dateKey)}</span><button onClick={() => setModalState({isOpen:false})} className="text-slate-400 p-1 bg-white/5 rounded-full transition-transform active:scale-[0.85]"><X size={18}/></button></div><textarea className="w-full h-28 bg-[#1e293b]/80 rounded-[1.2rem] p-3 text-[16px] font-bold text-white outline-none resize-none border border-white/10 focus:border-[#60a5fa]/50 transition-colors" value={modalState.data.text || ''} onChange={(e) => setModalState(prev => ({...prev, data: {...prev.data, text: e.target.value}}))} /><button onClick={() => { saveToHistory(); const newData = JSON.parse(JSON.stringify(masterData)); if(!newData.schedules[modalState.dateKey]) newData.schedules[modalState.dateKey] = {}; newData.schedules[modalState.dateKey].memo = modalState.data.text; setMasterData(newData); setModalState({isOpen:false}); showToast("🟢 일정 반영 완료"); }} className="w-full py-3 mt-4 rounded-[1rem] font-black border border-blue-500/80 text-blue-400 bg-blue-500/10 text-[14px] transition-transform active:scale-[0.95]">일정반영</button></div>)}
          </div>
        )}

        {!isEditing && viewModal.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6" onClick={()=>setViewModal({ isOpen: false, memo: null, dateKey: null })} style={{ WebkitTapHighlightColor: 'transparent' }}><div className={`w-full max-w-[320px] rounded-[2.5rem] p-6 animate-modal-spring shadow-2xl shadow-black/60 bg-[#131b2c]/70 backdrop-blur-2xl frost-border`} onClick={(e) => e.stopPropagation()}><div className="flex justify-between items-center mb-6"><span className="text-white font-black text-xl tracking-wide">{formatPopupDate(viewModal.dateKey)}</span><button onClick={() => setViewModal({ isOpen: false, memo: null, dateKey: null })} className="text-slate-400 p-1.5 bg-white/5 rounded-full transition-colors"><X size={20}/></button></div><div className={`w-full rounded-[1.25rem] bg-[#1e293b]/50 backdrop-blur-md shadow-inner flex flex-col p-5 text-[15px] font-bold text-white/90 leading-relaxed overflow-y-auto max-h-[30vh] border border-white/10`}>{viewModal.memo && (<div className={`flex gap-2 items-start`}><FileText size={16} className="text-[#60a5fa] shrink-0 mt-0.5" /><div>{viewModal.memo}</div></div>)}</div></div></div>
        )}
      </div>
    </>
  );
}