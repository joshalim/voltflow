
# VoltFlow EV CMS - Ubuntu Enterprise Installation

## 1. System Preparation
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create Database and User
sudo -u postgres psql -c "CREATE DATABASE voltflow;"
sudo -u postgres psql -c "CREATE USER voltadmin WITH PASSWORD 'vlt_pass_2025';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE voltflow TO voltadmin;"
```

## 3. Install Node.js & Node-Postgres
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 4. Deploy Application
```bash
git clone https://github.com/your-repo/voltflow.git
cd voltflow

# Install pg driver explicitly for backend
npm install pg
npm run build
```

## 5. Process Management
```bash
sudo npm install -g pm2
pm2 start server.js --name "voltflow-cms"
pm2 save
pm2 startup
```

## 6. Accessing the UI
1. Open `http://YOUR_SERVER_IP:3085`


## 7. Security (Optional)
Install Caddy for SSL:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```
Edit `/etc/caddy/Caddyfile`:
```
yourdomain.com {
    reverse_proxy localhost:3085
}
```
