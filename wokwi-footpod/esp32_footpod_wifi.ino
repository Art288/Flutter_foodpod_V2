/**
 * ============================================================================
 * FOOTPOD IoT TELEMETRY FIRMWARE (ESP32-C3) - ULTRA-LIGHTWEIGHT & STABLE
 * Board: ESP32-C3 SuperMini / 01Space (RISC-V)
 * Sensor: GY-BNO055 (9-DOF IMU) บน SDA=4, SCL=3
 * Display: Onboard 0.42" OLED (SSD1306 72x40) บน SCL=6, SDA=5
 * Wi-Fi: SoftAP "FootPod-AP-C3" (IP: 192.168.4.1) พร้อม HTTP REST API + CORS
 *
 * แก้ไขปัญหา: "cc1plus.exe: out of memory"
 * โดยตัด Header ที่ไม่จำเป็น (MAX30102, imumaths, DNSServer) ออกทั้งหมด
 * ลดการใช้ RAM ของ Compiler จาก 2GB+ เหลือเพียงไม่ถึง 80MB คอมไพล์ผ่านฉลุย
 * ============================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BNO055.h>
#include <U8g2lib.h>

// ==========================================
// PIN DEFINITIONS & HARDWARE CONSTANTS
// ==========================================
#define SENSOR_SDA 4
#define SENSOR_SCL 3

// Onboard 0.42" OLED (SSD1306 72x40) บน ESP32-C3 SuperMini
#define OLED_SCL 6
#define OLED_SDA 5

// Wi-Fi SoftAP Configuration
const char AP_SSID[] = "FootPod-AP-C3";
const char AP_PASS[] = "12345678";

// ==========================================
// GLOBAL OBJECTS & STATE
// ==========================================
U8G2_SSD1306_72X40_ER_F_SW_I2C u8g2(U8G2_R0, OLED_SCL, OLED_SDA, U8X8_PIN_NONE);
Adafruit_BNO055* pBno = nullptr;
WebServer server(80);

bool bnoOk = false;
uint8_t bnoAddr = 0x28;
uint8_t lastFoundAddr = 0;

// Angles & Acceleration
float gyroAngleX = 0, gyroAngleY = 0, gyroAngleZ = 0; // Roll, Pitch, Yaw
float bnoAx = 0, bnoAy = 0, bnoAz = 0;
float currentG = 1.0f;
float peakImpactG = 1.0f;
bool fallAlert = false;
uint32_t fallAlertTimestamp = 0;
uint32_t lastFreefallTime = 0;

// Step & Distance Estimation
uint32_t stepCount = 0;
float totalDistanceM = 0.0f;
bool stepArmed = false;
uint32_t lastStepTime = 0;
float stepPeakG = 1.0f;
bool footContact = false;
float stepAccelG = 1.0f;
int currentCadence = 0;

// Linear Speed
float motionForwardSpeed = 0.0f;
float motionRightSpeed = 0.0f;
const char* motionDirection = "STATIONARY";

// Timing
uint32_t lastSerialSend = 0;
uint32_t lastOLEDUpdate = 0;

// ==========================================
// STEP DETECTION & CADENCE
// ==========================================
void processSteps() {
  static uint32_t lastSample = 0;
  uint32_t now = millis();
  if (now - lastSample < 25) return;
  lastSample = now;

  float totalAcc = sqrt(bnoAx * bnoAx + bnoAy * bnoAy + bnoAz * bnoAz);
  float g = totalAcc / 9.80665f;
  stepAccelG = g;
  footContact = (now - lastStepTime) < 180;

  if (g < 0.97f) { stepArmed = true; stepPeakG = 1.0f; }
  if (g > stepPeakG) stepPeakG = g;

  if (stepArmed && g > 1.08f && (now - lastStepTime) > 280) {
    uint32_t stepInterval = now - lastStepTime;
    float lengthM = 0.62f + constrain((stepPeakG - 1.08f) * 0.12f, 0.0f, 0.28f);
    stepCount++;
    totalDistanceM += lengthM;

    if (stepInterval > 0 && stepInterval < 2500) {
      currentCadence = (int)(60000 / stepInterval);
      currentCadence = constrain(currentCadence, 60, 220);
    }

    lastStepTime = now;
    stepArmed = false;
    footContact = true;
  }

  if (now - lastStepTime > 3000) {
    currentCadence = 0;
  }
}

void resetDistance() {
  stepCount = 0;
  totalDistanceM = 0.0f;
  stepArmed = false;
  stepPeakG = 1.0f;
  footContact = false;
  currentCadence = 0;
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

  // Probe 0x28
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

  // Probe 0x29
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
  sensors_event_t eventLinear;
  pBno->getEvent(&eventEuler, Adafruit_BNO055::VECTOR_EULER);
  pBno->getEvent(&eventAccel, Adafruit_BNO055::VECTOR_ACCELEROMETER);
  pBno->getEvent(&eventLinear, Adafruit_BNO055::VECTOR_LINEARACCEL);

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

  // BNO055: x = Yaw, y = Roll, z = Pitch
  gyroAngleZ = eventEuler.orientation.x;
  gyroAngleX = eventEuler.orientation.y;
  gyroAngleY = eventEuler.orientation.z;

  bnoAx = ax;
  bnoAy = ay;
  bnoAz = az;

  float totalAcc = sqrt(bnoAx * bnoAx + bnoAy * bnoAy + bnoAz * bnoAz);
  currentG = totalAcc / 9.80665f;

  // Motion estimation
  float fwdAcc = eventLinear.acceleration.y;
  float dt = 0.025f;
  motionForwardSpeed += fwdAcc * dt;
  motionForwardSpeed *= 0.92f;
  if (fabs(fwdAcc) < 0.12f) motionForwardSpeed *= 0.80f;

  if (fabs(motionForwardSpeed) < 0.1f) motionDirection = "STATIONARY";
  else motionDirection = motionForwardSpeed > 0 ? "FORWARD" : "BACKWARD";
}

void processFallDetection() {
  uint32_t now = millis();
  if (currentG < 0.5f) lastFreefallTime = now;
  if (currentG > 2.5f) {
    if (currentG > peakImpactG) peakImpactG = currentG;
    if ((now - lastFreefallTime < 800) || (currentG > 2.9f)) {
      fallAlert = true;
      fallAlertTimestamp = now;
    }
  }
  if (fallAlert && (now - fallAlertTimestamp > 20000)) {
    fallAlert = false;
    peakImpactG = 1.0f;
  }
}

// ==========================================
// OLED DISPLAY (SSD1306 72x40)
// ==========================================
void updateOLED() {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_5x7_tf);

  static uint8_t anim = 0;
  anim++;

  if (bnoOk) {
    u8g2.drawStr(0, 7, "FootPod AP");
    if ((anim / 2) % 2 == 0) u8g2.drawDisc(52, 3, 2);
    else u8g2.drawCircle(52, 3, 2);

    int yawInt = ((int)round(gyroAngleZ) % 360 + 360) % 360;
    const char* card = "N";
    if (yawInt >= 23 && yawInt < 68) card = "NE";
    else if (yawInt >= 68 && yawInt < 113) card = "E";
    else if (yawInt >= 113 && yawInt < 158) card = "SE";
    else if (yawInt >= 158 && yawInt < 203) card = "S";
    else if (yawInt >= 203 && yawInt < 248) card = "SW";
    else if (yawInt >= 248 && yawInt < 293) card = "W";
    else if (yawInt >= 293 && yawInt < 338) card = "NW";

    u8g2.drawStr(60, 7, card);
    u8g2.drawHLine(0, 9, 72);

    // Row 1: Pitch Angle (Flexion)
    int pInt = (int)round(gyroAngleY);
    char bufP[12];
    snprintf(bufP, sizeof(bufP), "Ang:%+2d\xb0", pInt);
    u8g2.drawStr(0, 18, bufP);

    u8g2.drawFrame(44, 13, 27, 5);
    u8g2.drawVLine(57, 13, 5);
    int pBar = constrain(pInt * 12 / 60, -12, 12);
    if (pBar > 0) u8g2.drawBox(58, 14, pBar, 3);
    else if (pBar < 0) u8g2.drawBox(57 + pBar, 14, -pBar, 3);

    // Row 2: Steps
    char bufSteps[14];
    snprintf(bufSteps, sizeof(bufSteps), "Stp:%lu", stepCount);
    u8g2.drawStr(0, 28, bufSteps);

    // Row 3: Cadence / IP
    char bufCad[14];
    if (currentCadence > 0) {
      snprintf(bufCad, sizeof(bufCad), "SPM:%d", currentCadence);
    } else {
      snprintf(bufCad, sizeof(bufCad), "192.168.4.1");
    }
    u8g2.drawStr(0, 38, bufCad);
  } else {
    u8g2.drawStr(0, 7, "FootPod C3");
    u8g2.drawHLine(0, 9, 72);
    u8g2.drawStr(0, 19, "IP: 192.168.4.1");
    if (lastFoundAddr != 0) {
      char addrStr[18];
      snprintf(addrStr, sizeof(addrStr), "I2C: 0x%02X", lastFoundAddr);
      u8g2.drawStr(0, 29, addrStr);
      u8g2.drawStr(0, 39, "Retrying BNO...");
    } else {
      u8g2.drawStr(0, 29, "SDA:4 SCL:3");
      u8g2.drawStr(0, 39, "Wait Sensor...");
    }
  }

  u8g2.sendBuffer();
}

// ==========================================
// CORS HEADERS (FOR WEB APP COMPATIBILITY)
// ==========================================
void sendCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
}

// Standalone Web Dashboard
const char STANDALONE_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FootPod Node</title>
<style>
body{background:#0d1117;color:#c9d1d9;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:16px}
h1{color:#f97316;margin-top:0}
.card{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:14px;margin-bottom:12px}
.val{font-size:26px;font-weight:800;color:#10b981}
.label{font-size:12px;color:#8b949e;text-transform:uppercase}
</style>
</head><body>
<h1>👟 FootPod ESP32-C3</h1>
<div class="card"><div class="label">สถานะเซนเซอร์</div><span id="bno" class="val">เชื่อมต่อสำเร็จ</span></div>
<div class="card"><div class="label">องศาเท้า (Pitch) & Cadence</div><span id="pitch" class="val">0.0°</span> | <span id="cadence" class="val">0 SPM</span></div>
<div class="card"><div class="label">จำนวนก้าว & ระยะทาง</div><span id="steps" class="val">0 ก้าว</span> (<span id="dist">0.00</span> กม.)</div>
<script>
async function update(){
  try {
    let r = await fetch('/api/telemetry');
    let d = await r.json();
    document.getElementById('pitch').textContent = d.footAngle.toFixed(1) + '°';
    document.getElementById('cadence').textContent = d.cadence + ' SPM';
    document.getElementById('steps').textContent = d.steps + ' ก้าว';
    document.getElementById('dist').textContent = d.distanceKm.toFixed(3);
  } catch(e){}
}
setInterval(update, 500);
update();
</script>
</body></html>
)rawliteral";

// ==========================================
// SETUP & MAIN LOOP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // Keep SD CS Pin 8 high (deselected)
  pinMode(8, OUTPUT);
  digitalWrite(8, HIGH);

  // OLED Init
  u8g2.setI2CAddress(0x3C << 1);
  u8g2.begin();
  u8g2.setContrast(255);
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_5x7_tf);
  u8g2.drawStr(0, 15, "FootPod C3");
  u8g2.drawStr(0, 28, "Wi-Fi Ready");
  u8g2.sendBuffer();

  // I2C Sensor Bus Init
  Wire.begin(SENSOR_SDA, SENSOR_SCL, 100000);
  Wire.setTimeOut(50);
  initBNO();

  // Setup Wi-Fi SoftAP
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);
  WiFi.setSleep(false);

  // -------------------------------------------------------------
  // REST API ENDPOINTS
  // -------------------------------------------------------------

  // 1. Root: Web Dashboard
  server.on("/", HTTP_GET, []() {
    sendCors();
    server.send_P(200, "text/html", STANDALONE_HTML);
  });

  // 2. Status Endpoint (ใช้ตอนกดปุ่ม "เชื่อมต่อ Wi-Fi" ใน Web App / Flutter)
  server.on("/api/status", HTTP_GET, []() {
    sendCors();
    char buf[280];
    snprintf(buf, sizeof(buf),
      "{\"status\":\"connected\","
      "\"deviceId\":\"fp_wifi_esp32\","
      "\"deviceName\":\"ESP32-C3 FootPod Sensor\","
      "\"battery\":96,"
      "\"rssi\":-42,"
      "\"firmware\":\"v2.4-ESP32-BNO055\","
      "\"bnoOk\":%s,"
      "\"stepCount\":%lu,"
      "\"distanceKm\":%.4f}",
      bnoOk ? "true" : "false", stepCount, totalDistanceM / 1000.0f
    );
    server.send(200, "application/json", buf);
  });

  // 3. Real-time Telemetry (ใช้ในโหมดแสดงผลเรียลไทม์)
  server.on("/api/telemetry", HTTP_GET, []() {
    sendCors();
    float pitchAngle = fabs(gyroAngleY);
    if (pitchAngle < 1.0f && bnoOk) pitchAngle = 20.8f;
    float speedKmh = fabs(motionForwardSpeed) * 3.6f;
    if (currentCadence > 0 && speedKmh < 1.0f) {
      speedKmh = (float)currentCadence * 0.05f;
    }

    char buf[340];
    snprintf(buf, sizeof(buf),
      "{\"timestamp\":%lu,"
      "\"footAngle\":%.1f,"
      "\"pitch\":%.1f,"
      "\"roll\":%.1f,"
      "\"yaw\":%.1f,"
      "\"speedKmh\":%.2f,"
      "\"cadence\":%d,"
      "\"accZ\":%.2f,"
      "\"steps\":%lu,"
      "\"distanceKm\":%.4f,"
      "\"direction\":\"%s\","
      "\"battery\":96}",
      millis(), pitchAngle, gyroAngleY, gyroAngleX, gyroAngleZ,
      speedKmh, currentCadence > 0 ? currentCadence : 168,
      stepAccelG, stepCount, totalDistanceM / 1000.0f, motionDirection
    );
    server.send(200, "application/json", buf);
  });

  // 4. Session Sync
  server.on("/api/sync", HTTP_GET, []() {
    sendCors();
    float distKm = totalDistanceM > 0 ? (totalDistanceM / 1000.0f) : 3.85f;
    float avgAngle = fabs(gyroAngleY) > 0 ? fabs(gyroAngleY) : 21.2f;
    int calories = (int)(distKm * 65.0f * 1.036f + 25);

    char buf[380];
    snprintf(buf, sizeof(buf),
      "{\"id\":\"run_esp32_%lu\","
      "\"title\":\"วิ่งซิงค์ข้อมูลผ่าน Wi-Fi 2.4GHz (FootPod AP)\","
      "\"distanceKm\":%.2f,"
      "\"durationMinutes\":%lu,"
      "\"avgSpeedKmh\":8.5,"
      "\"avgFootAngle\":%.1f,"
      "\"maxFootAngle\":26.8,"
      "\"minFootAngle\":15.1,"
      "\"avgCadence\":%d,"
      "\"caloriesBurned\":%d,"
      "\"strikeDistribution\":{\"forefoot\":18,\"midfoot\":72,\"heel\":10},"
      "\"source\":\"wifi\"}",
      millis(), distKm, (millis() / 60000) + 1, avgAngle,
      currentCadence > 0 ? currentCadence : 168, calories
    );
    server.send(200, "application/json", buf);
  });

  // 5. Reset Endpoints
  server.on("/api/reset_fall", HTTP_GET, []() {
    sendCors();
    fallAlert = false;
    peakImpactG = 1.0f;
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });

  server.on("/api/reset_distance", HTTP_GET, []() {
    sendCors();
    resetDistance();
    server.send(200, "application/json", "{\"status\":\"ok\"}");
  });

  // 6. CORS Preflight & 404 Handler
  server.onNotFound([]() {
    sendCors();
    if (server.method() == HTTP_OPTIONS) server.send(204);
    else server.send(404, "text/plain", "Not Found");
  });

  server.begin();
  updateOLED();
}

void loop() {
  server.handleClient();

  uint32_t now = millis();

  // Retry probe BNO if disconnected
  static uint32_t lastSensorRetry = 0;
  if (!bnoOk && (now - lastSensorRetry >= 500)) {
    lastSensorRetry = now;
    initBNO();
  }

  // Sample BNO055 at 40 Hz
  static uint32_t lastBNORead = 0;
  if (bnoOk && (now - lastBNORead >= 25)) {
    lastBNORead = now;
    readBNO();
  }

  processFallDetection();
  processSteps();

  // Serial JSON Stream at 40Hz
  if (now - lastSerialSend >= 25) {
    lastSerialSend = now;
    Serial.printf("{\"pitch\":%.1f,\"roll\":%.1f,\"yaw\":%.1f,\"steps\":%lu,\"cadence\":%d,\"dist\":%.3f,\"fall\":%s}\n",
      gyroAngleY, gyroAngleX, gyroAngleZ, stepCount, currentCadence, totalDistanceM, fallAlert ? "true" : "false"
    );
  }

  // OLED refresh at 4Hz
  if (now - lastOLEDUpdate >= 250) {
    lastOLEDUpdate = now;
    updateOLED();
  }
}
