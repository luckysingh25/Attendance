import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  TEACHERS: '@atd_teachers',
  STUDENT_DATA: '@atd_student',
  ATTENDANCE_LOGS: '@atd_logs',
};

const initialState = {
  userRole: null,       // 'teacher' | 'student'
  currentUser: null,    // { name, email } for teacher
  studentData: null,    // { name, erp, dob, photo, photoBase64 }
  attendanceLogs: [],   // [{ id, studentName, erp, date, eventId, timestamp }]
  teachers: [],         // [{ name, email, password }]
  isLoading: false,
  isHydrated: false,    // true after data loaded from AsyncStorage
};

function appReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        teachers: action.payload.teachers || [],
        attendanceLogs: action.payload.attendanceLogs || [],
        studentData: action.payload.studentData || null,
        isHydrated: true,
      };
    case 'SET_ROLE':
      return { ...state, userRole: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_STUDENT_DATA':
      return { ...state, studentData: action.payload };
    case 'ADD_ATTENDANCE_LOG': {
      const newLogs = [action.payload, ...state.attendanceLogs];
      return { ...state, attendanceLogs: newLogs };
    }
    case 'ADD_TEACHER': {
      const updated = [...state.teachers, action.payload];
      return { ...state, teachers: updated };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGOUT':
      return {
        ...state,
        userRole: null,
        currentUser: null,
        studentData: null,
        isLoading: false,
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isHydrated = useRef(false);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      try {
        const [teachersRaw, logsRaw, studentRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TEACHERS),
          AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.STUDENT_DATA),
        ]);
        dispatch({
          type: 'HYDRATE',
          payload: {
            teachers: teachersRaw ? JSON.parse(teachersRaw) : [],
            attendanceLogs: logsRaw ? JSON.parse(logsRaw) : [],
            studentData: studentRaw ? JSON.parse(studentRaw) : null,
          },
        });
        isHydrated.current = true;
      } catch (e) {
        console.error('Failed to hydrate state:', e);
        dispatch({ type: 'HYDRATE', payload: {} });
        isHydrated.current = true;
      }
    })();
  }, []);

  // Persist teachers whenever they change (after hydration)
  useEffect(() => {
    if (!isHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(state.teachers)).catch(console.error);
  }, [state.teachers]);

  // Persist attendance logs
  useEffect(() => {
    if (!isHydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE_LOGS, JSON.stringify(state.attendanceLogs)).catch(console.error);
  }, [state.attendanceLogs]);

  // Persist student data
  useEffect(() => {
    if (!isHydrated.current) return;
    if (state.studentData) {
      AsyncStorage.setItem(STORAGE_KEYS.STUDENT_DATA, JSON.stringify(state.studentData)).catch(console.error);
    }
  }, [state.studentData]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

export { STORAGE_KEYS };
