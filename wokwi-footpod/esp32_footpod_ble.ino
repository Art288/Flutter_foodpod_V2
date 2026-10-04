/**
 * ============================================================================
 * FOOTPOD FIRMWARE - BLE 2.4GHz + MICROSD (IMPACT STEP & 1.25m/STEP DISTANCE)
 * บอร์ด: ESP32-C3 SuperMini / 01Space (RISC-V)
 * เซนเซอร์: GY-BNO055 บน SDA=4, SCL=3
 * จอแสดงผล: Onboard 0.42" OLED (SSD1306 72x40) บน SCL=6, SDA=5
 * โมดูลจัดเก็บ: MicroSD Card Module (SPI: CS=7, SCK=2, MOSI=10, MISO=9)
 * การเชื่อมต่อ: Web Bluetooth API (BLE GATT Server)
 * 
 * คุณสมบัติ:
 *   - ตรวจจับการก้าวเดินด้วย "แรงกระแทกกระทบพื้น" (Ground Impact Detection)
 *   - คำนวณระยะทางโดยตรงจากอุปกรณ์: 1 ก้าว = 1.25 เมตร (Stride Length = 1.25m)
 *   - ส่งทั้งจำนวนก้าว (Steps) และระยะทาง (Distance km/m) พร้อมมุมเท้า (Pitch) และแรงกระแทก (Impact G)
 * ============================================================================
 */

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>
#include <SPI.h>
#include <FS.h>
#include <SD.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BNO055.h>
#include <U8g2lib.h>

// ==========================================
// BLE UUID DEFINITIONS
// ==========================================
#define BLE_DEVICE_NAME  "foot pod"
#define BLE_SERVICE_UUID "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define BLE_CHAR_UUID    "6e400003-b5a3-f393-e0a9-e50e24dcca9e" // TX (Notify real-time)
#define BLE_RX_CHAR_UUID "6e400002-b5a3-f393-e0a9-e50e24dcca9e" // RX (Command: SYNC_SD)

// ==========================================
// PIN DEFINITIONS
// ==========================================
#define SENSOR_SDA 4
#define SENSOR_SCL 3

#define OLED_SCL 6
#define OLED_SDA 5

#define SD_CS   7
#define SD_SCK  2
#define SD_MISO 9
#define SD_MOSI 10

// ==========================================
// IMPACT STEP & DISTANCE CONFIGURATION
// ==========================================
// 1 ก้าวจากการกระแทก = 1.25 เมตร
#define METERS_PER_STEP       1.25f  
// เกณฑ์แรงกระแทกเท้ากระทบพื้น (G-Force Threshold)
#define IMPACT_THRESHOLD_G    1.32f  
#define MIN_STEP_INTERVAL_MS  260    // หน่วงเวลา debounce กรองการสะท้อน

// ==========================================
// GLOBAL OBJECTS & DRIVERS
// ==========================================
U8G2_SSD1306_72X40_ER_F_SW_I2C u8g2(U8G2_R0, OLED_SCL, OLED_SDA, U8X8_PIN_NONE);
Adafruit_BNO055* pBno = nullptr;

BLEServer* pServer = nullptr;
BLECharacteristic* pTxCharacteristic = nullptr;
BLECharacteristic* pRxCharacteristic = nullptr;
bool bleConnected = false;
bool oldBleConnected = false;
bool isAuthorized = false; // จะเป็น true เมื่อ user มีการ login ในแอพและเชื่อมบลูทูธ

bool sdOk = false;
bool syncRequested = false;

// ข้อมูลสำหรับเก็บสถิติการก้าวเดินออฟไลน์
struct OfflineSession {
  uint32_t startTimestamp;
  uint32_t steps;
  float distanceM;
  float sumPitch;
  uint32_t pitchCount;
  float peakImpactG;
} offlineRun = {0, 0, 0.0f, 0.0f, 0, 1.0f};

