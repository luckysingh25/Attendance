import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';

function Avatar({ name, color, size = 72, imageUrl }) {
  const initials = (name || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || COLORS.primary,
          overflow: 'hidden',
        },
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: size, height: size }} />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
      )}
    </View>
  );
}

export default function StudentHomeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const student = state.studentData;
  const myLogs = state.attendanceLogs.filter(
    (l) => l.erp === student?.erp
  );

  const [uploading, setUploading] = React.useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigation.reset({ index: 0, routes: [{ name: 'Start' }] });
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        setUploading(true);
        const asset = result.assets[0];
        const data = await uploadPhoto(student.erp, asset.uri, asset.mimeType);
        
        // Update local state with the new photo URL from backend
        const updatedStudent = { ...student, photoUrl: data.photoUrl };
        dispatch({ type: 'SET_STUDENT_DATA', payload: updatedStudent });
        
        Alert.alert('Success', 'Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Avatar
                name={student?.name}
                color={student?.avatarColor}
                size={70}
                imageUrl={student?.photoUrl}
              />
              <TouchableOpacity 
                style={styles.editPhotoIcon} 
                onPress={handlePickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={{ fontSize: 12 }}>📷</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              id="btn-student-logout"
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.studentName}>{student?.name || 'Student'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ERP: {student?.erp}</Text>
            </View>
            {student?.course && (
              <View style={[styles.badge, { backgroundColor: COLORS.successLight }]}>
                <Text style={[styles.badgeText, { color: COLORS.success }]}>
                  {student.course}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stat */}
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{myLogs.length}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.scanBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('StudentScanner', { role: 'student' })}
            id="btn-student-scan"
          >
            <Text style={styles.scanIcon}>📱</Text>
            <Text style={styles.scanTitle}>Scan QR</Text>
            <Text style={styles.scanDesc}>Scan event QR to check in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('History', { role: 'student' })}
            id="btn-student-history"
          >
            <Text style={styles.historyIcon}>📜</Text>
            <View style={styles.historyTextWrap}>
              <Text style={styles.historyTitle}>Attendance History</Text>
              <Text style={styles.historyDesc}>
                {myLogs.length} {myLogs.length === 1 ? 'entry' : 'entries'} recorded
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
    }),
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  editPhotoIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.successLight,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.success,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsWrap: { gap: 14, flex: 1 },
  scanBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 32,
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
  scanIcon: { fontSize: 40, marginBottom: 10 },
  scanTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 3,
  },
  scanDesc: {
    fontSize: 13,
    color: '#93C5FD',
    fontWeight: '500',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  historyIcon: { fontSize: 28, marginRight: 16 },
  historyTextWrap: { flex: 1 },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  historyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
