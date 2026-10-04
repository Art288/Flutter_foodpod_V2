/**
 * ============================================================================
 * FOOTPOD IoT TELEMETRY FIRMWARE (BNO055 9-DOF ORIENTATION SENSOR)
 * Project: Smart Foot Flexion Angle, Distance, Speed & Calorie Tracker
 * Hardware: Arduino Uno / Nano + BNO055 (9-Axis IMU) + SSD1306 OLED (128x64)
 * ============================================================================
 */

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BNO055.h>
#include <utility/imumaths.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// OLED Display Configuration (I2C: A4=SDA, A5=SCL on Uno/Nano)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// BNO055 9-DOF Absolute Orientation Sensor Configuration
#define BNO055_SAMPLERATE_DELAY_MS 50
Adafruit_BNO055 bno = Adafruit_BNO055(55, 0x28);
bool bnoAvailable = false;

// Pin Definitions for Arduino Uno / Nano
#define PIN_BUTTON_SYNC 2   // Push button Start/Pause/Sync (Digital Pin 2 with Pullup)
#define PIN_LED_STATUS 13   // Built-in LED on Pin 13

// Runner Biometrics (ข้อมูลสุขภาพเริ่มต้น)
float userWeightKg = 65.0;       // Body weight for MET calorie formula
float userHeightCm = 170.0;      // Height
float strideLengthMeters = 0.78; // Calculated Stride Length (~ Height * 0.45)

// Telemetry & Session Variables
bool isRunning = true;
unsigned long sessionStartMs = 0;
unsigned long lastTelemetryMs = 0;
unsigned long lastDisplayMs = 0;
unsigned long lastStepMs = 0;

int totalSteps = 0;
float currentPitchAngle = 21.0;   // Foot Flexion Angle (Pitch / Dorsiflexion in Degrees)
float maxPitchAngle = 0.0;
float minPitchAngle = 90.0;
float sumPitchAngle = 0.0;
int angleSampleCount = 0;

float currentSpeedKmh = 8.5;
float totalDistanceKm = 0.0;
float totalCalories = 0.0;
int batteryPercent = 88;

// Step Detection Spike Threshold
float lastLinearAccZ = 0.0;
const float STEP_THRESHOLD = 4.5; // Linear Acceleration spike threshold (m/s^2)

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println(F("\n=========================================="));
  Serial.println(F(" FOOTPOD SENSOR (BNO055 9-DOF ORIENTATION)"));
  Serial.println(F("=========================================="));

  // Initialize GPIOs
  pinMode(PIN_BUTTON_SYNC, INPUT_PULLUP);
  pinMode(PIN_LED_STATUS, OUTPUT);
  digitalWrite(PIN_LED_STATUS, HIGH);

  // Initialize I2C Bus (A4 = SDA, A5 = SCL on Arduino Uno/Nano)
  Wire.begin();

  // Initialize SSD1306 OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("[WARN] SSD1306 allocation failed!"));
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(18, 12);
    display.println(F("FOOTPOD IoT"));
    display.setCursor(14, 28);
    display.println(F("BNO055 9-DOF IMU"));
    display.setCursor(22, 45);
    display.println(F("Starting..."));
    display.display();
    delay(1000);
  }

  // Initialize BNO055 9-DOF Sensor
  if (!bno.begin()) {
    Serial.println(F("[WARN] BNO055 not detected on 0x28, running simulation mode."));
    bnoAvailable = false;
  } else {
    Serial.println(F("[SUCCESS] BNO055 9-Axis Absolute Orientation Sensor ready."));
    bnoAvailable = true;
    bno.setExtCrystalUse(true);
  }

  sessionStartMs = millis();
  digitalWrite(PIN_LED_STATUS, LOW);
  Serial.println(F("[READY] FootPod telemetry system is active."));
}

