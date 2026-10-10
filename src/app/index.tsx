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
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'Awaiting fix...';
  }

  const alphabet = '23456789CFGHJMPQRVWX';

  const lat = Math.min(90 - 1e-12, Math.max(-90, latitude));
  const lng = ((longitude + 180) % 360 + 360) % 360 - 180;

  let latValue = Math.floor((lat + 90) * 8000);
  let lngValue = Math.floor((lng + 180) * 8000);

  const divisors = [160000, 8000, 400, 20, 1];
  let code = '';

  for (let i = 0; i < divisors.length; i++) {
    const divisor = divisors[i];

    const latDigit = Math.floor(latValue / divisor);
    const lngDigit = Math.floor(lngValue / divisor);

    code += alphabet[latDigit] + alphabet[lngDigit];

    latValue %= divisor;
    lngValue %= divisor;

    if (i === 3) {
      code += '+';
    }
  }

  return code;
}


export default function FieldTestScreen() {
  const [activeScenario, setActiveScenario] = useState<'CONCOURSE' | 'IN_SEAT' | 'DEAD_ZONE'>('CONCOURSE');
  const [statusMessage, setStatusMessage] = useState('Initializing sensors...');
  const [currentPlusCode, setCurrentPlusCode] = useState<string>('Searching...');
const [nearbyPhone, setNearbyPhone] = useState<string>('No phone detected');
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
TriPointBle.updatePayload(`TriPoint|Nearby|${code}`);
setStatusMessage('Sensors locked');
      
    })();
  }, []);

useEffect(() => {
  const peerListener = TriPointBle.addListener(
    'onPeer',
    (event: { id: string; payload: string; seenAt: number }) => {
      if (event.payload.startsWith('TriPoint|Nearby|')) {
        const code = event.payload.split('|')[2];
        setNearbyPhone(code || 'Location unavailable');
      }
    }
  );

  TriPointBle.start();

  return () => {
    peerListener.remove();
    TriPointBle.stop();
  };
}, []);

  return () => {
    TriPointBle.stop();
  };
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
<Text style={styles.plusCodeLabel}>Nearby TriPoint Phone:</Text>
<Text style={styles.plusCodeVal}>{nearbyPhone}</Text>
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
