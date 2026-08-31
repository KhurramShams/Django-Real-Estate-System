import multiprocessing

# Gunicorn configuration for VPS deployment
bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
timeout = 120
keepalive = 5

# Logging
accesslog = "/var/log/myhouse/gunicorn-access.log"
errorlog = "/var/log/myhouse/gunicorn-error.log"
loglevel = "info"
capture_output = True
