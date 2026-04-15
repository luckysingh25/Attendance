import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';

export default function StartScreen({ navigation }) {
  const { dispatch } = useApp();

  const handleRole = (role) => {
    dispatch({ type: 'SET_ROLE', payload: role });
    if (role === 'teacher') {
      navigation.navigate('TeacherAuth');
    } else {
      navigation.navigate('StudentLogin');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.title}>Attendance</Text>
          <Text style={styles.subtitle}>QR-Based Verification System</Text>
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnTeacher]}
            activeOpacity={0.85}
            onPress={() => handleRole('teacher')}
            id="btn-start-teacher"
          >
            <Text style={styles.btnEmoji}>🛡️</Text>
            <View style={styles.btnTextWrap}>
              <Text style={styles.btnTitle}>Start as Teacher</Text>
              <Text style={styles.btnDesc}>Scan & verify student identity</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnStudent]}
            activeOpacity={0.85}
            onPress={() => handleRole('student')}
            id="btn-start-student"
          >
            <Text style={styles.btnEmoji}>🎓</Text>
            <View style={styles.btnTextWrap}>
              <Text style={[styles.btnTitle, { color: COLORS.primary }]}>Start as Student</Text>
              <Text style={styles.btnDesc}>Check-in & view history</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Built for fast, reliable fest check-ins</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      web: {
        boxShadow: `0 8px 32px ${COLORS.primary}55`,
      },
    }),
  },
  iconText: {
    fontSize: 36,
    color: COLORS.white,
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  actions: {
    gap: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  btnTeacher: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: { boxShadow: `0 4px 20px ${COLORS.primary}40` },
    }),
  },
  btnStudent: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
    }),
  },
  btnEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  btnTextWrap: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 3,
  },
  btnDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 48,
    fontWeight: '500',
  },
});
