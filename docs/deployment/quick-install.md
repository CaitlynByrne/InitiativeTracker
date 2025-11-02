# Quick Installation Guide

This guide covers the one-shot installation script for deploying Initiative Tracker to Raspberry Pi devices.

## Installation Methods

### Method 1: One-Line Install (Recommended)

```bash
# Using curl
curl -fsSL https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash

# Or using wget
wget -qO- https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash
```

### Method 2: Download and Review First

If you want to review the script before running it:

```bash
# Download the script
wget https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh

# Review the script
less install-pi.sh

# Make it executable
chmod +x install-pi.sh

# Run it
./install-pi.sh
```

## Installation Types

The installer supports two deployment types:

### Server Pi (Infrastructure)

This is the main server that runs the Docker containers (WebSocket server, Redis, web apps, nginx).

**When asked:** "Configure as display Pi?" → Answer **No** (N)

**Hardware:** Raspberry Pi 3B+ or 4 (headless, no monitor needed)

**What it does:**
- Installs Docker
- Clones the repository
- Configures DNS with your Pi's IP
- Builds and starts all Docker services
- Sets up auto-start on boot
- Installs Avahi for mDNS

**Access after install:**
- DM Console: `http://dm.initiative` or `http://<pi-ip>`
- Pi Display: `http://player.initiative` or `http://<pi-ip>`

### Display Pi (Shared Display/TV)

This is a Pi connected to a TV/monitor that shows the initiative tracker to all players.

**When asked:** "Configure as display Pi?" → Answer **Yes** (Y)

**Hardware:** Raspberry Pi 3B+ or 4 with **Raspberry Pi OS Desktop** edition

**What it does:**
- Everything the Server Pi does, PLUS:
- Installs Chromium browser
- Installs unclutter (auto-hide mouse)
- Configures auto-login
- Sets up kiosk mode (fullscreen browser)
- Disables screen blanking
- Auto-boots to `http://player.initiative`

**Important:** The Display Pi can also run the server if you want a single-Pi setup.

## Typical Deployment Scenarios

### Scenario 1: Two-Pi Setup (Recommended)

**Server Pi** (under table, headless):
```bash
# SSH into server Pi
ssh pi@<server-pi-ip>

# Run installer
curl -fsSL https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash

# When prompted: Configure as display Pi? → N
```

**Display Pi** (connected to TV):
```bash
# SSH into display Pi (or use keyboard/monitor)
ssh pi@<display-pi-ip>

# Run installer
curl -fsSL https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash

# When prompted: Configure as display Pi? → Y

# Edit display Pi's /etc/hosts to point to server Pi:
echo "<server-pi-ip> player.initiative dm.initiative" | sudo tee -a /etc/hosts

# Reboot to activate kiosk mode
sudo reboot
```

**Result:** Server Pi runs all services, Display Pi just shows the web interface on the TV.

### Scenario 2: Single-Pi Setup (Budget Option)

Use one Pi that both runs the server AND displays to the TV.

```bash
# Run installer on the Pi
curl -fsSL https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash

# When prompted: Configure as display Pi? → Y

# Reboot to activate kiosk mode
sudo reboot
```

**Result:** One Pi does everything - serves the app and displays it on the TV.

## What the Installer Does

1. **Platform Check** - Verifies it's a Raspberry Pi (with override option)
2. **Network Detection** - Auto-detects IP address and network interface
3. **Kiosk Prompt** - Asks if this is a display Pi
4. **System Update** - Runs `apt update && apt upgrade`
5. **Docker Install** - Installs Docker and Docker Compose
6. **Git Install** - Ensures git is available
7. **Repository Clone** - Clones Initiative Tracker from GitHub
8. **DNS Configuration** - Updates dnsmasq with detected IP
9. **Kiosk Packages** - (Display Pi only) Installs Chromium, unclutter
10. **Service Start** - Builds and starts Docker containers
11. **Systemd Setup** - Creates auto-start service
12. **Avahi Install** - Enables mDNS for easier access
13. **Kiosk Setup** - (Display Pi only) Configures auto-boot browser
14. **Local DNS** - (Display Pi only) Adds hosts file entries
15. **Completion** - Shows access URLs and next steps

## Post-Installation

