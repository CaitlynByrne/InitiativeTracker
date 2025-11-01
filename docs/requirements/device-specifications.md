# Device Specifications

## Overview

This document defines the hardware and software specifications for all devices in the Initiative Tracker system.

## Infrastructure Server (Raspberry Pi)

### Hardware Requirements

**Minimum Specifications:**
- Raspberry Pi 3B or newer
- 1GB RAM (2GB recommended)
- 16GB microSD card (32GB recommended, Class 10)
- 2.4GHz WiFi (5GHz recommended for Pi 3B+/4)
- Ethernet port (for wired connection option)
- 5V 2.5A power supply

**Recommended Models:**
- Raspberry Pi 4 Model B (2GB or 4GB)
- Raspberry Pi 3 Model B+

**Storage:**
- SD card for OS and application (~4GB used)
- Persistent data storage (~100MB per saved session)
- Redis data directory (~50MB)

### Software Requirements

**Operating System:**
- Raspberry Pi OS (Debian-based)
- Lite or Desktop version acceptable
- Kernel 4.19+

**Software Stack:**
- Docker Engine 20.10+
- Docker Compose 1.29+
- Network Manager (for WiFi configuration)
- Avahi daemon (for mDNS/raspberrypi.local)

**Services (Running in Docker):**
- Node.js 18+ (WebSocket server)
- Redis 7+ (state persistence)
- Nginx 1.23+ (static file serving)

### Network Configuration

**Network Interface:**
- WiFi (2.4GHz or 5GHz)
- Or Ethernet (preferred for stability)

**IP Address:**
- Static IP: 192.168.1.100 (recommended)
- Or DHCP with hostname resolution (raspberrypi.local)

**Ports:**
- 3000: WebSocket server (internal)
- 6379: Redis (internal only, not exposed)
- 80: HTTP/WebSocket (external)

**Network Requirements:**
- Low latency local network (<10ms)
- Minimum 10Mbps bandwidth
- No internet connection required

### Resource Usage

**Expected Resource Consumption:**
- RAM: 100-150MB (WebSocket server + Redis + Nginx)
- CPU: 10-25% under normal load
- Storage: 500MB for application, 100-500MB for data
- Network: <1Mbps typical bandwidth usage

**Scaling Limits:**
- Max concurrent connections: 50 (20 expected)
- Max initiative entries: 100 (20 typical)
- Max saved sessions: Limited by storage (~10MB each)

---

## DM Console (Web Application)

### Device Requirements

**Supported Devices:**
- Laptop (Windows, Mac, Linux)
- Tablet (iPad, Android, Windows)
- Desktop computer

**Screen Size:**
- Minimum: 7" tablet (1024x600)
- Recommended: 10"+ tablet or 13"+ laptop
- Optimal: 15"+ laptop display

### Browser Requirements

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- WebSocket support
- ES6 JavaScript support
- CSS Grid and Flexbox
- LocalStorage API
- Touch events (for tablets)

### Network Requirements

- WiFi connection to same network as server
- 2.4GHz or 5GHz WiFi
- Minimum signal strength: -70 dBm
- Latency: <50ms to server

### Input Methods

**Supported:**
- Mouse and keyboard (desktop/laptop)
- Touchscreen (tablet)
- Trackpad gestures (laptop)

**Interactions:**
- Click/tap buttons
- Drag-and-drop initiative entries
- Text input for creature names
- Scroll/swipe for long lists

### Performance Targets

- Page load time: <2 seconds
- Event response time: <50ms
- Smooth animations: 60fps
- Memory usage: <100MB

---

## Shared Display (Raspberry Pi + Monitor)

### Raspberry Pi Specifications

**Hardware:**
- Raspberry Pi 3B+ or newer (Pi 4 recommended)
- 1GB RAM minimum (2GB recommended)
- 8GB microSD card minimum
- HDMI output
- WiFi or Ethernet
- 5V 2.5A power supply

**Operating System:**
- Raspberry Pi OS (Desktop or Lite with X11)
- Auto-login enabled
- Kiosk mode configured

