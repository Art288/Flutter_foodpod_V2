# คู่มือการทดสอบเซนเซอร์ FootPod (Arduino Uno / Nano + BNO055 9-DOF + OLED) บน Wokwi

ไฟล์สำหรับทดสอบจำลองฮาร์ดแวร์เซนเซอร์ **FootPod** โดยใช้ **BNO055 (9-Axis Absolute Orientation Sensor)** ร่วมกับ **Arduino Uno** และหน้าจอ **SSD1306 OLED (128x64)** บน [Wokwi Simulator](https://wokwi.com)

---

## 📁 รายการไฟล์ในโฟลเดอร์:
1. `diagram.json` — ผังวงจรการต่อขา Arduino Uno + BNO055 + จอ OLED + ปุ่มกด + LED
2. `sketch.ino` — เฟิร์มแวร์ C++ ดึงค่า Euler Pitch Angle (องศาการงอเท้า) และ Linear Acceleration จาก BNO055
3. `libraries.txt` — รายชื่อไลบรารี (`Adafruit BNO055`, `Adafruit SSD1306`, `ArduinoJson`)

---

## 🔌 ตารางการต่อวงจร (Pin Connections บน Arduino Uno):

| อุปกรณ์ | ขาอุปกรณ์ | ต่อเข้าขา Arduino Uno | หน้าที่ |
|---|---|---|---|
| **BNO055 (9-DOF IMU)** | VCC | `5V` (หรือ 3.3V) | ไฟเลี้ยงเซนเซอร์ |
| | GND | `GND` | กราวด์ |
| | SCL | `A5` | I2C Clock |
| | SDA | `A4` | I2C Data |
| **SSD1306 (OLED 128x64)** | VCC | `5V` | ไฟเลี้ยงจอ |
| | GND | `GND` | กราวด์ |
| | SCL | `A5` | I2C Clock (แชร์บัสกับ BNO055) |
| | SDA | `A4` | I2C Data (แชร์บัสกับ BNO055) |
| **Push Button** | ขา 1 | `Digital Pin 2` | ปุ่ม Start/Pause และกดค้างเพื่อซิงค์ |
| | ขา 2 | `GND` | Ground |
| **Status LED** | ขาบวก (Anode) | `Digital Pin 13` | ไฟแสดงสถานะการลงเท้า / การส่งข้อมูล |
| | ขาลบ (Cathode)| `GND` (ผ่าน R 220Ω) | Ground |

---

## 🚀 วิธีการนำไปรันบน Wokwi.com:

1. เปิดเว็บ [https://wokwi.com](https://wokwi.com) แล้วเลือกโปรเจกต์ **Arduino Uno** (C++)
2. คัดลอกโค้ดใน **`diagram.json`** ไปวางในแท็บ `diagram.json`
3. คัดลอกโค้ดใน **`sketch.ino`** ไปวางในแท็บ `sketch.ino`
4. คัดลอกรายชื่อใน **`libraries.txt`** ไปใส่ในแท็บ `Library Manager`
5. กดปุ่ม **Start Simulation (Play ▶)**

---

## 🕹️ การทดสอบและผลลัพธ์:
1. **องศาการงอเท้า (Flexion Angle)**:
   - ดึงข้อมูลจาก Euler Pitch ของ BNO055 โดยตรง ทำให้ได้องศาที่แม่นยำ ไม่ดริฟต์
   - แสดงสถานะบนจอ OLED: `[SAFE]` (15°-25°), `[FORE]` (<15°), `[HEEL]` (>25°)
2. **การนับก้าว & คำนวณแคลอรี่**:
   - วัดแรงกระแทกจาก `Linear Acceleration` (ตัดแรงโน้มถ่วงออก)
   - คำนวณความเร็ว (Speed), ระยะทาง (Distance km), และ แคลอรี่ (Calories kcal) แบบเรียลไทม์
3. **การซิงค์ข้อมูลเข้าเว็บแอป (JSON Data Sync)**:
   - **กดปุ่มส้มค้าง > 1 วินาที**: ส่งข้อมูล JSON ออกทาง Serial Monitor เพื่อนำไปใช้กับเว็บแอปพลิเคชัน FootPod

---

## 📶 การเชื่อมต่อ Wi-Fi กับ ESP32 / FootPod (คู่มือสำหรับ Web App และ Flutter):

FootPod รองรับการเชื่อมต่อผ่าน **Wi-Fi SoftAP** และ **Local Network (LAN)** เพื่อให้แอป Flutter และ Web App สามารถดึงค่า Telemetry และประวัติการวิ่งได้พร้อมกัน:

### 1. เครือข่ายเริ่มต้น (ESP32 SoftAP Default):
- **SSID**: `FootPod-AP-C3`
- **Password**: `footpod1234` (หรือ Open AP)
- **Default IP Address**: `192.168.4.1`
- **Port**: `80`

### 2. Endpoints API สำหรับรับส่งข้อมูล (HTTP REST):
- `GET /api/status`: เช็คสถานะอุปกรณ์, แบตเตอรี่, ชื่อ และเวอร์ชันเฟิร์มแวร์
- `GET /api/telemetry`: ดึงค่าสด (องศาการงอเท้า, ความเร็ว, Cadence, ค่าความเร่งแกน Z)
- `GET /api/sync`: ดึงประวัติเซสชันการวิ่งล่าสุดที่บันทึกไว้ในแรมหรือ MicroSD

### 3. วิธีเชื่อมต่อจากแอป:
- **ใน Web App (`http://localhost:3000`)**: กดปุ่ม **"เชื่อมต่อ Wi-Fi"** บนแท็บสถานะ ระบุ IP `192.168.4.1` แล้วกด **"เชื่อมต่อ Wi-Fi กับ FootPod ตอนนี้"**
- **ใน Flutter App**: กดปุ่ม **"เชื่อมต่อ Wi-Fi"** ที่มุมบนขวาหรือในแถบสถานะ สามารถสตรีมสดและกดซิงค์ข้อมูลได้ทันที
