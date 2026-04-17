import { Platform } from 'react-native';

export const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000/api' 
  : 'http://100.100.12.117:8000/api';
