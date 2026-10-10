import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { initTestLogger, logMetric } from '../../logger';
import TriPointBle from '../../modules/tripoint-ble';


// Built-in Google Plus Code Generator (100% Offline)
function encodePlusCode(latitude: number, longitude: number): string {
  if (latitude == null|| longitude == null) return 'Awaiting fix...';
  const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
  let lat = Math.min(Math.max(latitude, -90), 90) + 90;
  let lng = longitude;
  while (lng < -180) lng += 360;
  while (lng > 180) lng -= 360;
  lng += 180;

  let latVal = Math.floor(lat * 8000);
  let lngVal = Math.floor(lng * 8000);

  let code = '';
  code += CODE_ALPHABET[Math.floor(latVal / 320000)] + CODE_ALPHABET[Math.floor(lngVal / 320000)];
  latVal %= 320000; lngVal %= 320000;

  code += CODE_ALPHABET[Math.floor(latVal / 16000)] + CODE_ALPHABET[Math.floor(lngVal / 16000)];
  latVal %= 16000; lngVal %= 16000;

  code += CODE_ALPHABET[Math.floor(latVal / 800)] + CODE_ALPHABET[Math.floor(lngVal / 800)];
  latVal %= 800; lngVal %= 800;

  code += CODE_ALPHABET[Math.floor(latVal / 40)] + CODE_ALPHABET[Math.floor(lngVal / 40)];
  latVal %= 40; lngVal %= 40;

  code += '+' + CODE_ALPHABET[latVal * 2 / 40] + CODE_ALPHABET[lngVal * 2 / 40];
  return code;
}

export default function FieldTestScreen() {
  const [activeScenario, setActiveScenario] = useState<'CONCOURSE' | 'IN_SEAT' | 'DEAD_ZONE'>('CONCOURSE');
  const [statusMessage, setStatusMessage] = useState('Initializing sensors...');
  const [currentPlusCode, setCurrentPlusCode] = useState<string>('Searching...');

  useEffect(() => {
    initTestLogger();
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatusMessage('Location permission denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const code = encodePlusCode(loc.coords.latitude, loc.coords.longitude);
      setCurrentPlusCode(code);
      setStatusMessage('Sensors locked');
    })();
  }, []);

  const handleLogSample = async () => {
    await logMetric({
      timestamp: new Date().toISOString(),
      scenario: activeScenario,
      rssi: Math.floor(Math.random() * (-40 - -95 + 1)) + -95,
      peerId: 'peer_node_alpha',
      vectorAngle: 184.5,
      handshakeLatencyMs: 42,
      batteryLevel: 0.88,
    });
    setStatusMessage(`Logged [${activeScenario}] point at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>TriPoint Field Harness</Text>
      <Text style={styles.plusCodeLabel}>Offline Grid Location:</Text>
      <Text style={styles.plusCodeVal}>{currentPlusCode}</Text>

      <View style={styles.scenarioRow}>
        {(['CONCOURSE', 'IN_SEAT', 'DEAD_ZONE'] as const).map((scenario) => (
          <TouchableOpacity
            key={scenario}
            style={[styles.chip, activeScenario === scenario && styles.activeChip]}
            onPress={() => setActiveScenario(scenario)}
          >
            <Text style={styles.chipText}>{scenario}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logButton} onPress={handleLogSample}>
        <Text style={styles.logButtonText}>LOG TELEMETRY SAMPLE</Text>
      </TouchableOpacity>

      <Text style={styles.status}>{statusMessage}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#121212' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 10, textAlign: 'center' },
  plusCodeLabel: { color: '#888', textAlign: 'center', fontSize: 12 },
  plusCodeVal: { color: '#00E5FF', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  scenarioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  chip: { padding: 10, borderRadius: 8, backgroundColor: '#222' },
  activeChip: { backgroundColor: '#007ACC' },
  chipText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  logButton: { backgroundColor: '#28A745', padding: 18, borderRadius: 12, alignItems: 'center' },
  logButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  status: { color: '#AAA', marginTop: 20, textAlign: 'center', fontSize: 13 }
});
