# Network Configuration Guide

## Overview

This guide explains how to configure local network access for the Initiative Tracker system, including DNS setup for easy access without memorizing ports or IP addresses.

## Development Environment

### Network Access

The development Docker Compose setup ([docker-compose.dev.yml](../../infrastructure/docker-compose.dev.yml)) exposes all services on `0.0.0.0`, making them accessible from any device on your local network.

**Accessible Services:**
- **Redis**: `http://<your-ip>:6379`
- **WebSocket Server**: `http://<your-ip>:3000`
- **DM Console**: `http://<your-ip>:5173`
- **Pi Display**: `http://<your-ip>:5174`

### Find Your Development Machine IP

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ip addr show
# or
ifconfig
```

### Access from Other Devices

Once your dev environment is running, any device on the same network can access:
- DM Console: `http://192.168.1.x:5173` (replace with your IP)
- Pi Display: `http://192.168.1.x:5174`

---

## Production Environment

### Architecture

The production setup uses **dnsmasq + nginx** for zero-configuration network access:

```
Device on Network
    ↓ (DNS Query: "dm.initiative")
dnsmasq (port 53) → Returns server IP
    ↓ (HTTP Request: http://dm.initiative)
nginx (port 80) → Routes based on domain:
    ├─ dm.initiative → DM Console
    ├─ player.initiative → Pi Display
    └─ /socket.io/ → WebSocket Server
```

**Benefits:**
- **Zero configuration** - just point DNS to server
- **No port numbers** to remember
- **Clean URLs**: `http://dm.initiative` and `http://player.initiative`
- **Network-wide** - configure once, works for all devices
- **Self-contained** - no router or external infrastructure needed
- **Works offline** - no internet required

### Services

The production Docker Compose includes:
- **redis**: State persistence (internal only)
- **server**: WebSocket server (internal only, accessed via nginx)
- **dm-console**: DM web interface (internal only)
- **pi-display**: Player display interface (internal only)
- **nginx**: Reverse proxy (exposed on port 80)
- **dnsmasq**: Local DNS server (exposed on port 53)

---

## DNS Setup - Recommended Approach

### Using Built-in dnsmasq (Recommended)

The production docker-compose includes **dnsmasq**, a lightweight DNS server that provides automatic domain resolution for your Initiative Tracker setup.

#### Step 1: Configure dnsmasq

Edit [dnsmasq.conf](../../infrastructure/dnsmasq.conf) and replace `192.168.1.100` with your server's actual IP address:

```bash
cd infrastructure
nano dnsmasq.conf
```

Find and replace all instances of `192.168.1.100` with your server's IP:

```conf
# DM Console - dm.initiative
address=/dm.initiative/192.168.1.100

# Player Display - player.initiative
address=/player.initiative/192.168.1.100

# Wildcard - all *.initiative domains go to server
address=/initiative/192.168.1.100
```

Save and exit.

#### Step 2: Start Services

```bash
cd infrastructure
docker-compose up -d
```

This starts all services including dnsmasq on port 53 (DNS).

#### Step 3: Configure Devices to Use Server DNS

Now configure each device to use your server as a DNS server. The server will:
- Resolve `*.initiative` domains to itself
- Forward all other DNS queries to upstream DNS (Google DNS by default)

**Option A: Add as Secondary DNS (Recommended)**

This is safest - if your server is offline, devices still have internet access.

##### Windows

1. Open **Settings** → **Network & Internet**
2. Click your connection (WiFi or Ethernet)
3. Click **Properties**
4. Scroll to **IP settings** → **Edit**
5. Choose **Manual** → Enable **IPv4**
6. Set:
   - **Preferred DNS**: Your router (e.g., `192.168.1.1`)
   - **Alternate DNS**: Your server (e.g., `192.168.1.100`)
7. Save

##### Mac

