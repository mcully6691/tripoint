import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { logMetric, initTestLogger } from './logger';

export default function FieldTestScreen() {
  const [activeScenario, setActiveScenario] = useState<'CONCOURSE' | 'IN_SEAT' | 'DEAD_ZONE'>('CONCOURSE');
  const [statusMessage, setStatusMessage] = useState('Ready for field test');

  React.useEffect(() => {
    initTestLogger();
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
    setStatusMessage(`Logged [${activeScenario}] sample at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TriPoint Field Test</Text>
     
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
        <Text style={styles.logButtonText}>LOG TELEMETRY POINT</Text>
      </TouchableOpacity>

      <Text style={styles.status}>{statusMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#121212' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 20, textAlign: 'center' },
  scenarioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  chip: { padding: 10, borderRadius: 8, backgroundColor: '#333' },
  activeChip: { backgroundColor: '#007ACC' },
  chipText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  logButton: { backgroundColor: '#28A745', padding: 18, borderRadius: 12, alignItems: 'center' },
  logButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  status: { color: '#AAA', marginTop: 20, textAlign: 'center', fontSize: 13 }
});
