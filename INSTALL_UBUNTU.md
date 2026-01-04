
# VoltFlow EV CMS - Ubuntu Installation Guide (Caddy Server)

This guide details the process for deploying the VoltFlow CMS on a local or cloud Ubuntu server using **Caddy** as the reverse proxy.

## 1. System Preparation
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install Node.js & Dependencies
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 3. Install InfluxDB v2
```bash
wget -q https://repos.influxdata.com/influxdata-archive_compat.key
echo '393e877294000125463f3f352291970e1b2b4043f7941fa51199c07212497f66 influxdata-archive_compat.key' | sha256sum -c && cat influxdata-archive_compat.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg > /dev/null
echo 'deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg] https://repos.influxdata.com/debian stable main' | sudo tee /etc/apt/sources.list.d/influxdata.list
sudo apt-get update && sudo apt-get install influxdb2 -y
sudo systemctl enable --now influxdb
```

## 4. Application Deployment
```bash
git clone https://github.com/your-repo/voltflow.git
cd voltflow
npm install
npm run build
```

## 5. Process Management (PM2)
Ensure the application binds to **0.0.0.0** so it can be reached by the reverse proxy.
```bash
sudo npm install -g pm2
# Serve the production build on port 3085
pm2 start npm --name "voltflow-cms" -- run preview
pm2 save
pm2 startup
```

## 6. Caddy Reverse Proxy
Caddy will handle Port 80 traffic and forward it to the app on 3085.

### Install Caddy
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-ring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y
```

### Configure Caddyfile
```bash
sudo nano /etc/caddy/Caddyfile
```

**Content:**
```caddy
:80 {
    reverse_proxy 127.0.0.1:3085
    
    # Enable compression for faster loading
    encode zstd gzip
    
    log {
        output file /var/log/caddy/access.log
    }
}
```

Restart and check status:
```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

## 7. Critical Connectivity Troubleshooting

If you still cannot see the page:

### Step A: Verify the App is actually listening on 3085
```bash
sudo ss -tulpn | grep 3085
```
**Expected Output:** `LISTEN 0 4096 0.0.0.0:3085` (If it says `127.0.0.1:3085`, external access and some proxy configs will fail).

### Step B: Test locally (on the server)
```bash
curl -I http://127.0.0.1:3085
```
If this returns `HTTP/1.1 200 OK`, the app is running fine.

### Step C: Check Firewall (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3085/tcp
sudo ufw reload
sudo ufw status
```

### Step D: Cloud Provider Security Groups
If you are on **AWS, Azure, or DigitalOcean**, you MUST go to their web dashboard and allow **Inbound Traffic** for Port 80 and Port 3085. Local `ufw` rules are often overridden by these external firewalls.

### Step E: Caddy Logs
If you get a "502 Bad Gateway", check Caddy logs to see why it can't talk to the app:
```bash
sudo journalctl -u caddy --no-pager | tail -n 20
```

The CMS should now be visible at `http://YOUR_SERVER_IP`.
