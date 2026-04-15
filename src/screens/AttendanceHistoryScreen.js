import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Platform,
  Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import { useApp } from '../context/AppContext';

const { width: SCREEN_W } = Dimensions.get('window');

function SmallAvatar({ name, color, size = 44 }) {
  const initials = (name || 'S')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <View
      style={[
        styles.smallAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || COLORS.primary,
        },
      ]}
    >
      <Text style={[styles.smallAvatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

function FullScreenModal({ visible, onClose, item }) {
  if (!item) return null;
  const avatarColor =
    COLORS.avatarColors[
      parseInt((item.erp || '0').slice(-1), 10) % COLORS.avatarColors.length
    ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Photo */}
        <View style={styles.modalPhotoWrap}>
          <View
            style={[
              styles.modalAvatar,
              { backgroundColor: avatarColor },
            ]}
          >
            <Text style={styles.modalAvatarText}>
              {(item.studentName || 'S')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.modalInfo}>
          <Text style={styles.modalName}>{item.studentName}</Text>
          <Text style={styles.modalErp}>ERP: {item.erp}</Text>
          <Text style={styles.modalDate}>
            {item.date} at {item.time}
          </Text>
          {item.eventId && (
            <Text style={styles.modalEvent}>Event: {item.eventId}</Text>
          )}
        </View>

        {/* Close */}
        <TouchableOpacity
          style={styles.modalCloseBtn}
          onPress={onClose}
          id="btn-modal-close"
        >
          <Text style={styles.modalCloseBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function AttendanceHistoryScreen({ navigation, route }) {
  const { state } = useApp();
  const role = route?.params?.role || 'student';
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter logs based on role
  const logs = role === 'student'
    ? state.attendanceLogs.filter((l) => l.erp === state.studentData?.erp)
    : state.attendanceLogs;

  const openDetail = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item, index }) => {
    const avatarColor =
      COLORS.avatarColors[
        parseInt((item.erp || '0').slice(-1), 10) % COLORS.avatarColors.length
      ];

    return (
      <TouchableOpacity
        style={styles.logItem}
        activeOpacity={0.75}
        onPress={() => openDetail(item)}
      >
        <SmallAvatar name={item.studentName} color={avatarColor} />
        <View style={styles.logTextWrap}>
          <Text style={styles.logName}>{item.studentName}</Text>
          <Text style={styles.logMeta}>
            ERP: {item.erp}  ·  {item.date}
          </Text>
          {item.eventId && (
            <Text style={styles.logEvent}>Event: {item.eventId}</Text>
          )}
        </View>
        <View style={styles.logTimeWrap}>
          <Text style={styles.logTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Records Yet</Text>
      <Text style={styles.emptyDesc}>
        {role === 'student'
          ? 'Your attendance records will appear here after check-in'
          : 'Scanned student records will appear here'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          id="btn-history-back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {role === 'student' ? 'My Attendance' : 'Scan Logs'}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{logs.length}</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={logs.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Full-screen photo modal */}
      <FullScreenModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />
    </SafeAreaView>
  );
}

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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
  },
  emptyContainer: { flex: 1 },
  /* Log items */
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  smallAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  smallAvatarText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  logTextWrap: { flex: 1 },
  logName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  logMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  logEvent: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  logTimeWrap: { marginLeft: 10 },
  logTime: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  /* Empty state */
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  /* Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalPhotoWrap: {
    marginBottom: 36,
  },
  modalAvatar: {
    width: SCREEN_W * 0.5,
    height: SCREEN_W * 0.5,
    borderRadius: SCREEN_W * 0.25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
      web: { boxShadow: '0 10px 40px rgba(0,0,0,0.4)' },
    }),
  },
  modalAvatarText: {
    fontSize: SCREEN_W * 0.16,
    fontWeight: '900',
    color: COLORS.white,
  },
  modalInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  modalName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  modalErp: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryGlow,
    marginBottom: 6,
  },
  modalDate: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
    marginBottom: 4,
  },
  modalEvent: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalCloseBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
