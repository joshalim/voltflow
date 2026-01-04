
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
Verify installation:
```bash
node -v && npm -v
```

## 3. Install InfluxDB v2
InfluxDB v2 is required for time-series telemetry storage.
```bash
# Download GPG key
wget -q https://repos.influxdata.com/influxdata-archive_compat.key
echo '393e877294000125463f3f352291970e1b2b4043f7941fa51199c07212497f66 influxdata-archive_compat.key' | sha256sum -c && cat influxdata-archive_compat.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg > /dev/null

# Add repository
echo 'deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg] https://repos.influxdata.com/debian stable main' | sudo tee /etc/apt/sources.list.d/influxdata.list

# Install and Start
sudo apt-get update && sudo apt-get install influxdb2 -y
sudo systemctl enable --now influxdb
```
*Note: After installation, visit `http://YOUR_SERVER_IP:8086` to perform the initial setup and obtain your **Token**, **Org**, and **Bucket**.*

## 4. Application Deployment
Clone your repository and install dependencies.
```bash
git clone https://github.com/your-repo/voltflow.git
cd voltflow
npm install
```

### Configuration
Create an environment file to store your Gemini API Key.
```bash
nano .env
```
Add your key:
```env
API_KEY=your_gemini_api_key_here
```

### Build for Production
```bash
npm run build
```

## 5. Process Management (PM2)
Use PM2 to keep the application running in the background.
```bash
sudo npm install -g pm2
pm2 start npm --name "voltflow-cms" -- run preview -- --port 5000 --host
pm2 save
pm2 startup
```

## 6. Nginx Reverse Proxy (Optional but Recommended)
Install Nginx to serve the app over standard HTTP/HTTPS ports.
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/voltflow
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name voltflow.local;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/voltflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Firewall Configuration
Ensure ports 80 (Nginx) and 8086 (InfluxDB) are open if you are accessing from the network.
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8086/tcp
sudo ufw enable
```

The CMS is now accessible at `http://YOUR_SERVER_IP`.