1. **System Preferences** → **Network**
2. Select your connection → **Advanced**
3. **DNS** tab
4. Click **+** to add DNS servers:
   - First: Your router (e.g., `192.168.1.1`)
   - Second: Your server (e.g., `192.168.1.100`)
5. Click **OK** → **Apply**

##### Linux

Edit `/etc/resolv.conf` or use NetworkManager:

```bash
sudo nano /etc/resolv.conf
```

Add (keeping existing nameservers):
```
nameserver 192.168.1.1
nameserver 192.168.1.100
```

##### iOS/iPad

1. **Settings** → **WiFi**
2. Tap (i) next to your network
3. Scroll to **DNS** → **Configure DNS**
4. Select **Manual**
5. Add servers:
   - First: Your router
   - Second: Your server IP
6. Save

##### Android

1. **Settings** → **Network & Internet** → **WiFi**
2. Tap your network → **Edit**
3. **Advanced options** → **IP settings** → **Static**
4. Set **DNS 1**: Your router
5. Set **DNS 2**: Your server IP
6. Save

##### Raspberry Pi (for Display Pi)

```bash
sudo nano /etc/dhcpcd.conf
```

Add at end:
```conf
# Use initiative server as DNS
static domain_name_servers=192.168.1.100 192.168.1.1
```

Save and reboot:
```bash
sudo reboot
```

**Option B: Router-Wide Configuration (Easiest)**

If your router supports custom DNS, configure it to use your server as primary or secondary DNS:

1. Log into router admin (usually `http://192.168.1.1`)
2. Find **DHCP** or **DNS** settings
3. Set **Primary DNS**: Your router's own IP (for local resolution)
4. Set **Secondary DNS**: Your server IP (e.g., `192.168.1.100`)
5. Save and restart router

Now all devices automatically use the server's DNS without per-device configuration.

#### Step 4: Test DNS Resolution

From any configured device:

```bash
# Should return your server's IP
ping dm.initiative
ping player.initiative

# Should still work (forwarded to upstream DNS)
ping google.com
```

#### Step 5: Access Services

Open browser and navigate to:
- **DM Console**: http://dm.initiative
- **Pi Display**: http://player.initiative

No ports, no IP addresses, just clean URLs!

---

## Alternative DNS Methods

If you prefer not to use the built-in dnsmasq, here are alternatives:

### Option 1: Hosts File (Per-Device, No Server Config)

Edit the hosts file on each device. This works without running dnsmasq.

**Windows:**
1. Run Notepad as Administrator
2. Open: `C:\Windows\System32\drivers\etc\hosts`
3. Add:
   ```
   192.168.1.100    dm.initiative
   192.168.1.100    player.initiative
   ```
4. Save

**Mac/Linux/Raspberry Pi:**
```bash
sudo nano /etc/hosts
```
Add:
```
192.168.1.100    dm.initiative
192.168.1.100    player.initiative
```
Save and exit.

**Pros:**
- Simple, no server-side configuration
- Works immediately

**Cons:**
- Must configure each device individually
- Manual updates if IP changes

### Option 2: Pi-hole (Advanced, More Features)

If you already run Pi-hole on your network:

1. Add local DNS records in Pi-hole admin
2. Set records:
   - `dm.initiative` → `192.168.1.100`
   - `player.initiative` → `192.168.1.100`

**Pros:**
- Network-wide configuration
- Ad blocking and other features

**Cons:**
- Requires separate Pi-hole installation
- More complex setup

---

## Firewall Configuration

### Development Machine

If running a firewall, allow incoming connections on:
- **TCP 6379** (Redis)
- **TCP 3000** (WebSocket Server)
- **TCP 5173** (DM Console)
- **TCP 5174** (Pi Display)

**Windows Firewall:**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Initiative Tracker Dev" -Direction Inbound -LocalPort 3000,5173,5174,6379 -Protocol TCP -Action Allow
```

**Linux (ufw):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 5174/tcp
sudo ufw allow 6379/tcp
```

### Production Server (Raspberry Pi)

