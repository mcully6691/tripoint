import RNFS from 'react-native-fs';

export interface FieldTestMetric {
  timestamp: string;
  scenario: 'CONCOURSE' | 'IN_SEAT' | 'DEAD_ZONE';
  rssi: number;             // Signal strength (-100 to 0 dBm)
  peerId: string;           // Masked identifier of target phone
  vectorAngle: number;      // Compass vector heading (0-360 degrees)
  handshakeLatencyMs: number; // Time to complete offline signature check
  batteryLevel: number;     // 0.0 to 1.0
}

const LOG_FILE_PATH = `${RNFS.DocumentDirectoryPath}/tripoint_field_test.csv`;

// Initialize CSV header
export const initTestLogger = async (): Promise<void> => {
  const fileExists = await RNFS.exists(LOG_FILE_PATH);
  if (!fileExists) {
    const headers = 'Timestamp,Scenario,RSSI,PeerID,VectorAngle,HandshakeLatencyMs,BatteryLevel\n';
    await RNFS.writeFile(LOG_FILE_PATH, headers, 'utf8');
  }
};

// Log a single test event during match day
export const logMetric = async (metric: FieldTestMetric): Promise<void> => {
  const row = `${metric.timestamp},${metric.scenario},${metric.rssi},${metric.peerId},${metric.vectorAngle},${metric.handshakeLatencyMs},${metric.batteryLevel}\n`;
  await RNFS.appendFile(LOG_FILE_PATH, row, 'utf8');
};

// Retrieve CSV location for post-match analysis
export const getLogPath = (): string => LOG_FILE_PATH;