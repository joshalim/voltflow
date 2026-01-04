
# VoltFlow EV CMS - Ubuntu Installation Guide

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
cat influxdata-archive_compat.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg > /dev/null
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
The application includes a built-in proxy in `server.js` to handle InfluxDB traffic safely.
```bash
sudo npm install -g pm2
# Build the frontend first
npm run build
# Start the production server
pm2 start server.js --name "voltflow-cms"
pm2 save
pm2 startup
```

## 6. Networking & Proxy
The app is now configured to use a proxy at `/influx-proxy`.

**Why use the proxy?**
1. **No CORS errors**: The browser talks to port 3085, and the server handles the 8086 internal traffic.
2. **Security**: You do not need to open Port 8086 on your firewall to the public internet.
3. **Reliability**: The server uses `127.0.0.1` internally, avoiding external IP resolution issues.

### Verification
Test the proxy from the server:
```bash
curl -I http://127.0.0.1:3085/influx-proxy/health
```
*Expected: HTTP/1.1 200 OK (passed through from InfluxDB).*

## 7. Troubleshooting
If InfluxDB still shows "Disconnected":
1. Check if InfluxDB is running: `sudo systemctl status influxdb`
2. Check PM2 logs: `pm2 logs voltflow-cms`
3. Ensure the bucket `SMARTCHARGE` exists in the InfluxDB UI (`http://YOUR_SERVER_IP:8086`).
