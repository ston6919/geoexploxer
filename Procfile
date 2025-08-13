# Procfile for DigitalOcean App Platform
# This tells DigitalOcean how to run your services

# Backend service
web: cd backend && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT

# Frontend service (will be handled by DigitalOcean as separate service)
# The frontend will be detected from package.json