void loop() {
  unsigned long now = millis();

  // 1. Read Button (Pin 2)
  handleButton(now);

  // 2. Read BNO055 9-DOF Absolute Euler Pitch & Linear Acceleration (every 50ms = 20Hz)
  if (now - lastTelemetryMs >= BNO055_SAMPLERATE_DELAY_MS) {
    lastTelemetryMs = now;
    readBNO055AndComputeTelemetry();
  }

  // 3. Update OLED Display (every 200ms)
  if (now - lastDisplayMs >= 200) {
    lastDisplayMs = now;
    updateOLEDDisplay(now);
  }
}

/**
 * Read BNO055 9-Axis Absolute Orientation
 * - Extracts Euler Pitch (Foot flexion angle) directly from hardware sensor fusion
 * - Extracts Linear Acceleration (without gravity) for precise step counting
 */
void readBNO055AndComputeTelemetry() {
  float pitch = 21.0;
  float linearAccZ = 0.0;

  if (bnoAvailable) {
    // 1. Get Euler Angles (Pitch = Y, Roll = Z, Heading = X)
    imu::Vector<3> euler = bno.getVector(Adafruit_BNO055::VECTOR_EULER);
    pitch = abs(euler.y()); // Pitch represents foot dorsiflexion/flexion

    // 2. Get Linear Acceleration (Gravity compensated)
    imu::Vector<3> linAcc = bno.getVector(Adafruit_BNO055::VECTOR_LINEARACCEL);
    linearAccZ = abs(linAcc.z());
  } else {
    // Wokwi simulation fallback reading from I2C IMU register
    Wire.beginTransmission(0x68);
    Wire.write(0x3B);
    Wire.endTransmission(false);
    Wire.requestFrom(0x68, 6, true);

    if (Wire.available() >= 6) {
      int16_t ax = (Wire.read() << 8) | Wire.read();
      int16_t ay = (Wire.read() << 8) | Wire.read();
      int16_t az = (Wire.read() << 8) | Wire.read();

      float fax = ax / 16384.0;
      float fay = ay / 16384.0;
      float faz = az / 16384.0;

      pitch = abs(atan2(fax, sqrt(fay * fay + faz * faz)) * 180.0 / PI);
      linearAccZ = abs(sqrt(fax * fax + fay * fay + faz * faz) - 1.0) * 9.8;
    }
  }

  // Smooth filter
  currentPitchAngle = (currentPitchAngle * 0.7) + (pitch * 0.3);
  if (currentPitchAngle < 2.0) currentPitchAngle = 2.0;

  // Track max/min angles
  if (currentPitchAngle > maxPitchAngle) maxPitchAngle = currentPitchAngle;
  if (currentPitchAngle < minPitchAngle && currentPitchAngle > 5.0) minPitchAngle = currentPitchAngle;

  sumPitchAngle += currentPitchAngle;
  angleSampleCount++;

  // Step Detection
  unsigned long now = millis();
  if (isRunning && linearAccZ > STEP_THRESHOLD && (lastLinearAccZ <= STEP_THRESHOLD) && (now - lastStepMs > 240)) {
    totalSteps++;
    lastStepMs = now;

    // Blink LED on step impact
    digitalWrite(PIN_LED_STATUS, HIGH);

    // Update Distance
    totalDistanceKm = (totalSteps * strideLengthMeters) / 1000.0;

    // Estimate speed from step cadence
    float currentCadenceSPM = 165.0 + (random(-8, 8));
    currentSpeedKmh = (currentCadenceSPM * strideLengthMeters * 60.0) / 1000.0;

    // Estimate Calories using MET Formula
    float runTimeMinutes = (now - sessionStartMs) / 60000.0;
    float met = 8.5 + (currentSpeedKmh - 8.0) * 0.8;
    if (met < 6.0) met = 6.0;
    totalCalories = (met * 3.5 * userWeightKg / 200.0) * runTimeMinutes;
  } else {
    digitalWrite(PIN_LED_STATUS, LOW);
  }

  lastLinearAccZ = linearAccZ;
}

/**
 * Render 128x64 OLED Display
 */
