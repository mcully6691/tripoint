import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Magnetometer } from 'expo-sensors';

const PEER_USERS = [
  {
    id: '1',
    name: 'Alex',
    vibe: 'Coffee & Code',
    grid: '56H8+PC4W',
    distance: '12m',
    rawDistance: 12,
    top: '30%',
    left: '60%',
  },
  {
    id: '2',
    name: 'Sarah',
    vibe: 'Casual Chat',
    grid: '56H8+PC4V',
    distance: '45m',
    rawDistance: 45,
    top: '65%',
    left: '25%',
  },
  {
    id: '3',
    name: 'Jordan',
    vibe: 'Co-working',
    grid: '56H8+PC3X',
    distance: '80m',
    rawDistance: 80,
    top: '20%',
    left: '20%',
  },
];

const RANGE_OPTIONS = [
  { label: 'All', value: Infinity },
  { label: '50m', value: 50 },
  { label: '100m', value: 100 },
  { label: '500m', value: 500 },
];

export default function ExploreScreen() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRange, setSelectedRange] = useState(Infinity);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const subscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setHeading(Math.round(angle));
    });

    return () => subscription && subscription.remove();
  }, []);

  const visibleUsers = PEER_USERS.filter((user) => user.rawDistance <= selectedRange);

  const getCardinalDirection = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return 'N';
    if (deg >= 22.5 && deg < 67.5) return 'NE';
    if (deg >= 67.5 && deg < 112.5) return 'E';
    if (deg >= 112.5 && deg < 157.5) return 'SE';
    if (deg >= 157.5 && deg < 202.5) return 'S';
    if (deg >= 202.5 && deg < 247.5) return 'SW';
    if (deg >= 247.5 && deg < 292.5) return 'W';
    if (deg >= 292.5 && deg < 337.5) return 'NW';
    return 'N';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Proximity Map</Text>
            <Text style={styles.subtitle}>Visual Grid Radar</Text>
          </View>
          <View style={styles.compassBadge}>
            <Text style={styles.compassDegree}>{heading}°</Text>
            <Text style={styles.compassCard}>{getCardinalDirection(heading)}</Text>
          </View>
        </View>
      </View>

      {/* Range Filter Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Max Radius:</Text>
        <View style={styles.filterButtonsContainer}>
          {RANGE_OPTIONS.map((opt) => {
            const isActive = selectedRange === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => setSelectedRange(opt.value)}
              >
                <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.gridOverlay}>
          {/* Compass Orientation Identifiers */}
          <Text style={[styles.directionText, styles.north]}>N</Text>
          <Text style={[styles.directionText, styles.south]}>S</Text>
          <Text style={[styles.directionText, styles.east]}>E</Text>
          <Text style={[styles.directionText, styles.west]}>W</Text>

          {/* Radar Grid Lines */}
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />

          {/* User Marker */}
          <View style={[styles.marker, styles.userMarker]}>
            <Text style={styles.markerText}>YOU</Text>
          </View>

          {/* Filtered Nearby User Markers */}
          {visibleUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              activeOpacity={0.7}
              style={[
                styles.marker,
                styles.peerMarker,
                { top: user.top, left: user.left },
              ]}
              onPress={() => setSelectedUser(user)}
            >
              <Text style={styles.peerText}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.mapFooter}>
          Heading: {heading}° ({getCardinalDirection(heading)}) • {visibleUsers.length} in range
        </Text>
      </View>

      {/* User Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedUser !== null}
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedUser.name}</Text>
                  <Text style={styles.modalDistance}>{selectedUser.distance}</Text>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.modalLabel}>Current Vibe</Text>
                  <Text style={styles.modalVibe}>"{selectedUser.vibe}"</Text>

                  <Text style={styles.modalLabel}>Grid Coordinate</Text>
                  <Text style={styles.modalGrid}>{selectedUser.grid}</Text>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedUser(null)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  compassBadge: {
    backgroundColor: '#0F2942',
    borderColor: '#38BDF8',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  compassDegree: {
    color: '#34D399',
    fontWeight: 'bold',
    fontSize: 16,
  },
  compassCard: {
    color: '#38BDF8',
    fontWeight: '600',
    fontSize: 11,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 10,
  },
  filterLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  filterBtnActive: {
    backgroundColor: '#38BDF8',
  },
  filterBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterBtnTextActive: {
    color: '#0F172A',
  },
  mapCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridOverlay: {
    width: '100%',
    height: '85%',
    backgroundColor: '#0F2942',
    borderRadius: 12,
    borderColor: '#38BDF8',
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  directionText: {
    position: 'absolute',
    color: 'rgba(56, 189, 248, 0.4)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  north: { top: 8 },
  south: { bottom: 8 },
  east: { right: 10 },
  west: { left: 10 },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  gridLineVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  marker: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    position: 'absolute',
  },
  userMarker: {
    backgroundColor: '#34D399',
  },
  markerText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 11,
  },
  peerMarker: {
    backgroundColor: '#38BDF8',
  },
  peerText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 12,
  },
  mapFooter: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34D399',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  modalVibe: {
    color: '#38BDF8',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalGrid: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
