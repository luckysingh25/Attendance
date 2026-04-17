import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Platform, Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';
import { startSession } from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_W * 0.7, 320);
const REFRESH_INTERVAL = 20; // seconds

function generateToken(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateQRData(sessionId) {
  return JSON.stringify({
    eventId: 'FEST2026',
    sessionId: sessionId || 'DEMO_SESSION',
    timestamp: Date.now(),
    token: generateToken(),
  });
}

export default function TeacherQRScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [qrData, setQrData] = useState(generateQRData(state.sessionId));
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  const refreshQR = useCallback(() => {
    setQrData(generateQRData(state.sessionId));
    setCountdown(REFRESH_INTERVAL);
  }, [state.sessionId]);

  useEffect(() => {
    const initSession = async () => {
      try {
        if (!state.sessionId) {
          const data = await startSession('FEST2026');
          dispatch({ type: 'SET_SESSION', payload: data.session.id });
        }
      } catch (err) {
        console.error('Failed to start session:', err);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    // Auto-refresh QR every 20 seconds
    timerRef.current = setInterval(() => {
      refreshQR();
    }, REFRESH_INTERVAL * 1000);

    // Countdown timer (ticks every second)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return REFRESH_INTERVAL;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [refreshQR]);

  // Countdown progress (1.0 → 0.0)
  const progress = countdown / REFRESH_INTERVAL;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            id="btn-qr-back"
          >
            <Text style={styles.backText}>← End Session</Text>
          </TouchableOpacity>
        </View>

        {/* Event badge */}
        <View style={styles.eventBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.eventText}>FEST2026 — LIVE</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrWrapper}>
          <View style={styles.qrCard}>
            <QRCode
              value={qrData}
              size={QR_SIZE}
              backgroundColor={COLORS.white}
              color={COLORS.text}
            />
          </View>
        </View>

        {/* Instruction */}
        <Text style={styles.instruction}>Scan this QR to enter</Text>

        {/* Countdown */}
        <View style={styles.timerSection}>
          <View style={styles.timerBarBg}>
            <View
              style={[
                styles.timerBarFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor:
                    countdown <= 5 ? COLORS.danger :
                    countdown <= 10 ? COLORS.warning :
                    COLORS.success,
                },
              ]}
            />
          </View>
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>Auto-refresh in</Text>
            <Text
              style={[
                styles.timerValue,
                countdown <= 5 && { color: COLORS.danger },
              ]}
            >
              {countdown}s
            </Text>
          </View>
        </View>

        {/* Manual refresh */}
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={refreshQR}
          activeOpacity={0.8}
          id="btn-refresh-qr"
        >
          <Text style={styles.refreshText}>🔄 Refresh Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.text, // Dark background for contrast
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
  },
  backText: {
    fontSize: 15,
    color: COLORS.primaryGlow,
    fontWeight: '600',
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  eventText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 1,
  },
  qrWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
      web: { boxShadow: '0 10px 40px rgba(0,0,0,0.3)' },
    }),
  },
  instruction: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  /* Timer */
  timerSection: {
    width: '100%',
    marginBottom: 20,
  },
  timerBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  timerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  /* Refresh button */
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: Platform.OS === 'ios' ? 20 : 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  refreshText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
