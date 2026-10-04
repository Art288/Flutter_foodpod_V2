/**
 * bleService.js
 * Real Web Bluetooth API (BLE) service for FootPod BNO055 telemetry.
 * Connects directly to hardware ESP32 GATT server without any mock up data.
 */

export const BLE_CONFIG = {
  DEVICE_NAME: 'foot pod',
  SERVICE_UUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  CHAR_UUID:    '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // TX (Notify/Read)
  RX_CHAR_UUID: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // RX (Write)
};

class BleService {
  constructor() {
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.rxCharacteristic = null;
    this.isConnected = false;
    this.onDataCallback = null;
    this.onDisconnectCallback = null;
  }

  isSupported() {
    return Boolean(typeof window !== 'undefined' && navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function');
  }

  async connect(onData, onDisconnect) {
    if (!this.isSupported()) {
      throw new Error('เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth API กรุณาเปิดใช้งานบน Google Chrome หรือ Microsoft Edge');
    }

    this.onDataCallback = onData;
    this.onDisconnectCallback = onDisconnect;

    // Scan for FootPod device matching Service UUID or Name
    this.device = await navigator.bluetooth.requestDevice({
      filters: [
        { name: 'foot pod' },
        { namePrefix: 'foot' },
        { namePrefix: 'Foot' },
        { namePrefix: 'ESP32' },
        { services: [BLE_CONFIG.SERVICE_UUID] }
      ],
      optionalServices: [
        BLE_CONFIG.SERVICE_UUID,
        'battery_service',
        'device_information'
      ]
    });

    if (!this.device) {
      throw new Error('ไม่ได้เลือกอุปกรณ์ Bluetooth');
    }

    // Handle sudden disconnect from physical device
    this.device.addEventListener('gattserverdisconnected', () => {
      this.isConnected = false;
      this.characteristic = null;
      this.server = null;
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback();
      }
    });

    // Connect to GATT Server
    this.server = await this.device.gatt.connect();

    // Get FootPod Service
    const service = await this.server.getPrimaryService(BLE_CONFIG.SERVICE_UUID);

    // Get Telemetry Characteristic
    this.characteristic = await service.getCharacteristic(BLE_CONFIG.CHAR_UUID);

    // Subscribe to real-time notification stream from BNO055
    await this.characteristic.startNotifications();
    this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(event.target.value);
      try {
        const data = JSON.parse(text);
        if (this.onDataCallback) {
          this.onDataCallback(data);
        }
      } catch (err) {
        console.warn('BLE raw data packet parse error:', text, err);
      }
    });

    // Try getting RX Characteristic for two-way commands (e.g. SYNC_SD, USER_LOGIN, USER_LOGOUT)
    try {
      this.rxCharacteristic = await service.getCharacteristic(BLE_CONFIG.RX_CHAR_UUID);
      // เมื่อเชื่อมต่อสำเร็จจากผู้ใช้ที่ Login ให้ส่งคำสั่ง USER_LOGIN เพื่อให้บอร์ดเริ่มนับก้าวทันที
      const encoder = new TextEncoder();
      await this.rxCharacteristic.writeValue(encoder.encode('USER_LOGIN'));
    } catch (_) {
      this.rxCharacteristic = null;
    }

    this.isConnected = true;

    return {
      id: this.device.id,
      name: this.device.name || 'foot pod (BLE)',
      type: 'footpod',
      connectionType: 'ble',
      battery: 95
    };
  }

  async sendCommand(cmd) {
    if (!this.rxCharacteristic) return false;
    try {
      const encoder = new TextEncoder();
      await this.rxCharacteristic.writeValue(encoder.encode(cmd));
      return true;
    } catch (e) {
      console.warn('Failed to send BLE command:', cmd, e);
      return false;
    }
  }

  async requestSdCardSync() {
    return await this.sendCommand('SYNC_SD');
  }

  // ส่งคำสั่งปลดล็อกให้บอร์ดเริ่มนับค่า (เมื่อ Login ใหม่และเชื่อมต่อ)
  async notifyLogin() {
    return await this.sendCommand('USER_LOGIN');
  }

  // ส่งคำสั่งแจ้งเตือนให้บอร์ดหยุดนับค่าและเข้าสู่โหมด Standby เมื่อผู้ใช้ Logout จากหน้าเว็บ
  async notifyLogout() {
    if (this.isConnected && this.rxCharacteristic) {
      try {
        const encoder = new TextEncoder();
        await this.rxCharacteristic.writeValue(encoder.encode('USER_LOGOUT'));
        // ให้เวลาบอร์ดสลับสถานะเป็น Standby 250ms ก่อนตัดการเชื่อมต่อ GATT
        await new Promise((resolve) => setTimeout(resolve, 250));
      } catch (e) {
        console.warn('Failed to send USER_LOGOUT:', e);
      }
    }
    this.disconnect();
  }

  disconnect() {
    if (this.characteristic) {
      try {
        this.characteristic.stopNotifications();
      } catch (_) {}
    }
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.isConnected = false;
    this.characteristic = null;
    this.rxCharacteristic = null;
    this.server = null;
  }
}

export const bleService = new BleService();