### For Server Pi

```bash
# Check service status
sudo systemctl status initiative-tracker

# View logs
cd ~/InitiativeTracker/infrastructure
docker compose logs -f

# Restart services
sudo systemctl restart initiative-tracker
```

### For Display Pi

After reboot, the Pi will:
- Auto-login to desktop
- Launch Chromium in fullscreen kiosk mode
- Display `http://player.initiative`
- Hide mouse cursor after 2 seconds
- Never sleep or show screensaver

**To exit kiosk mode:**
- Press `Alt+F4` or `Ctrl+W`

**To disable kiosk mode:**
```bash
# Remove the autostart script
rm ~/.config/openbox/autostart
```

## Troubleshooting

### Installer Issues

**"Could not detect IP address"**
- Manually enter your Pi's IP when prompted
- Check network: `ip addr show`

**"Docker Compose not found"**
- Older Raspberry Pi OS may not include it
- Install manually: `sudo apt install docker-compose-plugin`

**"No desktop environment detected"** (Display Pi)
- You need Raspberry Pi OS Desktop edition for kiosk mode
- Download from: https://www.raspberrypi.com/software/

### Kiosk Mode Issues

**Browser doesn't launch on boot**
- Check autostart exists: `cat ~/.config/openbox/autostart`
- Check auto-login: `grep autologin /etc/lightdm/lightdm.conf`
- Check logs: `cat ~/.xsession-errors`

**Can't connect to player.initiative**
- Check /etc/hosts: `cat /etc/hosts`
- Should contain: `<server-ip> player.initiative`
- Test connection: `ping player.initiative`

**Screen goes blank/sleeps**
- Re-run screen config:
  ```bash
  sudo tee /etc/lightdm/lightdm.conf.d/50-no-screensaver.conf > /dev/null <<EOF
  [Seat:*]
  xserver-command=X -s 0 -dpms
  EOF
  sudo reboot
  ```

### Service Issues

**Services won't start**
```bash
cd ~/InitiativeTracker/infrastructure
docker compose logs
```

**Port conflicts**
```bash
# Check what's using ports
sudo netstat -tulpn | grep ':80\|:3000'

# Stop conflicting services
sudo systemctl stop apache2  # if installed
```

**DNS not working**
- Check dnsmasq container: `docker ps | grep dnsmasq`
- Check configuration: `cat ~/InitiativeTracker/infrastructure/dnsmasq.conf`
- Verify IP addresses match your Pi's IP

## Advanced Configuration

### Change Kiosk URL

To point to a different URL (e.g., using IP instead of DNS):

```bash
nano ~/.config/openbox/autostart

# Change this line:
#   http://player.initiative
# To:
#   http://192.168.1.100

# Then reboot
```

### Disable Auto-Start

```bash
sudo systemctl disable initiative-tracker
```

### Update Installation

```bash
cd ~/InitiativeTracker
git pull
cd infrastructure
docker compose down
docker compose up -d --build
```

## Network Configuration

### Configure Client Devices to Use Pi DNS

To use `dm.initiative` and `player.initiative` from other devices:

**iOS/iPad:**
1. Settings → Wi-Fi → (i) next to your network
2. Configure DNS → Manual
3. Add Server: `<pi-ip-address>`

**Android:**
1. Settings → Network & Internet → Wi-Fi → Gear icon
2. Advanced → IP Settings → Static
3. DNS 1: `<pi-ip-address>`

**Windows:**
1. Network Settings → Change adapter options
2. Right-click network → Properties
3. IPv4 → Properties → Use the following DNS
4. Preferred DNS: `<pi-ip-address>`

**Mac:**
1. System Preferences → Network
2. Advanced → DNS
3. Add `<pi-ip-address>`

### Alternative: Use IP Addresses

If you don't want to configure DNS, just use IP addresses:
- DM Console: `http://<pi-ip-address>`
- Pi Display: `http://<pi-ip-address>`

The nginx reverse proxy will need updating to respond to IP addresses. See the production docker-compose.yml.

## See Also

- [Full Setup Guide](setup-guide.md) - Detailed manual installation
- [Architecture Overview](../architecture/overview.md)
- [Troubleshooting Guide](setup-guide.md#part-7-troubleshooting)
