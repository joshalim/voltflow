
# VoltFlow EV CMS - Ubuntu Installation Guide

This guide details the process for deploying the VoltFlow CMS on a local Ubuntu 22.04/24.04 server.

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
# We use 'preview' to serve the production build on port 3080
pm2 start npm --name "voltflow-cms" -- run preview -- --port 3080 --host 0.0.0.0
pm2 save
pm2 startup
```

## 6. Nginx Reverse Proxy
If Nginx is not forwarding, use this improved configuration:
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/voltflow
```

**Recommended Nginx Config:**
```nginx
server {
    listen 80;
    server_name _; # Responds to any IP or domain

    location / {
        proxy_pass http://127.0.0.1:3080; # Using IP instead of localhost
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/voltflow /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default # Remove default to avoid conflicts
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Connectivity Troubleshooting
If you still cannot access the page:

1. **Check if App is Listening**:
   `sudo ss -tulpn | grep 3080`
   (Should show `0.0.0.0:3080` or `*:3080`)

2. **Check Firewall**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 3080/tcp
   sudo ufw status
   ```

3. **Check Cloud/Provider Firewall**:
   If using AWS/Azure/GCP, ensure the **Security Group** or **Inbound Rules** allow Port 80 and 3080 from your source IP.

4. **Test Local Connection**:
   `curl -I http://127.0.0.1:3080`
   (Should return HTTP 200)

The CMS is now accessible at `http://YOUR_SERVER_IP`.
