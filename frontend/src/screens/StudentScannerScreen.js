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
const QR_VALIDITY_SECONDS = 30; // Increased for student convenience

export default function StudentScannerScreen({ navigation }) {
  const { state } = useApp();
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
      if (parsed.timestamp) {
        const now = Date.now();
        const qrAge = (now - parsed.timestamp) / 1000;

        if (qrAge > QR_VALIDITY_SECONDS || qrAge < -5) {
          setScanned(false);
          setErrorMsg('QR expired, please rescan');
          return;
        }
      }

      // Build student data for verification
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
        role: 'student',
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

  // Demo scan helper
  const handleDemoScan = () => {
    const freshQR = JSON.stringify({
      eventId: 'FEST2026',
      sessionId: state.sessionId || 'DEMO_SESS_123',
      timestamp: Date.now(),
      token: 'DEMO_' + Math.random().toString(36).substring(2, 10),
    });
    handleBarCodeScanned({ type: 'demo', data: freshQR });
  };

  if (hasPermission === null && CameraView) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.permTitle}>Camera Permission</Text>
          <Text style={styles.permDesc}>
            Allow camera access to scan the attendance QR
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false && CameraView) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.permTitle}>Camera Blocked</Text>
          <Text style={styles.permDesc}>Please enable camera in settings to scan QR codes.</Text>
          <TouchableOpacity style={styles.permBtn} onPress={() => setShowManual(true)}>
            <Text style={styles.permBtnText}>Enter Code Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Scan</Text>
        <View style={{ width: 60 }} />
      </View>

      {errorMsg ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {errorMsg}</Text>
          <TouchableOpacity onPress={() => { setErrorMsg(''); setScanned(false); }}>
            <Text style={styles.errorDismiss}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.cameraWrap}>
        {!showManual && CameraView && hasPermission ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanHint}>Point at the teacher's screen</Text>
            </View>
          </View>
        ) : (
          <View style={styles.manualWrap}>
            <Text style={styles.manualTitle}>Manual Entry</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="Paste QR data here..."
              placeholderTextColor={COLORS.textMuted}
              value={manualInput}
              onChangeText={setManualInput}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.manualSubmitBtn} onPress={handleManualSubmit}>
              <Text style={styles.manualSubmitText}>Verify QR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.toggleManualBtn} onPress={() => setShowManual(!showManual)}>
          <Text style={styles.toggleManualText}>{showManual ? 'Use Camera' : 'Enter Manually'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.demoBtn} onPress={handleDemoScan}>
          <Text style={styles.demoBtnText}>⚡ Demo Scan (Valid)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const FRAME_SIZE = SCREEN_W * 0.7;

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
  errorBanner: {
    backgroundColor: COLORS.dangerLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  errorBannerText: { color: COLORS.danger, fontWeight: '700', flex: 1 },
  errorDismiss: { color: COLORS.primary, fontWeight: '700', marginLeft: 12 },
  cameraWrap: { flex: 1 },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 25, height: 25, borderColor: COLORS.white },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanHint: { color: COLORS.white, fontSize: 14, fontWeight: '700', marginTop: 30 },
  manualWrap: { flex: 1, padding: 30, justifyContent: 'center' },
  manualTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  manualInput: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, borderWidth: 1.5, borderColor: COLORS.border, minHeight: 120, textAlignVertical: 'top' },
  manualSubmitBtn: { backgroundColor: COLORS.primary, borderRadius: 15, padding: 18, alignItems: 'center', marginTop: 20 },
  manualSubmitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  permTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  permDesc: { textAlign: 'center', color: COLORS.textSecondary, marginBottom: 30 },
  permBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30 },
  permBtnText: { color: COLORS.white, fontWeight: '700' },
  bottomActions: { padding: 20, backgroundColor: COLORS.white, gap: 10 },
  toggleManualBtn: { alignItems: 'center', padding: 10 },
  toggleManualText: { color: COLORS.primary, fontWeight: '700' },
  demoBtn: { backgroundColor: COLORS.successLight, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.success },
  demoBtnText: { color: COLORS.success, fontWeight: '700' },
});