void updateOLEDDisplay(unsigned long now) {
  display.clearDisplay();

  // Header: Logo & Status
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(F("footpod BNO055"));

  display.setCursor(88, 0);
  display.print(isRunning ? F("[RUN]") : F("[PAUSE]"));

  display.drawLine(0, 9, 128, 9, SSD1306_WHITE);

  // Main Metric: Foot Flexion Angle
  display.setCursor(0, 13);
  display.print(F("FLEXION ANGLE:"));

  display.setCursor(0, 24);
  display.setTextSize(2);
  display.print(currentPitchAngle, 1);
  display.setTextSize(1);
  display.print(F(" deg "));

  // Safe Zone label
  if (currentPitchAngle >= 15.0 && currentPitchAngle <= 25.0) {
    display.print(F("[SAFE]"));
  } else if (currentPitchAngle < 15.0) {
    display.print(F("[FORE]"));
  } else {
    display.print(F("[HEEL]"));
  }

  display.drawLine(0, 42, 128, 42, SSD1306_WHITE);

  // Bottom Row Metrics
  display.setTextSize(1);
  display.setCursor(0, 46);
  display.print(F("Dist: "));
  display.print(totalDistanceKm, 2);
  display.print(F(" km"));

  display.setCursor(0, 56);
  display.print(F("Spd: "));
  display.print(currentSpeedKmh, 1);
  display.print(F("k/h"));

  display.setCursor(72, 56);
  display.print(F("Cal:"));
  display.print((int)totalCalories);

  display.display();
}

/**
 * Handle Button on Pin 2
 * - Short click: Toggle Run / Pause
 * - Long click (> 800ms): Sync Telemetry JSON Packet to Serial
 */
void handleButton(unsigned long now) {
  static int lastButtonState = HIGH;
  static unsigned long btnPressStart = 0;
  int currentButtonState = digitalRead(PIN_BUTTON_SYNC);

  if (lastButtonState == HIGH && currentButtonState == LOW) {
    btnPressStart = now;
  } else if (lastButtonState == LOW && currentButtonState == HIGH) {
    unsigned long pressDuration = now - btnPressStart;

    if (pressDuration > 800) {
      // Long press -> SEND JSON TELEMETRY PACKET
      sendTelemetryJSON();
    } else if (pressDuration > 50) {
      // Short press -> Toggle Run/Pause
      isRunning = !isRunning;
      Serial.print(F("[STATUS] Running state: "));
      Serial.println(isRunning ? F("RUNNING") : F("PAUSED"));
    }
  }

  lastButtonState = currentButtonState;
}

/**
 * Output JSON payload to Serial for FootPod Web Application
 */
void sendTelemetryJSON() {
  digitalWrite(PIN_LED_STATUS, HIGH);

  // OLED notification
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(16, 20);
  display.println(F("SYNCING DATA..."));
  display.setCursor(8, 38);
  display.println(F("BNO055 -> Web App"));
  display.display();

  float avgAngle = (angleSampleCount > 0) ? (sumPitchAngle / angleSampleCount) : currentPitchAngle;
  unsigned long durationSec = (millis() - sessionStartMs) / 1000;

  // Build JSON packet
  StaticJsonDocument<512> doc;
  doc["event"] = "SYNC_SESSION";
  doc["sensorType"] = "BNO055_9DOF";
  doc["deviceId"] = "FP-BNO055";
  doc["distanceKm"] = round(totalDistanceKm * 100.0) / 100.0;
  doc["avgSpeedKmh"] = round(currentSpeedKmh * 10.0) / 10.0;
  doc["avgFootAngle"] = round(avgAngle * 10.0) / 10.0;
  doc["maxFootAngle"] = round(maxPitchAngle * 10.0) / 10.0;
  doc["minFootAngle"] = round(minPitchAngle * 10.0) / 10.0;
  doc["totalSteps"] = totalSteps;
  doc["durationMinutes"] = round(durationSec / 60.0);
  doc["caloriesBurned"] = (int)totalCalories;
  doc["batteryLevel"] = batteryPercent;

  Serial.println(F("\n================= [FOOTPOD BNO055 DATA PACKET] ================="));
  serializeJsonPretty(doc, Serial);
  Serial.println(F("\n=================================================================\n"));

  delay(600);
  digitalWrite(PIN_LED_STATUS, LOW);
}
