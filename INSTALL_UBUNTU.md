
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
We now use a dedicated `server.js` for stability.
```bash
sudo npm install -g pm2
# Ensure you ran npm run build first!
pm2 start server.js --name "voltflow-cms"
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
    
    # Enable compression
    encode zstd gzip
    
    log {
        output file /var/log/caddy/access.log
    }
}
```

Restart Caddy:
```bash
sudo systemctl restart caddy
```

## 7. Connectivity Troubleshooting

### Step A: Verify PM2 Status
```bash
pm2 status
pm2 logs voltflow-cms
```
*If status is 'errored', check the logs to see if port 3085 is already in use.*

### Step B: Verify Local Connection
```bash
curl -I http://127.0.0.1:3085/health
```
*Expected: HTTP/1.1 200 OK. If this fails, the Node.js server is not running.*

### Step C: Verify Network Binding
```bash
sudo ss -tulpn | grep 3085
```
*It must show `0.0.0.0:3085` or `*:3085`.*

### Step D: Firewall Rules
```bash
sudo ufw allow 80/tcp
sudo ufw allow 3085/tcp
sudo ufw status
```
