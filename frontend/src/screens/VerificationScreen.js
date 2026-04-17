import React, { useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Dimensions, BackHandler, Image,
} from 'react-native';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';
import { markAttendance } from '../services/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function LargeAvatar({ name, color, imageUrl }) {
  const initials = (name || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.largeAvatar, { backgroundColor: color || COLORS.primary, overflow: 'hidden' }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} />
      ) : (
        <Text style={styles.largeAvatarText}>{initials}</Text>
      )}
      <View style={styles.avatarRing} />
    </View>
  );
}

export default function VerificationScreen({ navigation, route }) {
  const { dispatch, state } = useApp();
  const studentData = route?.params?.studentData || {};
  const role = route?.params?.role || 'teacher';
  const [marked, setMarked] = React.useState(false);
  const [error, setError] = React.useState('');

  useEffect(() => {
    const performMarking = async () => {
      if (role === 'student' && studentData.sessionId && studentData.eventId) {
        try {
          const res = await markAttendance(studentData.sessionId, studentData.eventId);
          if (res.success) {
            setMarked(true);
          }
        } catch (err) {
          setError(err.message || 'Verification failed');
        }
      } else {
        // Fallback for teacher role or manual entry without backend session
        setMarked(true);
      }
    };
    performMarking();
  }, [role, studentData.sessionId, studentData.eventId]);

  const avatarColor =
    studentData.avatarColor ||
    COLORS.avatarColors[
      parseInt((studentData.erp || '0').slice(-1), 10) % COLORS.avatarColors.length
    ];

  // CRITICAL: Prevent back navigation
  useEffect(() => {
    // Disable hardware back button (Android)
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    // Disable gesture-based back navigation
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
    });

    return () => backHandler.remove();
  }, [navigation]);

  // Also prevent beforeRemove events
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Only allow programmatic navigation (from NEXT button)
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        e.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleNext = useCallback(() => {
    // Save attendance log
    const log = {
      id: `ATD-${Date.now()}`,
      studentName: studentData.name || 'Unknown',
      erp: studentData.erp || 'N/A',
      course: studentData.course || '',
      section: studentData.section || '',
      eventId: studentData.eventId || `EVT-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      scannedBy: role,
      verifiedBy: state.currentUser?.name || role,
    };

    dispatch({ type: 'ADD_ATTENDANCE_LOG', payload: log });

    // Navigate back to scanner (use dispatch to bypass beforeRemove)
    navigation.dispatch(
      navigation.reset
        ? { type: 'GO_BACK' }
        : { type: 'NAVIGATE', payload: { name: 'Scanner' } }
    );

    // Fallback: force navigate
    if (role === 'teacher') {
      navigation.navigate('Scanner', { role: 'teacher' });
    } else {
      navigation.navigate('Scanner', { role: 'student' });
    }
  }, [studentData, role, dispatch, navigation, state.currentUser]);

  return (
    <View style={styles.container}>
      {/* Status bar - Verification active indicator */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, marked && { backgroundColor: COLORS.success }]} />
        <Text style={[styles.statusText, marked && { color: COLORS.success }]}>
          {marked ? 'SUCCESSFULLY VERIFIED' : 'VERIFYING IDENTITY...'}
        </Text>
      </View>

      {/* Student Photo Area (full top section) */}
      <View style={styles.photoSection}>
        <LargeAvatar 
          name={studentData.name} 
          color={avatarColor} 
          imageUrl={studentData.photoUrl} 
        />
      </View>

      {/* Info Card */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          {/* Verified badge */}
          {marked ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : error ? (
            <View style={[styles.verifiedBadge, { backgroundColor: COLORS.dangerLight }]}>
              <Text style={[styles.verifiedIcon, { color: COLORS.danger }]}>✕</Text>
              <Text style={[styles.verifiedText, { color: COLORS.danger }]}>{error}</Text>
            </View>
          ) : (
             <View style={[styles.verifiedBadge, { backgroundColor: COLORS.primaryLight }]}>
              <Text style={[styles.verifiedIcon, { color: COLORS.primary }]}>●</Text>
              <Text style={[styles.verifiedText, { color: COLORS.primary }]}>Processing...</Text>
            </View>
          )}

          {/* Name */}
          <Text style={styles.studentName}>
            {studentData.name || 'Unknown Student'}
          </Text>

          {/* ERP */}
          <View style={styles.erpRow}>
            <Text style={styles.erpLabel}>ERP</Text>
            <Text style={styles.erpValue}>{studentData.erp || 'N/A'}</Text>
          </View>

          {/* Course & Section (if available) */}
          {(studentData.course || studentData.section) && (
            <View style={styles.detailRow}>
              {studentData.course && (
                <View style={styles.detailChip}>
                  <Text style={styles.detailChipText}>{studentData.course}</Text>
                </View>
              )}
              {studentData.section && (
                <View style={[styles.detailChip, { backgroundColor: COLORS.successLight }]}>
                  <Text style={[styles.detailChipText, { color: COLORS.success }]}>
                    Section {studentData.section}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Event ID */}
          {studentData.eventId && (
            <Text style={styles.eventId}>Event: {studentData.eventId}</Text>
          )}
        </View>

        {/* NEXT Button — the ONLY way out of this screen */}
        <TouchableOpacity
          style={styles.nextBtn}
          activeOpacity={0.85}
          onPress={handleNext}
          id="btn-verification-next"
        >
          <Text style={styles.nextBtnText}>NEXT →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text,
  },
  /* Top status indicator */
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 58 : 42,
    paddingBottom: 12,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 1.5,
  },
  /* Photo section */
  photoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  largeAvatar: {
    width: SCREEN_W * 0.55,
    height: SCREEN_W * 0.55,
    borderRadius: SCREEN_W * 0.275,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: { elevation: 20 },
      web: { boxShadow: '0 12px 48px rgba(0,0,0,0.4)' },
    }),
  },
  largeAvatarText: {
    fontSize: SCREEN_W * 0.18,
    fontWeight: '900',
    color: COLORS.white,
  },
  avatarRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SCREEN_W * 0.275,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  /* Info section */
  infoSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 24,
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 24px rgba(0,0,0,0.15)' },
    }),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.successLight,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginBottom: 14,
  },
  verifiedIcon: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '800',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studentName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  erpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  erpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  erpValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailChip: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  detailChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  eventId: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  /* NEXT Button */
  nextBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
      web: { boxShadow: `0 6px 24px ${COLORS.success}50` },
    }),
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