bool bnoOk = false;
uint8_t bnoAddr = 0x28;
uint8_t lastFoundAddr = 0;

float gyroAngleX = 0, gyroAngleY = 0, gyroAngleZ = 0; // Roll, Pitch, Yaw
float bnoAx = 0, bnoAy = 0, bnoAz = 0;
float currentG = 1.0f;
float lastImpactG = 1.0f;
float peakImpactG = 1.0f;

// Impact Step Counting & Distance (1 Step = 1.25m)
uint32_t stepCount = 0;
float totalDistanceM = 0.0f;
uint32_t lastStepTime = 0;
int currentCadence = 0;
bool footContact = false;

uint32_t lastBleNotify = 0;
uint32_t lastOLEDUpdate = 0;
uint32_t syncStatusOledTimer = 0;

// ==========================================
// BLE CALLBACKS
// ==========================================
class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    bleConnected = true;
    // เมื่อเชื่อมต่อจากแอพที่ login สำเร็จ ให้เปิดใช้งาน tracking
    isAuthorized = true;
    Serial.println("[BLE] Device connected to Web App -> User Authenticated!");
  };

  void onDisconnect(BLEServer* pServer) {
    bleConnected = false;
    if (isAuthorized) {
      Serial.println("[BLE] Disconnected while logged in -> Engaged Offline Impact Logging.");
      if (offlineRun.startTimestamp == 0) {
        offlineRun.startTimestamp = millis();
      }
    } else {
      Serial.println("[BLE] Disconnected (Logged out) -> Standby, no offline tracking.");
    }
  }
};

class MyRxCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    String rxValue = pCharacteristic->getValue().c_str();
    if (rxValue.length() > 0) {
      Serial.print("[BLE RX]: ");
      Serial.println(rxValue);

      if (rxValue.indexOf("USER_LOGIN") >= 0 || rxValue.indexOf("START_TRACKING") >= 0) {
        isAuthorized = true;
        Serial.println("[AUTH] User logged in -> Tracking ENABLED & Counting Active!");
      }
      else if (rxValue.indexOf("USER_LOGOUT") >= 0 || rxValue.indexOf("STOP_TRACKING") >= 0) {
        isAuthorized = false;
        Serial.println("[AUTH] User logged out -> Tracking DISABLED & Board in Standby!");
      }
      else if (rxValue.indexOf("SYNC_SD") >= 0) {
        syncRequested = true;
      }
    }
  }
};

