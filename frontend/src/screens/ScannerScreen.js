import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  TextInput, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';

let CameraView, useCameraPermissions;
try {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch (e) {
  // Camera not available
}

const { width: SCREEN_W } = Dimensions.get('window');
const QR_VALIDITY_SECONDS = 20;

function showError(msg) {
  if (Platform.OS === 'web') {
    window.alert(msg);
  } else {
    Alert.alert('Error', msg);
  }
}

export default function ScannerScreen({ navigation, route }) {
  const { state } = useApp();
  const role = route?.params?.role || 'student';
  const [scanned, setScanned] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Use the hook if available
  let permissionResult, requestPermission;
  if (useCameraPermissions) {
    [permissionResult, requestPermission] = useCameraPermissions();
  }

  useEffect(() => {
    if (permissionResult) {
      setHasPermission(permissionResult.granted);
    }
  }, [permissionResult]);

  useEffect(() => {
    // Reset scanned state when navigating back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
      setErrorMsg('');
    });
    return unsubscribe;
  }, [navigation]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setErrorMsg('');

    try {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        setScanned(false);
        setErrorMsg('Invalid QR code format');
        return;
      }

      // --- TIMESTAMP VALIDATION ---
      // QR from teacher contains: { eventId, timestamp, token }
      // Timestamp must be within QR_VALIDITY_SECONDS seconds
      if (parsed.timestamp) {
        const now = Date.now();
        const qrAge = (now - parsed.timestamp) / 1000; // seconds

        if (qrAge > QR_VALIDITY_SECONDS || qrAge < -5) {
          // QR is expired (or timestamp is in the future by more than 5s)
          setScanned(false);
          setErrorMsg('QR expired, please rescan');
          return;
        }
      }

      // Build student data for verification from logged-in student
      const studentData = {
        name: state.studentData?.name || 'Unknown Student',
        erp: state.studentData?.erp || 'N/A',
        course: state.studentData?.course || '',
        section: state.studentData?.section || '',
        avatarColor: state.studentData?.avatarColor,
        photoUrl: state.studentData?.photoUrl,
        eventId: parsed.eventId || 'UNKNOWN',
        sessionId: parsed.sessionId || '',
        token: parsed.token || '',
      };

      navigation.navigate('Verification', {
        studentData,
        role,
      });
    } catch (err) {
      setScanned(false);
      setErrorMsg('Failed to read QR code data');
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    handleBarCodeScanned({ type: 'manual', data: manualInput.trim() });
  };

  // Demo scan: generates a FRESH QR with valid timestamp
  const handleDemoScan = () => {
    const freshQR = JSON.stringify({
      eventId: 'FEST2026',
      timestamp: Date.now(),
      token: 'DEMO_' + Math.random().toString(36).substring(2, 10),
    });
    handleBarCodeScanned({ type: 'demo', data: freshQR });
  };

  // Demo expired scan: generates a QR with OLD timestamp
  const handleExpiredDemo = () => {
    const staleQR = JSON.stringify({
      eventId: 'FEST2026',
      timestamp: Date.now() - 30000, // 30 seconds ago = expired
      token: 'EXPIRED_' + Math.random().toString(36).substring(2, 10),
    });
    handleBarCodeScanned({ type: 'demo', data: staleQR });
  };

  // Permission not yet determined
  if (hasPermission === null && CameraView) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.permTitle}>Camera Permission</Text>
          <Text style={styles.permDesc}>
            We need camera access to scan the entry QR code
          </Text>
          <TouchableOpacity
            style={styles.permBtn}
            onPress={requestPermission}
            id="btn-grant-permission"
          >
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualToggle}
            onPress={() => setShowManual(true)}
          >
            <Text style={styles.manualToggleText}>Enter code manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (hasPermission === false && CameraView) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.permTitle}>Camera Blocked</Text>
          <Text style={styles.permDesc}>
            Please enable camera permission in your device settings to scan QR codes.
          </Text>

          {/* Error message */}
          {errorMsg ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>⚠ {errorMsg}</Text>
              <TouchableOpacity onPress={() => { setErrorMsg(''); setScanned(false); }}>
                <Text style={styles.inlineRetry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.permBtn}
            onPress={() => setShowManual(true)}
          >
            <Text style={styles.permBtnText}>Enter Code Manually</Text>
          </TouchableOpacity>
          <View style={[styles.demoRow, { width: '100%', paddingHorizontal: 8 }]}>
            <TouchableOpacity
              style={[styles.demoBtn, { flex: 1 }]}
              onPress={handleDemoScan}
              id="btn-demo-scan"
            >
              <Text style={styles.demoBtnText}>⚡ Valid QR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoBtn, styles.demoBtnExpired, { flex: 1 }]}
              onPress={handleExpiredDemo}
              id="btn-demo-expired-blocked"
            >
              <Text style={[styles.demoBtnText, { color: COLORS.danger }]}>⏱ Expired QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          id="btn-scanner-back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Entry QR</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Error banner */}
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {errorMsg}</Text>
          <TouchableOpacity onPress={() => { setErrorMsg(''); setScanned(false); }}>
            <Text style={styles.errorDismiss}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Camera / Manual Input */}
      <View style={styles.cameraWrap}>
        {!showManual && CameraView && hasPermission ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            {/* Scan overlay */}
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanHint}>
                {scanned ? 'Validating...' : 'Point at the teacher\'s entry QR'}
              </Text>
            </View>
          </View>
        ) : (
          /* Manual input fallback */
          <View style={styles.manualWrap}>
            <Text style={styles.manualTitle}>📋 Enter QR Data</Text>
            <Text style={styles.manualDesc}>
              Paste the QR code content from the teacher's screen
            </Text>
            <TextInput
              style={styles.manualInput}
              placeholder='{"eventId":"FEST2026","timestamp":...,"token":"..."}'
              placeholderTextColor={COLORS.textMuted}
              value={manualInput}
              onChangeText={setManualInput}
              multiline
              numberOfLines={4}
              id="input-manual-qr"
            />
            <TouchableOpacity
              style={styles.manualSubmitBtn}
              onPress={handleManualSubmit}
              id="btn-manual-submit"
            >
              <Text style={styles.manualSubmitText}>Verify</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        {!showManual && CameraView && hasPermission && (
          <TouchableOpacity style={styles.toggleManualBtn} onPress={() => setShowManual(true)}>
            <Text style={styles.toggleManualText}>Enter manually instead</Text>
          </TouchableOpacity>
        )}
        {showManual && CameraView && hasPermission && (
          <TouchableOpacity style={styles.toggleManualBtn} onPress={() => setShowManual(false)}>
            <Text style={styles.toggleManualText}>Use camera instead</Text>
          </TouchableOpacity>
        )}
        <View style={styles.demoRow}>
          <TouchableOpacity
            style={[styles.demoBtn, { flex: 1 }]}
            onPress={handleDemoScan}
            id="btn-demo-valid"
          >
            <Text style={styles.demoBtnText}>⚡ Demo (Valid)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.demoBtn, styles.demoBtnExpired, { flex: 1 }]}
            onPress={handleExpiredDemo}
            id="btn-demo-expired"
          >
            <Text style={[styles.demoBtnText, { color: COLORS.danger }]}>⏱ Demo (Expired)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const FRAME_SIZE = SCREEN_W * 0.65;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4, width: 60 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  /* Error banner */
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  errorDismiss: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
  /* Camera */
  cameraWrap: { flex: 1 },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.white },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanHint: { color: COLORS.white, fontSize: 14, fontWeight: '600', marginTop: 28, textAlign: 'center' },
  /* Manual input */
  manualWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  manualTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  manualDesc: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, fontWeight: '500' },
  manualInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  manualSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: `0 4px 16px ${COLORS.primary}40` },
    }),
  },
  manualSubmitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  /* Permission screens */
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  permTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  permDesc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28, fontWeight: '500' },
  permBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 36, marginBottom: 16 },
  permBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  manualToggle: { padding: 10 },
  manualToggleText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  /* Bottom actions */
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  toggleManualBtn: { alignItems: 'center', padding: 8 },
  toggleManualText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  demoRow: { flexDirection: 'row', gap: 10 },
  demoBtn: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoBtnExpired: {
    backgroundColor: COLORS.dangerLight,
    borderColor: '#FECACA',
  },
  demoBtnText: { color: COLORS.warning, fontSize: 14, fontWeight: '700' },
  inlineError: {
    backgroundColor: COLORS.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '100%',
  },
  inlineErrorText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  inlineRetry: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