For production, allow ports 53 (DNS) and 80 (HTTP):

```bash
sudo ufw allow 53/udp
sudo ufw allow 53/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

All other services are isolated within Docker's internal network.

---

## Access URLs Summary

### Production (with dnsmasq or hosts file)

- **DM Console**: http://dm.initiative
- **Pi Display**: http://player.initiative

### Production (without DNS, direct IP)

- **DM Console**: http://192.168.1.100 (then nginx returns 404 - needs domain name)
- Use: http://`<server-ip>` won't work without proper Host header

### Development (direct port access)

Replace `192.168.1.x` with your development machine's IP:
- **DM Console**: http://192.168.1.x:5173
- **Pi Display**: http://192.168.1.x:5174
- **WebSocket Server**: http://192.168.1.x:3000

---

## Kiosk Mode Configuration for Pi Display

### Development Server

```bash
nano ~/.config/openbox/autostart
```

Add (replace with your dev machine IP):
```bash
chromium-browser --kiosk --disable-infobars \
  http://192.168.1.x:5174 &
```

### Production Server (with DNS)

```bash
nano ~/.config/openbox/autostart
```

Add:
```bash
chromium-browser --kiosk --disable-infobars \
  http://player.initiative &
```

Much cleaner!

---

## Troubleshooting

### DNS Not Resolving

**Check dnsmasq is running:**
```bash
docker ps | grep dnsmasq
```

**Check dnsmasq logs:**
```bash
docker logs initiative-dns
```

**Test DNS directly:**
```bash
# Query the server's DNS directly
nslookup dm.initiative 192.168.1.100
# or
dig @192.168.1.100 dm.initiative
```

Should return your server's IP.

**Check device DNS configuration:**

Windows:
```bash
ipconfig /all
```
Look for "DNS Servers" - should include your server IP.

Mac/Linux:
```bash
cat /etc/resolv.conf
```
Should show `nameserver 192.168.1.100`

**Flush DNS cache:**

Windows:
```bash
ipconfig /flushdns
```

Mac:
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

Linux:
```bash
sudo systemd-resolve --flush-caches
```

### dnsmasq Won't Start

**Check if port 53 is already in use:**
```bash
sudo netstat -tulpn | grep :53
```

On some systems, `systemd-resolved` uses port 53. Disable it:

```bash
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
```

Or configure systemd-resolved to use a different port.

**Check dnsmasq.conf syntax:**
```bash
docker exec initiative-dns dnsmasq --test
```

### Can't Access Services

**Check all containers are running:**
```bash
cd infrastructure
docker-compose ps
```

All services should show "Up" status.

**Check nginx logs:**
```bash
docker logs initiative-nginx
```

**Check firewall:**
```bash
# Linux
sudo ufw status

# Check if ports are listening
sudo netstat -tulpn | grep -E ':80|:53'
```

**Test direct container access:**
```bash
# From server, test if nginx can reach services
docker exec initiative-nginx wget -O - http://dm-console:80
docker exec initiative-nginx wget -O - http://pi-display:80
```

### Wrong Page Displayed

**Check nginx routing:**
```bash
docker exec initiative-nginx cat /etc/nginx/nginx.conf | grep server_name
```

Verify server_name directives: `dm.initiative` and `player.initiative`

**Check browser cache:**
- Clear browser cache and reload
- Try incognito/private browsing mode

**Check you're using the correct URL:**
- Must use domain name: `http://dm.initiative`
- NOT IP address: `http://192.168.1.100` (will get 404)

### WebSocket Connection Fails

**Check nginx WebSocket config:**
```bash
docker exec initiative-nginx cat /etc/nginx/nginx.conf | grep -A 5 socket.io
```

Should have WebSocket upgrade headers.

**Check browser console:**
- F12 → Network tab → WS filter
- Look for WebSocket connection attempts
- Check for upgrade failures or 4xx/5xx errors

---

## Network Diagram

### Production Architecture

