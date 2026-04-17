import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  TEACHERS: '@atd_teachers',
  STUDENT_DATA: '@atd_student',
  ATTENDANCE_LOGS: '@atd_logs',
  TOKEN: '@atd_token',
  CURRENT_USER: '@atd_current_user',
  ROLE: '@atd_role',
};

const initialState = {
  userRole: null,       // 'teacher' | 'student'
  currentUser: null,    // { name, email } for teacher
  studentData: null,    // { name, erp, dob, photoUrl }
  attendanceLogs: [],   // [{ id, studentName, erp, date, eventId, timestamp }]
  teachers: [],         // [{ name, email, password }] — can be removed in favor of backend
  authToken: null,
  sessionId: null,
  photoUrl: null,
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
        authToken: action.payload.authToken || null,
        currentUser: action.payload.currentUser || null,
        userRole: action.payload.userRole || null,
        isHydrated: true,
      };
    case 'SET_ROLE':
      return { ...state, userRole: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_STUDENT_DATA':
      return { ...state, studentData: action.payload };
    case 'SET_TOKEN':
      return { ...state, authToken: action.payload };
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload };
    case 'SET_PHOTO_URL':
      return { ...state, photoUrl: action.payload };
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
        authToken: null,
        sessionId: null,
        photoUrl: null,
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
        const [teachersRaw, logsRaw, studentRaw, tokenRaw, userRaw, roleRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TEACHERS),
          AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE_LOGS),
          AsyncStorage.getItem(STORAGE_KEYS.STUDENT_DATA),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER),
          AsyncStorage.getItem(STORAGE_KEYS.ROLE),
        ]);
        dispatch({
          type: 'HYDRATE',
          payload: {
            teachers: teachersRaw ? JSON.parse(teachersRaw) : [],
            attendanceLogs: logsRaw ? JSON.parse(logsRaw) : [],
            studentData: studentRaw ? JSON.parse(studentRaw) : null,
            authToken: tokenRaw || null,
            currentUser: userRaw ? JSON.parse(userRaw) : null,
            userRole: roleRaw || null,
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

  // Persist token
  useEffect(() => {
    if (!isHydrated.current) return;
    if (state.authToken) {
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, state.authToken).catch(console.error);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN).catch(console.error);
    }
  }, [state.authToken]);

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
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.STUDENT_DATA).catch(console.error);
    }
  }, [state.studentData]);

  // Persist current user
  useEffect(() => {
    if (!isHydrated.current) return;
    if (state.currentUser) {
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser)).catch(console.error);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER).catch(console.error);
    }
  }, [state.currentUser]);

  // Persist user role
  useEffect(() => {
    if (!isHydrated.current) return;
    if (state.userRole) {
      AsyncStorage.setItem(STORAGE_KEYS.ROLE, state.userRole).catch(console.error);
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.ROLE).catch(console.error);
    }
  }, [state.userRole]);

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