### Display Requirements

**Supported Displays:**
- Any HDMI monitor or TV
- Minimum resolution: 1280x720 (720p)
- Recommended: 1920x1080 (1080p)
- Supported: 3840x2160 (4K)

**Orientation:**
- Landscape (primary)
- Portrait (supported)

**Size:**
- Minimum: 24" for table viewing
- Recommended: 32-43" TV
- Maximum: Limited by HDMI cable length

**Viewing Distance:**
- Target: 6-8 feet (typical game table)
- Text readable from this distance
- High contrast required

### Software Configuration

**Display Manager:**
- X11 display server
- Openbox window manager (lightweight)
- Chromium browser in kiosk mode

**Auto-Start Configuration:**
- systemd service for X11
- Openbox autostart script
- Chromium launches full-screen
- No screen saver or blanking

**Browser:**
- Chromium 90+ (bundled with Raspberry Pi OS)
- Kiosk mode flags
- Hardware acceleration enabled
- WebSocket support

### Network Requirements

- WiFi or Ethernet to server
- Same network as server
- Low latency (<20ms to server)
- No internet required

### Performance Targets

- Page load: <3 seconds
- Update latency: <100ms from server
- Smooth scrolling/animations
- No screen tearing

---

## Player Device (ESP32)

### Hardware Specifications

**MCU Requirements:**
- ESP32 (dual-core, 240MHz)
- 520KB RAM minimum
- 4MB flash minimum
- WiFi 802.11 b/g/n (2.4GHz)
- PSRAM optional (recommended for large displays)

**Recommended Modules:**
- ESP32-DevKitC
- ESP32-WROVER (with PSRAM)
- ESP32-S3 (newer, better performance)

**Display Requirements:**
- LCD or OLED touchscreen
- SPI or I2C interface
- Resistive or capacitive touch

