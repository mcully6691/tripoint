import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decodeBlePayload, encodeBlePayload } from './blePayload';

// Built-in Google Plus Code Generator (100% Offline)
function encodePlusCode(latitude: number, longitude: number) {

  const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
  let lat = Math.min(Math.max(latitude, -90), 90) + 90;
  let lng = longitude;
  while (lng < -180) lng += 360;
  while (lng >= 180) lng -= 360;
  lng += 180;

  let latVal = Math.floor(lat * 8000);
  let lngVal = Math.floor(lng * 8000);

  let code = '';
  code += CODE_ALPHABET[Math.floor(latVal / 320000)] + CODE_ALPHABET[Math.floor(lngVal / 320000)];
  latVal %= 320000; lngVal %= 320000;

  code += CODE_ALPHABET[Math.floor(latVal / 16000)] + CODE_ALPHABET[Math.floor(lngVal / 16000)];
  latVal %= 16000; lngVal %= 16000;

  code += '+';

  code += CODE_ALPHABET[Math.floor(latVal / 800)] + CODE_ALPHABET[Math.floor(lngVal / 800)];
  latVal %= 800; lngVal %= 800;

  code += CODE_ALPHABET[Math.floor(latVal / 40)] + CODE_ALPHABET[Math.floor(lngVal / 40)];

  return code;
}

// Haversine Distance Formula
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const MOCK_BLE_BROADCASTS = [
  { rawPayload: 'Alex|Coffee & Code|56H8+PC4W', latOffset: 0.00015, lngOffset: 0.00010, rssi: -62 },
  { rawPayload: 'Sarah|Casual Chat|56H8+PC4V', latOffset: 0.00045, lngOffset: -0.00030, rssi: -78 },
  { rawPayload: 'Jordan|Co-working|56H8+PC3X', latOffset: -0.00080, lngOffset: 0.00060, rssi: -85 },
];

const RANGE_OPTIONS = [
  { label: 'All', value: Infinity },
  { label: '50m', value: 50 },
  { label: '100m', value: 100 },
  { label: '500m', value: 500 },
];

const VIBE_STORAGE_KEY = '@tripoint_user_vibe';