void initBluetooth() {
  BLEDevice::init(BLE_DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(BLE_SERVICE_UUID);

  pTxCharacteristic = pService->createCharacteristic(
    BLE_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pTxCharacteristic->addDescriptor(new BLE2902());
  pTxCharacteristic->setValue("{\"status\":\"ready\"}");

  pRxCharacteristic = pService->createCharacteristic(
    BLE_RX_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_WRITE_NR
  );
  pRxCharacteristic->setCallbacks(new MyRxCallbacks());

  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("[BLE] FootPod advertising ready.");
}

// ==========================================
// MICROSD CARD FUNCTIONS
// ==========================================
void initSDCard() {
  pinMode(SD_CS, OUTPUT);
  digitalWrite(SD_CS, HIGH);

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);

  if (!SD.begin(SD_CS)) {
    Serial.println("[SD] MicroSD not found. Using in-memory fallback buffer.");
    sdOk = false;
  } else {
    uint8_t cardType = SD.cardType();
    if (cardType == CARD_NONE) {
      Serial.println("[SD] No SD card attached.");
      sdOk = false;
    } else {
      sdOk = true;
      Serial.printf("[SD] Card initialized! Size: %lluMB\n", SD.cardSize() / (1024 * 1024));
      
      if (!SD.exists("/offline_steps.csv")) {
        File f = SD.open("/offline_steps.csv", FILE_WRITE);
        if (f) {
          f.println("timestamp_ms,steps,distance_m,impact_g,pitch_deg,cadence_spm");
          f.close();
        }
      }
    }
  }
}

void logOfflineImpactStep(uint32_t stepInc, float distIncM, float pitch, float impactG, int cadence) {
  offlineRun.steps += stepInc;
  offlineRun.distanceM += distIncM;
  offlineRun.sumPitch += pitch;
  offlineRun.pitchCount++;
  if (impactG > offlineRun.peakImpactG) {
    offlineRun.peakImpactG = impactG;
  }

  if (sdOk) {
    File f = SD.open("/offline_steps.csv", FILE_APPEND);
    if (f) {
      f.printf("%lu,%lu,%.2f,%.2f,%.1f,%d\n", millis(), offlineRun.steps, offlineRun.distanceM, impactG, pitch, cadence);
      f.close();
    }
  }
}

void sendOfflineSyncPacket() {
  uint32_t finalSteps = 0;
  float finalDistM = 0.0f;
  float sumPitch = 0.0f;
  uint32_t pitchCount = 0;
  float peakImp = 1.0f;
  uint32_t startMs = 0;
  uint32_t endMs = 0;
  int lastCadence = 0;

  // 1. อ่านข้อมูลจริงจาก MicroSD Card (/offline_steps.csv)
  if (sdOk && SD.exists("/offline_steps.csv")) {
    File f = SD.open("/offline_steps.csv", FILE_READ);
    if (f) {
      // ข้าม header line (timestamp_ms,steps,distance_m,impact_g,pitch_deg,cadence_spm)
      if (f.available()) {
        f.readStringUntil('\n');
      }
      while (f.available()) {
        String line = f.readStringUntil('\n');
        line.trim();
        if (line.length() == 0) continue;

        int comma1 = line.indexOf(',');
        int comma2 = line.indexOf(',', comma1 + 1);
        int comma3 = line.indexOf(',', comma2 + 1);
        int comma4 = line.indexOf(',', comma3 + 1);
        int comma5 = line.indexOf(',', comma4 + 1);

        if (comma1 > 0 && comma2 > 0) {
          uint32_t ts = line.substring(0, comma1).toInt();
          uint32_t st = line.substring(comma1 + 1, comma2).toInt();
          if (startMs == 0) startMs = ts;
          endMs = ts;
          finalSteps = st; // ข้อมูลบรรทัดล่าสุดคือจำนวนก้าวสะสม

          if (comma3 > 0) {
            float imp = line.substring(comma2 + 1, comma3).toFloat();
            if (imp > peakImp) peakImp = imp;
          }
          if (comma4 > 0) {
            float pit = line.substring(comma3 + 1, comma4).toFloat();
            sumPitch += pit;
            pitchCount++;
          }
          if (comma5 > 0) {
            lastCadence = line.substring(comma4 + 1).toInt();
          }
        }
      }
      f.close();

      // ล้างไฟล์ offline เก่าเพื่อพร้อมบันทึกรอบใหม่
      SD.remove("/offline_steps.csv");
    }
  }

  // 2. หาก SD Card ไม่มีไฟล์แต่มีค่าสะสมใน RAM buffer (offlineRun) ขณะออฟไลน์
  if (finalSteps == 0 && offlineRun.steps > 0) {
    finalSteps = offlineRun.steps;
    peakImp = offlineRun.peakImpactG;
    sumPitch = offlineRun.sumPitch;
    pitchCount = offlineRun.pitchCount;
    if (offlineRun.startTimestamp > 0) {
      startMs = offlineRun.startTimestamp;
      endMs = millis();
    }
  }

  // 3. หากไม่มีข้อมูลออฟไลน์เลย (0 ก้าว) ให้ส่งแจ้งเตือนว่าไม่มีข้อมูล (ไม่สร้างข้อมูล Mockup เด็ดขาด)
  if (finalSteps == 0) {
    char emptyBuf[130];
    snprintf(emptyBuf, sizeof(emptyBuf),
      "{\"type\":\"sd_sync\",\"hasData\":false,\"steps\":0,\"dist\":0.0,\"distM\":0.0,\"msg\":\"No offline data on SD card\"}"
    );
    pTxCharacteristic->setValue((uint8_t*)emptyBuf, strlen(emptyBuf));
    pTxCharacteristic->notify();
    Serial.println("[BLE TX Sync]: No offline data found on SD card (0 steps).");
    return;
  }

  // คำนวณระยะทางจากข้อมูลก้าวจริง: 1 ก้าว = 1.25 เมตร จากอุปกรณ์
  finalDistM = finalSteps * METERS_PER_STEP;
  float finalDistKm = finalDistM / 1000.0f;

  float avgPitch = (pitchCount > 0) ? (sumPitch / pitchCount) : fabs(gyroAngleY);
  uint32_t durMin = 1;
  if (endMs > startMs && startMs > 0) {
    durMin = (endMs - startMs) / 60000;
    if (durMin < 1) durMin = 1;
  }

  int cadence = lastCadence > 0 ? lastCadence : currentCadence;
  if (cadence <= 0) cadence = 160;

  int calories = (int)(finalSteps * 0.042f);
  float speedKmh = (cadence * METERS_PER_STEP * 60.0f) / 1000.0f;

  // ส่ง JSON Packet ชนิด 'sd_sync' ที่เป็นข้อมูลจริงจาก SD Card เท่านั้น
  char syncBuf[185];
  snprintf(syncBuf, sizeof(syncBuf),
    "{\"type\":\"sd_sync\",\"hasData\":true,\"steps\":%lu,\"dist\":%.3f,\"distM\":%.1f,\"speed\":%.1f,\"pitch\":%.1f,\"cadence\":%d,\"impactG\":%.2f,\"g\":%.2f,\"dur\":%lu,\"cal\":%d}",
    finalSteps, finalDistKm, finalDistM, speedKmh, avgPitch, cadence, peakImp, peakImp, durMin, calories
  );

  Serial.print("[BLE TX Sync Real]: ");
  Serial.println(syncBuf);

  pTxCharacteristic->setValue((uint8_t*)syncBuf, strlen(syncBuf));
  pTxCharacteristic->notify();

  // รีเซ็ตตัวแปรออฟไลน์
  offlineRun = {millis(), 0, 0.0f, 0.0f, 0, 1.0f};
  syncStatusOledTimer = millis() + 3000;
}

// ==========================================
// IMPACT STEP DETECTION (นับก้าวจากการกระแทก: 1 ก้าว = 1.25 ม.)
// ==========================================
void processImpactStepDetection() {
  // หากยังไม่ได้ login ในแอพและเชื่อมบลูทูธ บอร์ดจะไม่นับค่าใดๆ เด็ดขาด
  if (!isAuthorized) return;

  static uint32_t lastSample = 0;
  uint32_t now = millis();
  if (now - lastSample < 20) return; // 50 Hz
  lastSample = now;

  float totalAcc = sqrt(bnoAx * bnoAx + bnoAy * bnoAy + bnoAz * bnoAz);
  float g = totalAcc / 9.80665f;
  currentG = g;

  footContact = (now - lastStepTime) < 180;

  // ตรวจจับจุดกระแทกเท้ากระทบพื้น
  if (g >= IMPACT_THRESHOLD_G && (now - lastStepTime > MIN_STEP_INTERVAL_MS)) {
    uint32_t stepInterval = now - lastStepTime;
    lastStepTime = now;
    lastImpactG = g;
    if (g > peakImpactG) peakImpactG = g;

    stepCount++;                         // นับ 1 ก้าว
    totalDistanceM += METERS_PER_STEP;   // เพิ่มระยะทาง 1.25 เมตรนับจากอุปกรณ์
    footContact = true;

    // คำนวณรอบขา (Cadence SPM)
    if (stepInterval > 0 && stepInterval < 2500) {
      currentCadence = (int)(60000 / stepInterval);
      currentCadence = constrain(currentCadence, 50, 220);
    }

    if (!bleConnected) {
      logOfflineImpactStep(1, METERS_PER_STEP, fabs(gyroAngleY), g, currentCadence);
    }
  }

  if (now - lastStepTime > 2800) {
    currentCadence = 0;
  }
}

// ==========================================
// I2C RECOVERY & BNO055 DRIVER
// ==========================================
void recoverI2CBus() {
  pinMode(SENSOR_SDA, INPUT_PULLUP);
  pinMode(SENSOR_SCL, INPUT_PULLUP);
  delayMicroseconds(20);
  if (digitalRead(SENSOR_SDA) == LOW) {
    pinMode(SENSOR_SCL, OUTPUT);
    digitalWrite(SENSOR_SCL, HIGH);
    for (uint8_t i = 0; i < 9; i++) {
      digitalWrite(SENSOR_SCL, LOW);
      delayMicroseconds(8);
      digitalWrite(SENSOR_SCL, HIGH);
      delayMicroseconds(8);
    }
    pinMode(SENSOR_SDA, OUTPUT);
    digitalWrite(SENSOR_SDA, LOW);
    delayMicroseconds(8);
    digitalWrite(SENSOR_SCL, HIGH);
    delayMicroseconds(8);
    digitalWrite(SENSOR_SDA, HIGH);
    pinMode(SENSOR_SDA, INPUT_PULLUP);
    pinMode(SENSOR_SCL, INPUT_PULLUP);
  }
}

void scanI2C() {
  lastFoundAddr = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    Wire.write(0x00);
    if (Wire.endTransmission() == 0) {
      lastFoundAddr = addr;
      if (addr == 0x28 || addr == 0x29) break;
    }
  }
}