```
┌─────────────────┐
│   Router        │
│  192.168.1.1    │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    │          │          │          │
┌───▼────┐ ┌──▼─────┐ ┌──▼─────┐ ┌──▼─────┐
│ Server │ │Display │ │  DM    │ │ ESP32s │
│  Pi    │ │  Pi    │ │ Device │ │        │
│ :53    │ │        │ │        │ │        │
│ :80    │ │        │ │        │ │        │
└───┬────┘ └────────┘ └────────┘ └────────┘
    │
    │ Docker Network (172.x.x.x)
    │
┌───┴────────────────────────────────────────┐
│                                            │
│  ┌─────────────────────────────────────┐  │
│  │ dnsmasq :53 (DNS, port mapped)      │  │
│  │ Resolves *.initiative → server IP   │  │
│  └─────────────────────────────────────┘  │
│                                            │
│  ┌─────────────────────────────────────┐  │
│  │ Nginx :80 (HTTP, port mapped)       │  │
│  │ Routes by domain name:              │  │
│  └───┬──────────────┬──────────────────┘  │
│      │              │                      │
│  ┌───▼────┐    ┌────▼─────┐   ┌────▼───┐  │
│  │ Server │    │    DM    │   │   Pi   │  │
│  │  :3000 │    │ Console  │   │Display │  │
│  │(expose)│    │   :80    │   │  :80   │  │
│  └────────┘    │(expose)  │   │(expose)│  │
│                └──────────┘   └────────┘  │
└───────────────────────────────────────────┘
```

**Request Flow:**
1. Device queries DNS for `dm.initiative`
2. dnsmasq responds with server IP (`192.168.1.100`)
3. Browser sends HTTP request to `http://dm.initiative` (port 80)
4. nginx receives request, reads `Host: dm.initiative` header
5. nginx routes to `dm-console:80` container
6. Response sent back to browser

---

## Security Considerations

### Development

- Development environment is meant for local network only
- Do NOT expose dev ports to internet
- Use firewall to restrict access if on shared network

### Production

- Only ports 53 (DNS) and 80 (HTTP) exposed
- All internal services isolated in Docker network
- dnsmasq configured to only resolve `.initiative` domains
- All other DNS queries forwarded to trusted upstream

### Future Enhancements

For production deployment with internet access:
1. Add HTTPS/TLS with Let's Encrypt
2. Use DNS-over-TLS for upstream queries
3. Add rate limiting in nginx
4. Implement proper logging and monitoring
5. Consider VPN for remote access

---

## Why Not .local?

You might wonder why we use `.initiative` instead of `.local` domains.

**.local is reserved for mDNS/Avahi:**
- The `.local` TLD is reserved for multicast DNS (Bonjour/Avahi)
- Using `.local` with traditional DNS can cause conflicts
- Some operating systems won't query DNS for `.local` domains
- `.initiative` is a custom TLD that works reliably with DNS

**Advantages of .initiative:**
- No conflicts with mDNS
- Works reliably across all platforms
- Can add more subdomains easily (`api.initiative`, `admin.initiative`, etc.)
- Clear, project-specific naming

---

## Summary

### Recommended Setup: Built-in dnsmasq

**Why it's best:**
- ✅ Zero-configuration once DNS is set
- ✅ Works for entire network
- ✅ No external infrastructure needed
- ✅ Self-contained in Docker
- ✅ Clean URLs: `dm.initiative` and `player.initiative`
- ✅ No port numbers to remember
- ✅ Easy to use for non-technical players

**Setup:**
1. Edit `dnsmasq.conf` with your server IP
2. Start services: `docker-compose up -d`
3. Configure devices to use server as DNS (secondary DNS recommended)
4. Access at `http://dm.initiative` and `http://player.initiative`

### Alternative: Hosts File

Good for testing or small deployments, but requires configuring each device individually.

### Alternative: Router DNS

Best if your router supports it - automatic for all devices, but requires router configuration.
