import ExpoModulesCore
import CoreBluetooth

// Foreground-only two-way BLE. Both phones advertise the same service and scan.
public class TriPointBleModule: Module, CBCentralManagerDelegate, CBPeripheralManagerDelegate, CBPeripheralDelegate {
  private let serviceID = CBUUID(string: "A31D4C20-67B8-4E56-A942-77E1C6B29A11")
  private let characteristicID = CBUUID(string: "A31D4C21-67B8-4E56-A942-77E1C6B29A11")
  private var central: CBCentralManager?
  private var peripheralManager: CBPeripheralManager?
  private var localCharacteristic: CBMutableCharacteristic?
  private var peers: [UUID: CBPeripheral] = [:]
  private var payload = "TriPoint|Nearby|Searching"
  private var started = false

  public func definition() -> ModuleDefinition {
    Name("TriPointBle")
    Events("onPeer", "onState")
    Function("start") { () -> Void in
      DispatchQueue.main.async {
        self.started = true
        if self.central == nil { self.central = CBCentralManager(delegate: self, queue: nil) }
        if self.peripheralManager == nil { self.peripheralManager = CBPeripheralManager(delegate: self, queue: nil) }
        self.activateIfReady()
      }
    }
    Function("updatePayload") { (value: String) -> Void in
      DispatchQueue.main.async {
        // Characteristic reads carry the payload; do not put it into advertising data.
        self.payload = String(value.prefix(150))
        self.localCharacteristic?.value = self.payload.data(using: .utf8)
      }
    }
    Function("stop") { () -> Void in
      DispatchQueue.main.async {
        self.started = false
        self.central?.stopScan()
        self.peripheralManager?.stopAdvertising()
        for p in self.peers.values { self.central?.cancelPeripheralConnection(p) }
        self.peers.removeAll()
        self.sendEvent("onState", ["status": "Stopped"])
      }
    }
  }

  private func activateIfReady() {
    guard started else { return }
    if central?.state == .poweredOn {
      central?.scanForPeripherals(withServices: [serviceID], options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
      sendEvent("onState", ["status": "Scanning for TriPoint phones"])
    }
    if peripheralManager?.state == .poweredOn {
      let characteristic = CBMutableCharacteristic(type: characteristicID, properties: [.read], value: nil, permissions: [.readable])
      localCharacteristic = characteristic
      let service = CBMutableService(type: serviceID, primary: true)
      service.characteristics = [characteristic]
      peripheralManager?.removeAllServices()
      peripheralManager?.add(service)
    }
  }

  public func centralManagerDidUpdateState(_ central: CBCentralManager) {
    if central.state == .poweredOn { activateIfReady() }
    else { sendEvent("onState", ["status": "Bluetooth unavailable (state \(central.state.rawValue))"]) }
  }
  public func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    if peripheral.state == .poweredOn { activateIfReady() }
    else { sendEvent("onState", ["status": "Bluetooth advertising unavailable"]) }
  }
  public func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
    guard started, error == nil else { return }
    peripheral.startAdvertising([CBAdvertisementDataServiceUUIDsKey: [serviceID], CBAdvertisementDataLocalNameKey: "TriPoint"])
  }
  public func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
    guard request.characteristic.uuid == characteristicID, let bytes = payload.data(using: .utf8) else {
      peripheral.respond(to: request, withResult: .attributeNotFound); return
    }
    guard request.offset <= bytes.count else { peripheral.respond(to: request, withResult: .invalidOffset); return }
    request.value = bytes.subdata(in: request.offset..<bytes.count)
    peripheral.respond(to: request, withResult: .success)
  }
  public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
    guard started, peers[peripheral.identifier] == nil else { return }
    peers[peripheral.identifier] = peripheral
    peripheral.delegate = self
    central.connect(peripheral, options: nil)
  }
  public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    peripheral.discoverServices([serviceID])
  }
  public func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    guard error == nil else { return }
    for service in peripheral.services ?? [] where service.uuid == serviceID {
      peripheral.discoverCharacteristics([characteristicID], for: service)
    }
  }
  public func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
    guard error == nil else { return }
    for characteristic in service.characteristics ?? [] where characteristic.uuid == characteristicID {
      peripheral.readValue(for: characteristic)
    }
  }
  public func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
    guard error == nil, let data = characteristic.value, let value = String(data: data, encoding: .utf8) else { return }
    sendEvent("onPeer", ["id": peripheral.identifier.uuidString, "payload": value, "seenAt": Date().timeIntervalSince1970 * 1000])
    central?.cancelPeripheralConnection(peripheral)
  }
  public func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
    peers.removeValue(forKey: peripheral.identifier)
  }
  public func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    peers.removeValue(forKey: peripheral.identifier)
    // Allow the next scan result to reconnect and fetch a fresh position.
    if started, central.state == .poweredOn {
      central.stopScan()
      central.scanForPeripherals(withServices: [serviceID], options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
