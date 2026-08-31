#!/usr/bin/env bash
# My House - VPS Quick Deploy & Update Script
set -e

echo "=== [1/5] Pulling latest code ==="
git pull origin main

echo "=== [2/5] Installing dependencies in virtual environment ==="
source venv/bin/activate
pip install -r requirements.txt

echo "=== [3/5] Applying Database Migrations (Aiven PostgreSQL) ==="
python manage.py migrate --no-input

echo "=== [4/5] Collecting Static Assets (WhiteNoise) ==="
python manage.py collectstatic --no-input

echo "=== [5/5] Restarting Gunicorn Service ==="
sudo systemctl restart myhouse

echo "=== Deployment to VPS successfully completed! ==="
sudo systemctl status myhouse --no-pager
