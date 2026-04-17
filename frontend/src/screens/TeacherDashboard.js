import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';

export default function TeacherDashboard({ navigation }) {
  const { state, dispatch } = useApp();
  const user = state.currentUser;
  const scanCount = state.attendanceLogs.filter(
    (l) => l.scannedBy === 'teacher'
  ).length;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigation.reset({ index: 0, routes: [{ name: 'Start' }] });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Welcome,</Text>
            <Text style={styles.userName}>{user?.name || 'Teacher'}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            id="btn-teacher-logout"
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
            <Text style={[styles.statNum, { color: COLORS.primary }]}>{scanCount}</Text>
            <Text style={styles.statLabel}>Scans Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.successLight }]}>
            <Text style={[styles.statNum, { color: COLORS.success }]}>
              {state.attendanceLogs.length}
            </Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.scanBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TeacherQR')}
            id="btn-start-entry-session"
          >
            <Text style={styles.scanIcon}>📲</Text>
            <Text style={styles.scanTitle}>Start Entry Session</Text>
            <Text style={styles.scanDesc}>Display QR for students to scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logsBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('History', { role: 'teacher' })}
            id="btn-view-logs"
          >
            <Text style={styles.logsIcon}>📋</Text>
            <View style={styles.logsBtnTextWrap}>
              <Text style={styles.logsBtnTitle}>View Scan Logs</Text>
              <Text style={styles.logsBtnDesc}>Review past verifications</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 36,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsWrap: {
    flex: 1,
    gap: 16,
  },
  scanBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: `0 6px 28px ${COLORS.primary}45` },
    }),
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  scanDesc: {
    fontSize: 14,
    color: '#93C5FD',
    fontWeight: '500',
  },
  logsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  logsIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  logsBtnTextWrap: { flex: 1 },
  logsBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  logsBtnDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