void initBNO() {
  Wire.end();
  delay(15);
  recoverI2CBus();
  Wire.begin(SENSOR_SDA, SENSOR_SCL, 100000);
  Wire.setTimeOut(30);

  scanI2C();
  bnoOk = false;

  if (pBno != nullptr) {
    delete pBno;
    pBno = nullptr;
  }

  pBno = new Adafruit_BNO055(55, 0x28, &Wire);
  for (uint8_t attempt = 0; attempt < 3 && !bnoOk; attempt++) {
    if (pBno->begin()) {
      bnoOk = true;
      bnoAddr = 0x28;
      pBno->setExtCrystalUse(false);
      return;
    }
    delay(80);
  }
  delete pBno;

  pBno = new Adafruit_BNO055(55, 0x29, &Wire);
  for (uint8_t attempt = 0; attempt < 3 && !bnoOk; attempt++) {
    if (pBno->begin()) {
      bnoOk = true;
      bnoAddr = 0x29;
      pBno->setExtCrystalUse(false);
      return;
    }
    delay(80);
  }
  delete pBno;
  pBno = nullptr;
  bnoOk = false;
}

void readBNO() {
  if (!bnoOk || pBno == nullptr) return;

  sensors_event_t eventEuler;
  sensors_event_t eventAccel;
  pBno->getEvent(&eventEuler, Adafruit_BNO055::VECTOR_EULER);
  pBno->getEvent(&eventAccel, Adafruit_BNO055::VECTOR_ACCELEROMETER);

  float ax = eventAccel.acceleration.x;
  float ay = eventAccel.acceleration.y;
  float az = eventAccel.acceleration.z;

  static uint8_t failedCount = 0;
  if (ax == 0.0f && ay == 0.0f && az == 0.0f) {
    failedCount++;
    if (failedCount >= 3) {
      bnoOk = false;
      failedCount = 0;
    }
    return;
  }
  failedCount = 0;

  gyroAngleZ = eventEuler.orientation.x; // Yaw
  gyroAngleX = eventEuler.orientation.y; // Roll
  gyroAngleY = eventEuler.orientation.z; // Pitch (องศาการงอเท้า)

  bnoAx = ax;
  bnoAy = ay;
  bnoAz = az;
}

