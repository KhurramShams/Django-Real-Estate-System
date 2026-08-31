# MY HOUSE — Complete VPS & Vercel Production Deployment Guide

This guide details how to deploy the **My House Real Estate Management System** with:
- **Backend API on Linux VPS** (Ubuntu 22.04 / 24.04 with Gunicorn + Systemd + Nginx + WhiteNoise + Certbot SSL)
- **Database**: [Aiven Cloud](https://aiven.io) (Managed PostgreSQL 18)
- **Media Storage**: [Supabase Storage](https://supabase.com) (S3 Object Storage)
- **Frontend on Vercel**: [Vercel](https://vercel.com) (Next.js 16 + React 19)

---

## Part 1: VPS Server Setup & Backend Deployment

### Step 1: Initial Server Preparation (Ubuntu/Debian)
SSH into your VPS server:
```bash
ssh ubuntu@your_vps_ip
```

Update packages and install Python, pip, virtualenv, Nginx, and Git:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx git certbot python3-certbot-nginx
```

---

### Step 2: Clone the Project & Set Up Virtual Environment
```bash
# Navigate to home directory and clone
cd ~
git clone <your-github-repo-url> RealState
cd RealState/backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install all dependencies (Django, DRF, Gunicorn, WhiteNoise, Psycopg2, etc.)
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 3: Configure Environment Variables on VPS
Create `.env` inside `~/RealState/backend/.env`:
```bash
nano ~/RealState/backend/.env
```

Paste your production environment variables (adjust domain/IP as needed):
```env
# Django Settings Module
DJANGO_SETTINGS_MODULE=config.settings.production

# Security & Hosts (Add your VPS IP and custom domain)
SECRET_KEY=generate-a-strong-random-50-character-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your_vps_ip,api.yourdomain.com

# Database Connection (Aiven PostgreSQL)
DATABASE_URL=postgres://avnadmin:AVNS_WEDUV55KWveKclRo4ir@pg-21fe518f-shamsshaikh-2127.a.aivencloud.com:14675/defaultdb?sslmode=require

# Supabase Storage Integration
SUPABASE_URL=https://cdyfjnexgqufivaixpqi.storage.supabase.co/storage/v1/s3
SUPABASE_KEY=56293195d2fdd3d63b2c1ea97a084977
SUPABASE_BUCKET_NAME=real-estate-media

# CORS Settings (Allow your deployed Vercel frontend URL)
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
CORS_ALLOW_ALL_ORIGINS=False

# CSRF Trusted Origins (Crucial for Django 5 behind Nginx)
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app,https://api.yourdomain.com,http://your_vps_ip

# JWT Lifetime Settings
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

Save with `CTRL + O`, `ENTER`, and exit with `CTRL + X`.

---

### Step 4: Run Initial Migrations & Collect Static Files
```bash
# Ensure virtualenv is active
source venv/bin/activate

# Apply migrations directly to Aiven PostgreSQL
python manage.py migrate

# Collect static assets into staticfiles directory
python manage.py collectstatic --no-input

# Create your initial admin superuser
python manage.py createsuperuser
```

---

### Step 5: Configure Systemd Service for Gunicorn
Copy the prepared `myhouse.service` file to systemd:
```bash
# If your VPS username is different from 'ubuntu', edit User= and paths in myhouse.service first
sudo cp ~/RealState/backend/myhouse.service /etc/systemd/system/myhouse.service

# Reload systemd, enable service to start on boot, and start it
sudo systemctl daemon-reload
sudo systemctl enable myhouse
sudo systemctl start myhouse

# Check status (should show active/running)
sudo systemctl status myhouse
```

---

### Step 6: Configure Nginx as Reverse Proxy
Copy the prepared Nginx config to `/etc/nginx/sites-available/`:
```bash
sudo cp ~/RealState/backend/myhouse-nginx.conf /etc/nginx/sites-available/myhouse

# Edit the server_name with your actual domain or VPS IP
sudo nano /etc/nginx/sites-available/myhouse
```

Enable the site and restart Nginx:
```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/myhouse /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### Step 7: Free SSL Certificate with Let's Encrypt (Certbot)
If you have a domain pointing to your VPS IP (e.g. `api.yourdomain.com`):
```bash
sudo certbot --nginx -d api.yourdomain.com
```
Certbot will automatically install SSL and configure HTTPS redirection in Nginx!

---

### Step 8: Configure Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Part 2: Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com) and click **Add New...** → **Project**.
2. Select your repository.
3. Configure settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     ```env
     NEXT_PUBLIC_API_URL=https://api.yourdomain.com
     ```
     *(Or `http://your_vps_ip` if not using a domain yet)*
4. Click **Deploy**.

---

## Part 3: Ongoing VPS Updates (One-Command Deploy)

Whenever you push updates to GitHub, update your VPS in seconds:
```bash
cd ~/RealState/backend
bash deploy.sh
```
This script automatically pulls latest changes, runs migrations on Aiven PostgreSQL, collects static files, and restarts Gunicorn with zero downtime.

---

## Part 4: Production Verification Checklist

- [ ] `http://your_vps_ip/api/v1/dashboard/summary/` or `https://api.yourdomain.com/api/v1/dashboard/summary/` returns `401 Unauthorized` (confirming DRF is actively serving).
- [ ] Vercel frontend loads at `https://your-app.vercel.app/login`.
- [ ] Log in with your admin credentials.
- [ ] Verify Dashboard, Properties, Clients, Deals, and Payments load live data from Aiven Cloud PostgreSQL.
