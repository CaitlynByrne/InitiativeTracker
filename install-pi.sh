#!/bin/bash
# Initiative Tracker - Raspberry Pi Installation Script
# This script sets up the complete Initiative Tracker system on a Raspberry Pi
#
# Usage: curl -fsSL https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/CaitlynByrne/InitiativeTracker.git"
INSTALL_DIR="$HOME/InitiativeTracker"
SERVICE_NAME="initiative-tracker"
SETUP_KIOSK=false

# Helper functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running on Raspberry Pi
check_platform() {
    print_header "Checking Platform"

    if [[ ! -f /proc/device-tree/model ]] || ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
        print_warning "This doesn't appear to be a Raspberry Pi"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Installation cancelled"
            exit 1
        fi
    else
        PI_MODEL=$(cat /proc/device-tree/model)
        print_success "Detected: $PI_MODEL"
    fi
}

# Detect network configuration
detect_network() {
    print_header "Detecting Network Configuration"

    # Try to get the primary IP address
    IP_ADDRESS=$(hostname -I | awk '{print $1}')

    if [[ -z "$IP_ADDRESS" ]]; then
        print_error "Could not detect IP address"
        read -p "Please enter your Pi's IP address: " IP_ADDRESS
    else
        print_success "Detected IP address: $IP_ADDRESS"
        read -p "Is this correct? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            read -p "Please enter the correct IP address: " IP_ADDRESS
        fi
    fi

    # Detect interface
    INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
    if [[ -z "$INTERFACE" ]]; then
        INTERFACE="eth0"
        print_warning "Could not detect network interface, defaulting to $INTERFACE"
    else
        print_success "Detected network interface: $INTERFACE"
    fi
}

# Update system
update_system() {
    print_header "Updating System Packages"

    sudo apt-get update
    sudo apt-get upgrade -y

    print_success "System updated"
}

# Install Docker
install_docker() {
    print_header "Installing Docker"

    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker already installed: $DOCKER_VERSION"
    else
        print_info "Downloading and installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh

        print_success "Docker installed"
    fi

    # Add current user to docker group
    if groups $USER | grep -q '\bdocker\b'; then
        print_success "User already in docker group"
    else
        print_info "Adding $USER to docker group..."
        sudo usermod -aG docker $USER
        print_warning "You may need to log out and back in for docker group changes to take effect"
    fi

    # Check for docker compose
    if docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_success "Docker Compose available: $COMPOSE_VERSION"
    else
        print_error "Docker Compose not found"
        exit 1
    fi
}

# Install git if needed
install_git() {
    print_header "Checking Git Installation"

    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git already installed: $GIT_VERSION"
    else
        print_info "Installing git..."
        sudo apt-get install -y git
        print_success "Git installed"
    fi
}

# Clone repository
clone_repository() {
    print_header "Cloning Repository"

    if [[ -d "$INSTALL_DIR" ]]; then
        print_warning "Installation directory already exists: $INSTALL_DIR"
        read -p "Pull latest changes? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            cd "$INSTALL_DIR"
            git pull
            print_success "Repository updated"
        fi
    else
        print_info "Cloning from $REPO_URL..."
        git clone "$REPO_URL" "$INSTALL_DIR"
        print_success "Repository cloned to $INSTALL_DIR"
    fi
}

# Configure DNS
configure_dns() {
    print_header "Configuring Local DNS"

    DNSMASQ_CONF="$INSTALL_DIR/infrastructure/dnsmasq.conf"

    if [[ ! -f "$DNSMASQ_CONF" ]]; then
        print_error "dnsmasq.conf not found at $DNSMASQ_CONF"
        return 1
    fi

    print_info "Updating dnsmasq configuration with IP: $IP_ADDRESS"

    # Update IP addresses in dnsmasq.conf
    sed -i "s|address=/dm.initiative/.*|address=/dm.initiative/$IP_ADDRESS|" "$DNSMASQ_CONF"
    sed -i "s|address=/player.initiative/.*|address=/player.initiative/$IP_ADDRESS|" "$DNSMASQ_CONF"
    sed -i "s|address=/initiative/.*|address=/initiative/$IP_ADDRESS|" "$DNSMASQ_CONF"

    # Update interface
    sed -i "s|^interface=.*|interface=$INTERFACE|" "$DNSMASQ_CONF"

    print_success "DNS configuration updated"
}

# Build and start services
start_services() {
    print_header "Building and Starting Services"

    cd "$INSTALL_DIR/infrastructure"

    print_info "This may take several minutes on first run..."

    # Build and start in detached mode
    docker compose -f docker-compose.yml up -d --build

    print_success "Services started"

    # Wait a moment for services to initialize
    sleep 3

    # Check service status
    print_info "Service Status:"
    docker compose -f docker-compose.yml ps
}