// ==========================================
// OLED DISPLAY (SSD1306 72x40)
// ==========================================
void updateOLED() {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_5x7_tf);

  static uint8_t anim = 0;
  anim++;

  if (syncStatusOledTimer > millis()) {
    u8g2.drawStr(4, 12, "SD SYNC OK");
    u8g2.drawHLine(0, 16, 72);
    u8g2.drawStr(8, 28, "[ SUCCESS ]");
    u8g2.drawStr(6, 38, "Sent to App");
    u8g2.sendBuffer();
    return;
  }

  // หากผู้ใช้ Logout จากแอพ หรือยังไม่ได้ Login & เชื่อมบลูทูธ -> แสดงผลหน้าจอ Standby และไม่นับค่า
  if (!isAuthorized) {
    u8g2.drawStr(0, 7, bleConnected ? "BLE:CONNECTED" : "BLE:STANDBY");
    u8g2.drawHLine(0, 9, 72);
    u8g2.drawStr(4, 20, "[ STANDBY ]");
    u8g2.drawStr(2, 30, "Wait App Login");
    u8g2.drawStr(2, 39, "No Step Track");
    u8g2.sendBuffer();
    return;
  }

  if (bnoOk) {
    // Row 0: Status & Activity Dot
    if (bleConnected) {
      u8g2.drawStr(0, 7, "BLE:ONLINE");
      if ((anim / 2) % 2 == 0) u8g2.drawDisc(56, 3, 2);
      else u8g2.drawCircle(56, 3, 2);
    } else {
      u8g2.drawStr(0, 7, sdOk ? "SD:LOGGING" : "MEM:LOGGING");
      if ((anim / 2) % 2 == 0) u8g2.drawBox(62, 1, 6, 6);
    }

    u8g2.drawHLine(0, 9, 72);

    // Row 1: Pitch (Flexion Angle)
    int pInt = (int)round(gyroAngleY);
    char bufP[12];
    snprintf(bufP, sizeof(bufP), "Ang:%+2d\xb0", pInt);
    u8g2.drawStr(0, 18, bufP);

    u8g2.drawFrame(44, 13, 27, 5);
    u8g2.drawVLine(57, 13, 5);
    int pBar = constrain(pInt * 12 / 60, -12, 12);
    if (pBar > 0) u8g2.drawBox(58, 14, pBar, 3);
    else if (pBar < 0) u8g2.drawBox(57 + pBar, 14, -pBar, 3);

    // Row 2: Impact Steps & Distance (1 step = 1.25m)
    char bufSteps[18];
    if (totalDistanceM < 1000.0f) {
      snprintf(bufSteps, sizeof(bufSteps), "S:%lu D:%.0fm", stepCount, totalDistanceM);
    } else {
      snprintf(bufSteps, sizeof(bufSteps), "S:%lu D:%.2fk", stepCount, totalDistanceM / 1000.0f);
    }
    u8g2.drawStr(0, 28, bufSteps);

    // Row 3: Impact G & Cadence SPM
    char bufImp[16];
    if (currentCadence > 0) {
      snprintf(bufImp, sizeof(bufImp), "%.1fG SPM:%d", lastImpactG, currentCadence);
    } else {
      snprintf(bufImp, sizeof(bufImp), "Imp:%.1fG 1.25m", lastImpactG);
    }
    u8g2.drawStr(0, 38, bufImp);

  } else {
    u8g2.drawStr(0, 7, "FootPod BLE");
    u8g2.drawHLine(0, 9, 72);
    u8g2.drawStr(0, 19, "Wait Sensor...");
    if (lastFoundAddr != 0) {
      char addrStr[18];
      snprintf(addrStr, sizeof(addrStr), "I2C: 0x%02X", lastFoundAddr);
      u8g2.drawStr(0, 29, addrStr);
      u8g2.drawStr(0, 39, "Retrying BNO...");
    } else {
      u8g2.drawStr(0, 29, "SDA:4 SCL:3");
      u8g2.drawStr(0, 39, "No I2C detected");
    }
  }

  u8g2.sendBuffer();
}

