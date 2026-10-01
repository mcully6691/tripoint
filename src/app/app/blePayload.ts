// TriPoint BLE Payload Encoder / Decoder (Offline Native)

export interface PeerDeviceData {
  id: string;
  name: string;
  vibe: string;
  gridCode: string;
  timestamp: number;
}

/**
 * Encodes local state into a compact BLE advertisement string (Max ~31 bytes)
 */
export function encodeBlePayload(name: string, vibe: string, gridCode: string): string {
  const shortName = name.slice(0, 8);
  const shortVibe = vibe.slice(0, 10);
  const cleanGrid = gridCode.replace('Grid: ', '').trim();
 
  return `${shortName}|${shortVibe}|${cleanGrid}`;
}

/**
 * Decodes incoming BLE advertisement payload from a nearby peer device
 */
export function decodeBlePayload(rawPayload: string, rssi: number): PeerDeviceData | null {
  try {
    const parts = rawPayload.split('|');
    if (parts.length < 3) return null;

    const [name, vibe, gridCode] = parts;

    return {
      id: `ble_${Math.random().toString(36).substring(2, 9)}`,
      name: name || 'Peer',
      vibe: vibe || 'Nearby',
      gridCode: gridCode || 'Unknown',
      timestamp: Date.now(),
    };
  } catch (err) {
    return null;
  }
}