# Setup systemd service
setup_systemd() {
    print_header "Setting Up Auto-Start Service"

    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

    print_info "Creating systemd service: $SERVICE_FILE"

    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Initiative Tracker Server
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR/infrastructure
ExecStart=/usr/bin/docker compose -f docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd, enable and start service
    sudo systemctl daemon-reload
    sudo systemctl enable "${SERVICE_NAME}.service"
    sudo systemctl start "${SERVICE_NAME}.service"

    print_success "Auto-start service enabled"
}

# Install Avahi for mDNS (optional but helpful)
install_avahi() {
    print_header "Installing Avahi for mDNS Discovery"

    if command -v avahi-daemon &> /dev/null; then
        print_success "Avahi already installed"
    else
        print_info "Installing avahi-daemon..."
        sudo apt-get install -y avahi-daemon
        sudo systemctl enable avahi-daemon
        sudo systemctl start avahi-daemon
        print_success "Avahi installed and started"
    fi
}

# Ask if this is a display Pi
ask_kiosk_setup() {
    print_header "Display Pi Configuration"

    echo -e "${YELLOW}Is this Pi going to be used as a shared display?${NC}"
    echo -e "If yes, it will auto-boot to fullscreen browser showing player.initiative"
    echo ""
    read -p "Configure as display Pi? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SETUP_KIOSK=true
        print_success "Will configure kiosk mode"
    else
        print_info "Skipping kiosk mode setup"
    fi
}

# Install packages needed for kiosk mode
install_kiosk_packages() {
    if [[ "$SETUP_KIOSK" != "true" ]]; then
        return 0
    fi

    print_header "Installing Kiosk Mode Packages"

    # Check if we're running a desktop environment
    if ! command -v startx &> /dev/null && ! pgrep -x "Xorg" > /dev/null; then
        print_warning "No desktop environment detected"
        print_info "You may need to install Raspberry Pi OS Desktop edition for kiosk mode"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            SETUP_KIOSK=false
            return 0
        fi
    fi

    print_info "Installing chromium-browser and unclutter..."
    sudo apt-get install -y chromium-browser unclutter xdotool

    print_success "Kiosk packages installed"
}

# Configure kiosk mode
configure_kiosk_mode() {
    if [[ "$SETUP_KIOSK" != "true" ]]; then
        return 0
    fi

    print_header "Configuring Kiosk Mode"

    # Create openbox autostart directory
    mkdir -p "$HOME/.config/openbox"

    # Create autostart script
    print_info "Creating autostart configuration..."
    cat > "$HOME/.config/openbox/autostart" <<EOF
# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor after 2 seconds of inactivity
unclutter -idle 2 &

# Wait for network to be ready
sleep 5

# Start Chromium in kiosk mode pointing to player display
chromium-browser --kiosk --disable-infobars --disable-session-crashed-bubble \\
  --disable-restore-session-state --noerrdialogs \\
  --disable-translate --disable-features=TranslateUI \\
  --check-for-update-interval=31536000 \\
  http://player.initiative &

# Optional: Auto-reload page every 24 hours to prevent memory leaks
# (xdotool key F5) runs every 86400 seconds (24 hours)
# Uncomment if needed:
# while true; do
#   sleep 86400
#   DISPLAY=:0 xdotool key F5
# done &
EOF

    chmod +x "$HOME/.config/openbox/autostart"
    print_success "Autostart script created"

    # Configure auto-login if not already configured
    if grep -q "autologin-user=" /etc/lightdm/lightdm.conf 2>/dev/null; then
        print_info "Auto-login already configured"
    else
        print_info "Configuring auto-login..."

        # Use raspi-config for auto-login if available
        if command -v raspi-config &> /dev/null; then
            print_warning "Auto-login setup requires manual configuration"
            print_info "After installation completes, run: sudo raspi-config"
            print_info "Then: System Options → Boot / Auto Login → Desktop Autologin"
        else
            # Manual lightdm configuration
            print_info "Configuring LightDM for auto-login..."
            sudo mkdir -p /etc/lightdm/lightdm.conf.d
            sudo tee /etc/lightdm/lightdm.conf.d/50-autologin.conf > /dev/null <<EOF
[Seat:*]
autologin-user=$USER
autologin-user-timeout=0
xserver-command=X -s 0 -dpms
EOF
            print_success "Auto-login configured"
        fi
    fi

    # Disable screen blanking in LightDM
    print_info "Disabling screen blanking..."
    sudo mkdir -p /etc/lightdm/lightdm.conf.d
    sudo tee /etc/lightdm/lightdm.conf.d/50-no-screensaver.conf > /dev/null <<EOF
[Seat:*]
xserver-command=X -s 0 -dpms
EOF

    print_success "Kiosk mode configured"

    print_warning "IMPORTANT: You may need to configure your hosts file or DNS"
    print_info "Option 1: Configure this Pi's /etc/hosts:"
    print_info "  echo '$IP_ADDRESS player.initiative' | sudo tee -a /etc/hosts"
    print_info "Option 2: Use the actual IP in the autostart script"
    print_info "  Edit ~/.config/openbox/autostart and change URL to http://$IP_ADDRESS"
}