// ==========================================
// SETUP & MAIN LOOP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== FootPod BLE (Impact Step & 1.25m/Step) Starting ===");

  u8g2.setI2CAddress(0x3C << 1);
  u8g2.begin();
  u8g2.setContrast(255);
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_5x7_tf);
  u8g2.drawStr(0, 15, "FootPod BLE");
  u8g2.drawStr(0, 28, "1 Step = 1.25m");
  u8g2.sendBuffer();

  initSDCard();

  Wire.begin(SENSOR_SDA, SENSOR_SCL, 100000);
  Wire.setTimeOut(50);
  initBNO();

  initBluetooth();

  updateOLED();
}

void loop() {
  uint32_t now = millis();

  if (!bleConnected && oldBleConnected) {
    delay(500);
    pServer->startAdvertising();
    oldBleConnected = bleConnected;
  }
  if (bleConnected && !oldBleConnected) {
    oldBleConnected = bleConnected;
  }

  static uint32_t lastSensorRetry = 0;
  if (!bnoOk && (now - lastSensorRetry >= 500)) {
    lastSensorRetry = now;
    initBNO();
  }

  static uint32_t lastBNORead = 0;
  if (bnoOk && (now - lastBNORead >= 25)) {
    lastBNORead = now;
    readBNO();
  }

  // ตรวจจับการนับก้าวและคำนวณระยะทาง 1.25 เมตร/ก้าว
  processImpactStepDetection();

  if (syncRequested) {
    syncRequested = false;
    sendOfflineSyncPacket();
  }

  // ส่งข้อมูลแบบ Real-time BLE Notification ทุกๆ 100ms (10Hz) เมื่อเชื่อมต่อและได้รับการยืนยันตัวตน (Login) แล้ว
  if (bleConnected && isAuthorized && (now - lastBleNotify >= 100)) {
    lastBleNotify = now;
    float pitchAngle = fabs(gyroAngleY);
    float distKm = totalDistanceM / 1000.0f;
    float speedKmh = (currentCadence * METERS_PER_STEP * 60.0f) / 1000.0f;

    char bleBuf[160];
    snprintf(bleBuf, sizeof(bleBuf),
      "{\"pitch\":%.1f,\"roll\":%.1f,\"yaw\":%.1f,\"steps\":%lu,\"dist\":%.3f,\"distM\":%.1f,\"speed\":%.1f,\"cadence\":%d,\"impactG\":%.2f,\"g\":%.2f}",
      pitchAngle, gyroAngleX, gyroAngleZ, stepCount, distKm, totalDistanceM, speedKmh, currentCadence, lastImpactG, currentG
    );

    pTxCharacteristic->setValue((uint8_t*)bleBuf, strlen(bleBuf));
    pTxCharacteristic->notify();
  }

  // แสดงผลออก Serial Monitor
  static uint32_t lastSerialSend = 0;
  if (now - lastSerialSend >= 25) {
    lastSerialSend = now;
    Serial.printf("{\"pitch\":%.1f,\"steps\":%lu,\"distM\":%.1f,\"cadence\":%d,\"impactG\":%.2f,\"ble\":%d,\"auth\":%d}\n",
      gyroAngleY, stepCount, totalDistanceM, currentCadence, lastImpactG, bleConnected ? 1 : 0, isAuthorized ? 1 : 0
    );
  }

  // อัปเดตหน้าจอ OLED ที่ 4Hz
  if (now - lastOLEDUpdate >= 250) {
    lastOLEDUpdate = now;
    updateOLED();
  }
}
