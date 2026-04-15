import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StartScreen from '../screens/StartScreen';
import TeacherAuthScreen from '../screens/TeacherAuthScreen';
import TeacherDashboard from '../screens/TeacherDashboard';
import TeacherQRScreen from '../screens/TeacherQRScreen';
import ScannerScreen from '../screens/ScannerScreen';
import VerificationScreen from '../screens/VerificationScreen';
import StudentLoginScreen from '../screens/StudentLoginScreen';
import StudentHomeScreen from '../screens/StudentHomeScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Start"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F1F5F9' },
      }}
    >
      {/* Start / Role Selection */}
      <Stack.Screen name="Start" component={StartScreen} />

      {/* Teacher Flow */}
      <Stack.Screen name="TeacherAuth" component={TeacherAuthScreen} />
      <Stack.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="TeacherQR" component={TeacherQRScreen} />

      {/* Student Flow */}
      <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
      <Stack.Screen
        name="StudentHome"
        component={StudentHomeScreen}
        options={{ gestureEnabled: false }}
      />

      {/* Shared Screens */}
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen name="History" component={AttendanceHistoryScreen} />
    </Stack.Navigator>
  );
}
