
# VoltFlow EV CMS - Ubuntu Installation Guide (Caddy Server)

This guide details the process for deploying the VoltFlow CMS on a local Ubuntu server using **Caddy** as the reverse proxy.

## 1. System Preparation
Update your package repository and upgrade existing packages.
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install Node.js
We recommend Node.js v20.x for stability.
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
```bash
sudo npm install -g pm2
# We use 'preview' to serve the production build on port 3085
pm2 start npm --name "voltflow-cms" -- run preview -- --port 3085 --host 0.0.0.0
pm2 save
pm2 startup
```

## 6. Install Caddy Server
Caddy provides automatic HTTPS and a much simpler configuration than Nginx.

### Add Caddy Repository
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y
```

### Configure Caddy
Edit the Caddyfile:
```bash
sudo nano /etc/caddy/Caddyfile
```

**Replace the content with the following:**
```caddy
# Replace :80 with your domain (e.g., ev.yourdomain.com) for auto-HTTPS
:80 {
    reverse_proxy 127.0.0.1:3085
    
    # Optional: Log requests
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
If you cannot access the page:

1. **Check if App is Listening on 3085**:
   `sudo ss -tulpn | grep 3085`

2. **Check Caddy Status**:
   `sudo systemctl status caddy`

3. **Check Firewall**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 3085/tcp
   sudo ufw status
   ```

4. **Verify Local App Access**:
   `curl -I http://127.0.0.1:3085`

The CMS is now accessible at `http://YOUR_SERVER_IP` (forwarded via Caddy).