export default function RadarScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [primaryLoc, setPrimaryLoc] = useState<string | null>(null)
  const [gridCode, setGridCode] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; vibe: string; grid: string; distance: string; rawDistance: number;rssi: number }>>([]);
  const [selectedRange, setSelectedRange] = useState(Infinity);
  const [activePayload, setActivePayload] = useState('');

  // User Vibe State
  const [userVibe, setUserVibe] = useState('Open to Connect');
  const [vibeInput, setVibeInput] = useState('');
  const [isEditingVibe, setIsEditingVibe] = useState(false);

  // Load saved vibe from local storage on launch
  useEffect(() => {
    (async () => {
      try {
        const savedVibe = await AsyncStorage.getItem(VIBE_STORAGE_KEY);
        if (savedVibe !== null) {
          setUserVibe(savedVibe);
        }
      } catch (err) {
        console.log('Error loading saved vibe:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      const lat = currentLocation.coords.latitude;
      const lng = currentLocation.coords.longitude;

      // Plus Code Generation
      const generatedCode = encodePlusCode(lat, lng);
      setGridCode(`Grid: ${generatedCode}`);

      // Encode Local User's Outgoing BLE Payload
      const localBlePayload = encodeBlePayload('You', userVibe, generatedCode);
      setActivePayload(localBlePayload);

      // Process Incoming BLE Packets
      const decodedPeers = MOCK_BLE_BROADCASTS.map((item) => {
        const decoded = decodeBlePayload(item.rawPayload, item.rssi);
        const userLat = lat + item.latOffset;
        const userLng = lng + item.lngOffset;
        const meters = getDistanceInMeters(lat, lng, userLat, userLng);

        return {
          id: decoded?.id || Math.random().toString(),
          name: decoded?.name || 'Peer',
          vibe: decoded?.vibe || 'Active',
          grid: decoded?.gridCode || 'N/A',
          distance: meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`,
          rawDistance: meters,
          rssi: item.rssi,
        };
      }).sort((a, b) => a.rawDistance - b.rawDistance);

      setAllUsers(decodedPeers);

      // Native Reverse Geocoding
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          const postal = place.postalCode || '';
          const town = place.city || place.subregion || place.district || place.region || '';

          if (postal && town) {
            setPrimaryLoc(`${postal}, ${town}`);
          } else if (town) {
            setPrimaryLoc(town);
          } else {
            setPrimaryLoc(`Grid Zone ${generatedCode.substring(0, 4)}`);
          }
        } else {
          setPrimaryLoc(`Grid Zone ${generatedCode.substring(0, 4)}`);
        }
      } catch (err) {
        setPrimaryLoc(`Grid Zone ${generatedCode.substring(0, 4)}`);
      }
    })();
  }, [userVibe]);

  const handleSaveVibe = async () => {
    if (vibeInput.trim().length > 0) {
      const updatedVibe = vibeInput.trim();
      setUserVibe(updatedVibe);
      setVibeInput('');

      // Persist to local device storage
      try {
        await AsyncStorage.setItem(VIBE_STORAGE_KEY, updatedVibe);
      } catch (err) {
        console.log('Error saving vibe:', err);
      }
    }
    setIsEditingVibe(false);
    Keyboard.dismiss();
  };

  const filteredUsers = allUsers.filter((u) => u.rawDistance <= selectedRange);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TriPoint Radar</Text>
        <Text style={styles.subtitle}>Proximity Grid Active (3x3m)</Text>
      </View>

      {/* Your Live Location & Status Card */}
      <View style={styles.gpsCard}>
        <Text style={styles.gpsTitle}>Your Live Location</Text>
        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : primaryLoc ? (
          <View>
            <Text style={styles.gridText}>{primaryLoc}</Text>
            <Text style={styles.subGridText}>{gridCode}</Text>

            {/* Vibe Status Display & Input */}
            <View style={styles.vibeContainer}>
              <Text style={styles.vibeLabel}>Current Vibe:</Text>
              {isEditingVibe ? (
                <View style={styles.vibeInputRow}>
                  <TextInput
                    style={styles.vibeInput}
                    placeholder="e.g. Coffee & Code"
                    placeholderTextColor="#64748B"
                    value={vibeInput}
                    onChangeText={setVibeInput}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVibe}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.vibeDisplayRow}>
                  <Text style={styles.vibeText}>"{userVibe}"</Text>
                  <TouchableOpacity onPress={() => setIsEditingVibe(true)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Outgoing BLE Payload Banner */}
            <View style={styles.blePayloadBox}>
              <Text style={styles.blePayloadLabel}>BLE Broadcast Payload (31B Max):</Text>
              <Text style={styles.blePayloadText}>{activePayload || 'Encoding...'}</Text>
            </View>

            {location && (
              <Text style={styles.coordsSubtext}>
                Lat: {location.coords.latitude.toFixed(5)} | Long: {location.coords.longitude.toFixed(5)}
              </Text>
            )}
          </View>
        ) : (
          <ActivityIndicator color="#38BDF8" style={{ marginTop: 8 }} />
        )}
      </View>

      {/* Range Filter Selector */}
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Max Range:</Text>
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

      {/* Radar Feed */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found within this range.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardVibe}>{item.vibe}</Text>
              <Text style={styles.cardW3w}>{item.grid}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardDistance}>{item.distance}</Text>
              <Text style={styles.cardRssi}>{item.rssi} dBm</Text>
            </View>
          </View>
        )}
      />
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
    marginBottom: 16,
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
  gpsCard: {
    backgroundColor: '#0F2942',
    borderColor: '#38BDF8',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  gpsTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gridText: {
    color: '#34D399',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  subGridText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  vibeContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.2)',
  },
  vibeLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  vibeDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  vibeText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  editBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  vibeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  vibeInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    borderColor: '#38BDF8',
    borderWidth: 1,
  },
  saveBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  saveBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  blePayloadBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
  },
  blePayloadLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  blePayloadText: {
    color: '#38BDF8',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  coordsSubtext: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 6,
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  cardVibe: {
    fontSize: 14,
    color: '#38BDF8',
    marginTop: 2,
  },
  cardW3w: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34D399',
  },
  cardRssi: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
});