# Configure local hosts file for kiosk mode
configure_local_dns() {
    if [[ "$SETUP_KIOSK" != "true" ]]; then
        return 0
    fi

    print_header "Configuring Local DNS Resolution"

    # Check if entry already exists
    if grep -q "player.initiative" /etc/hosts; then
        print_info "DNS entry already exists in /etc/hosts"
    else
        print_info "Adding player.initiative to /etc/hosts..."
        echo "$IP_ADDRESS player.initiative" | sudo tee -a /etc/hosts > /dev/null
        echo "$IP_ADDRESS dm.initiative" | sudo tee -a /etc/hosts >> /dev/null
        print_success "Local DNS configured"
    fi
}

# Display final information
show_completion_info() {
    print_header "Installation Complete!"

    echo -e "${GREEN}Initiative Tracker has been successfully installed!${NC}\n"

    echo -e "${BLUE}Access Information:${NC}"
    echo -e "  DM Console:    http://dm.initiative (or http://$IP_ADDRESS)"
    echo -e "  Pi Display:    http://player.initiative (or http://$IP_ADDRESS)"
    echo -e "  Server API:    http://$IP_ADDRESS:3000\n"

    echo -e "${BLUE}DNS Configuration:${NC}"
    echo -e "  To use domain names (dm.initiative, player.initiative),"
    echo -e "  configure your devices to use this Pi as their DNS server:"
    echo -e "  DNS Server: $IP_ADDRESS\n"

    if [[ "$SETUP_KIOSK" == "true" ]]; then
        echo -e "${BLUE}Kiosk Mode:${NC}"
        echo -e "  ✓ Configured to auto-boot to http://player.initiative"
        echo -e "  ✓ Chromium will launch in fullscreen kiosk mode"
        echo -e "  ✓ Screen blanking disabled"
        echo -e "  ✓ Mouse cursor will auto-hide\n"
        echo -e "${YELLOW}To activate kiosk mode:${NC}"
        echo -e "  Reboot this Pi: sudo reboot\n"
    fi

    echo -e "${BLUE}Service Management:${NC}"
    echo -e "  Start:   sudo systemctl start $SERVICE_NAME"
    echo -e "  Stop:    sudo systemctl stop $SERVICE_NAME"
    echo -e "  Restart: sudo systemctl restart $SERVICE_NAME"
    echo -e "  Status:  sudo systemctl status $SERVICE_NAME"
    echo -e "  Logs:    cd $INSTALL_DIR/infrastructure && docker compose logs -f\n"

    echo -e "${BLUE}Next Steps:${NC}"
    if [[ "$SETUP_KIOSK" == "true" ]]; then
        echo -e "  1. Reboot this Pi to activate kiosk mode: sudo reboot"
        echo -e "  2. Configure other client devices to use $IP_ADDRESS as DNS"
        echo -e "  3. Access the DM Console from another device at http://dm.initiative\n"
    else
        echo -e "  1. Configure client devices to use $IP_ADDRESS as DNS"
        echo -e "  2. Access the DM Console at http://dm.initiative"
        echo -e "  3. Access the Pi Display at http://player.initiative\n"
    fi

    echo -e "${YELLOW}Important Notes:${NC}"
    echo -e "  - Services will auto-start on boot"
    if [[ "$SETUP_KIOSK" == "true" ]]; then
        echo -e "  - Browser will auto-launch on boot in fullscreen mode"
        echo -e "  - To exit kiosk mode, press Alt+F4 or Ctrl+W"
    fi
    echo -e "  - If you changed the docker group, log out and back in"
    echo -e "  - Check documentation at $INSTALL_DIR/docs/\n"
}

# Main installation flow
main() {
    clear

    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           Initiative Tracker - Pi Installer               ║
║                                                           ║
║  This script will install and configure the complete     ║
║  Initiative Tracker system on your Raspberry Pi          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF

    echo ""
    read -p "Press Enter to begin installation or Ctrl+C to cancel..."

    # Run installation steps
    check_platform
    detect_network
    ask_kiosk_setup              # Ask early if this is a display Pi
    update_system
    install_docker
    install_git
    clone_repository
    configure_dns
    install_kiosk_packages       # Install browser/kiosk packages if needed
    start_services
    setup_systemd
    install_avahi
    configure_kiosk_mode         # Configure auto-boot to browser
    configure_local_dns          # Add hosts entries for local resolution
    show_completion_info

    echo -e "\n${GREEN}Done! 🎉${NC}\n"

    if [[ "$SETUP_KIOSK" == "true" ]]; then
        echo -e "${YELLOW}Kiosk mode will activate after reboot.${NC}"
        read -p "Reboot now? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Rebooting in 5 seconds... (Ctrl+C to cancel)"
            sleep 5
            sudo reboot
        fi
    fi
}

# Run main function
main "$@"