**Supported Display Sizes:**
- Small: 240x135 pixels (1.14")
- Medium: 320x240 pixels (2.4"-2.8")
- Large: 480x320 pixels (3.5"-4.3")

**Display Driver Support:**
- ST7789 (common for small/medium)
- ILI9341 (common for medium)
- ILI9488 (common for large)

**Power Requirements:**
- Battery: 3.7V Li-Po 500mAh minimum
- Or USB powered (5V via USB-C/micro-USB)
- Charging circuit (if battery powered)

**Optional Components:**
- Battery level monitoring (ADC)
- Buzzer/speaker for audio alerts
- Status LED

### Software Specifications

**Framework:**
- Arduino framework (recommended)
- Or ESP-IDF (advanced)

**Required Libraries:**
- LVGL 8.x (UI framework)
- ArduinoWebSockets (WebSocket client)
- ArduinoJson 6.x (JSON parsing)
- WiFi library (built-in)
- Display driver library (depends on hardware)

**Firmware Size:**
- Code: ~800KB
- LVGL library: ~200KB
- Total flash usage: <1.5MB
- RAM usage: 60-100KB (depends on display size)

**Configuration:**
- WiFi SSID/password (hardcoded or configured)
- Server IP or hostname
- Device ID (unique per device)
- Display size constant

### Display Configurations

**240x135 Display (Small):**
- LVGL buffer: 240x20 pixels
- Font size: Montserrat 14-16
- RAM usage: ~60KB
- Suitable for basic status display

**320x240 Display (Medium):**
- LVGL buffer: 320x20 pixels
- Font size: Montserrat 18-24
- RAM usage: ~80KB
- Recommended for balanced experience

**480x320 Display (Large):**
- LVGL buffer: 480x20 pixels
- Font size: Montserrat 24-32
- RAM usage: ~100KB
- Best readability, requires PSRAM recommended

### Network Requirements

**WiFi:**
- 2.4GHz 802.11 b/g/n
- WPA2 security
- Minimum signal: -75 dBm
- Latency: <100ms to server

**Protocol:**
- WebSocket client
- JSON message format
- Auto-reconnection on disconnect
- Exponential backoff

### Power Management

**Active Mode:**
- Display on, WiFi active
- Current: ~150-250mA
- Used during player's turn

**Idle Mode:**
- Display dimmed, WiFi active
- Current: ~80-120mA
- Used when not player's turn

**Sleep Mode (Optional):**
- Display off, light sleep
- WiFi maintained
- Current: ~40-60mA
- Wake on WebSocket message

**Battery Life Estimates:**
- 500mAh battery, mostly idle: 4-6 hours
- 1000mAh battery, mostly idle: 8-12 hours
- USB powered: Unlimited

### Performance Targets

- Boot to connected: <10 seconds
- WebSocket message parse time: <10ms
- UI update latency: <50ms
- Display refresh rate: 30fps minimum
- Touch response time: <100ms

### Physical Design

**Enclosure:**
- 3D printed or off-the-shelf case
- Access to USB port for charging/programming
- Mounting for display
- Optional: belt clip or stand

**Dimensions:**
- Compact: Fits in hand (palm-sized)
- Portable: Easy to place on table
- Target: <10cm x 8cm x 2cm (depends on display)

**Durability:**
- Survive drops from table height (optional)
- Splash-resistant (optional)
- Robust USB connector

---

## Comparison Matrix

| Device | CPU | RAM | Storage | Display | Power | Network | Cost |
|--------|-----|-----|---------|---------|-------|---------|------|
| Server Pi | 4-core 1.5GHz | 2-4GB | 16GB SD | None | 5V 2.5A | WiFi/Eth | $50-75 |
| DM Console | Varies | 4GB+ | N/A | 10-15" | Battery | WiFi | $300+ |
| Display Pi | 4-core 1.5GHz | 1-2GB | 8GB SD | External | 5V 2.5A | WiFi/Eth | $35-50 |
| TV/Monitor | N/A | N/A | N/A | 24-43" | AC | N/A | $150-400 |
| ESP32 Player | 2-core 240MHz | 520KB | 4MB | 2-4" touch | Battery/USB | WiFi | $15-40 |

---

## Bill of Materials (BOM)

### Complete System for 4 Players

**Infrastructure:**
- 1x Raspberry Pi 4 (2GB): $45
- 1x 32GB microSD card: $8
- 1x Pi power supply: $8
- 1x Ethernet cable (optional): $5
- **Subtotal: $66**

**Shared Display:**
- 1x Raspberry Pi 3B+: $35
- 1x 16GB microSD card: $6
- 1x Pi power supply: $8
- 1x 32" TV with HDMI: $200
- 1x HDMI cable: $8
- **Subtotal: $257**

**DM Console:**
- Use existing laptop/tablet: $0
- **Subtotal: $0**

**Player Devices (x4):**
- 4x ESP32 module: $32 (4 x $8)
- 4x 320x240 touchscreen: $60 (4 x $15)
- 4x 1000mAh battery: $24 (4 x $6)
- 4x enclosure (3D printed): $20 (material cost)
- Misc (wiring, switches): $10
- **Subtotal: $146**

**Total System Cost: ~$470**

---

## Development Environment

### Server Development

**Required:**
- Node.js 18+ LTS
- Docker Desktop (for local testing)
- Redis client (redis-cli or GUI)
- Git
- Code editor (VS Code recommended)

**Testing:**
- Raspberry Pi hardware (optional, can test in Docker)
- Local WiFi network

### Web Development (DM Console / Pi Display)

**Required:**
- Node.js 18+ (for build tools)
- npm or yarn
- Modern browser with DevTools
- Code editor

**Optional:**
- Vue DevTools browser extension
- Responsive design testing tools

### ESP32 Development

**Required:**
- Arduino IDE 2.0+ or PlatformIO
- ESP32 board support package
- USB cable for programming
- Serial monitor

**Libraries:**
- Install via Library Manager:
  - LVGL
  - ArduinoWebSockets
  - ArduinoJson
  - TFT_eSPI (or appropriate display driver)

**Hardware:**
- ESP32 dev board
- Target display hardware
- USB cable

**Testing:**
- WiFi network
- Server running locally or on Pi
