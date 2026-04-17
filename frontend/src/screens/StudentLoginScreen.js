import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';
import { loginStudent } from '../services/api';
import { API_BASE_URL } from '../config/api';

export default function StudentLoginScreen({ navigation }) {
  const { dispatch } = useApp();
  const [erp, setErp] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!erp.trim()) {
      setError('ERP number is required');
      return;
    }
    if (!dob.trim()) {
      setError('Date of birth is required');
      return;
    }

    setLoading(true);
    try {
      const data = await loginStudent(erp.trim(), dob.trim());
      
      const studentData = {
        ...data.student,
        avatarColor: COLORS.avatarColors[
          parseInt(erp.trim().slice(-1), 10) % COLORS.avatarColors.length
        ] || COLORS.primary,
      };

      dispatch({ type: 'SET_TOKEN', payload: data.token });
      dispatch({ type: 'SET_STUDENT_DATA', payload: studentData });
      navigation.replace('StudentHome');
    } catch (err) {
      if (err.message === 'Network request failed') {
        setError('Network failed. Check WiFi or backend server.');
      } else {
        setError(err.message || 'Login failed. Check ERP and DOB.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            id="btn-student-back"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.formWrap}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>🎓</Text>
            </View>
            <Text style={styles.title}>Student Login</Text>
            <Text style={styles.subtitle}>Enter your ERP and date of birth to continue</Text>

            {/* Demo hint */}
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Demo Credentials</Text>
              <Text style={styles.hintText}>ERP: 20241001 · DOB: 2003-06-12</Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            {/* ERP */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ERP Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2024001"
                placeholderTextColor={COLORS.textMuted}
                value={erp}
                onChangeText={setErp}
                keyboardType="number-pad"
                id="input-student-erp"
              />
            </View>

            {/* DOB */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                value={dob}
                onChangeText={setDob}
                id="input-student-dob"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
              id="btn-student-login"
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.submitText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 0,
    zIndex: 10,
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  formWrap: {
    marginTop: 40,
  },
  iconWrap: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 20,
  },
  hintBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hintTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: { boxShadow: `0 4px 16px ${COLORS.primary}40` },
    }),
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
