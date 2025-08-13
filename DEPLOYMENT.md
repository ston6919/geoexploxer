# 🚀 Deployment Guide - DigitalOcean App Platform

This guide will walk you through deploying your Django + Next.js application to DigitalOcean App Platform.

## 📋 Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **DigitalOcean Account** - Sign up at [digitalocean.com](https://digitalocean.com)
3. **Domain Name** (optional) - For custom URLs

## 🔄 Step 1: Push to GitHub

```bash
# Add your GitHub remote (replace with your username)
git remote add origin https://github.com/YOUR_USERNAME/geoexplorer.git

# Push to GitHub
git push -u origin main
```

## 🌊 Step 2: Deploy to DigitalOcean

### Option A: DigitalOcean App Platform (Recommended)

1. **Go to DigitalOcean Console**
   - Navigate to [cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Click "Create" → "Apps"

2. **Connect GitHub Repository**
   - Click "Link Your GitHub Account"
   - Select your `geoexplorer` repository
   - Choose the `main` branch

3. **Configure Backend Service**
   - **Name**: `backend`
   - **Source Directory**: `/backend`
   - **Environment**: `Python`
   - **Build Command**: Leave empty (auto-detected)
   - **Run Command**: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`

4. **Configure Frontend Service**
   - **Name**: `frontend`
   - **Source Directory**: `/frontend`
   - **Environment**: `Node.js`
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`

5. **Add Database**
   - Click "Add Resource" → "Database"
   - Choose "PostgreSQL"
   - Select plan (Basic is fine for testing)

6. **Environment Variables**
   - **Backend**:
     - `DEBUG`: `False`
     - `DJANGO_SETTINGS_MODULE`: `core.settings_production`
   - **Frontend**:
     - `NEXT_PUBLIC_API_URL`: `${backend.URL}`

7. **Deploy**
   - Click "Create Resources"
   - Wait for deployment (5-10 minutes)

### Option B: Manual Droplet Deployment

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - Basic plan ($6/month)
   - Add SSH key

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nginx postgresql postgresql-contrib
   ```

3. **Deploy Application**
   ```bash
   git clone https://github.com/YOUR_USERNAME/geoexplorer.git
   cd geoexplorer
   # Follow Docker deployment
   docker-compose up -d
   ```

## 🔧 Configuration

### Environment Variables

**Backend (Django)**:
```bash
DEBUG=False
DJANGO_SETTINGS_MODULE=core.settings_production
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-secret-key
```

**Frontend (Next.js)**:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Custom Domain

1. **Add Domain in DigitalOcean**
   - Go to Networking → Domains
   - Add your domain

2. **Update DNS Records**
   - Point to your app's IP address

3. **Configure SSL**
   - DigitalOcean handles this automatically

## 📊 Monitoring & Scaling

### Basic Monitoring
- **CPU Usage**: Monitor in DigitalOcean dashboard
- **Memory**: Watch for memory leaks
- **Logs**: View in App Platform logs

### Scaling
- **Vertical**: Increase instance size
- **Horizontal**: Add more instances
- **Auto-scaling**: Configure based on CPU/memory

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in DigitalOcean
   - Verify all dependencies in requirements.txt

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check database is running

3. **CORS Errors**
   - Update CORS_ALLOWED_ORIGINS in settings
   - Verify frontend URL is correct

### Debug Mode

For debugging, temporarily set:
```bash
DEBUG=True
DJANGO_SETTINGS_MODULE=core.settings
```

## 💰 Cost Estimation

**Basic Deployment**:
- **App Platform**: $12/month (2 services × $6)
- **Database**: $7/month (Basic PostgreSQL)
- **Total**: ~$19/month

**Production Ready**:
- **App Platform**: $24/month (2 services × $12)
- **Database**: $15/month (Standard PostgreSQL)
- **Total**: ~$39/month

## 🔒 Security Checklist

- [ ] DEBUG=False in production
- [ ] Strong SECRET_KEY
- [ ] HTTPS enabled
- [ ] Database credentials secure
- [ ] CORS properly configured
- [ ] Environment variables set

## 📞 Support

- **DigitalOcean Docs**: [docs.digitalocean.com](https://docs.digitalocean.com)
- **Community**: [digitalocean.com/community](https://digitalocean.com/community)
- **Support Tickets**: Available in DigitalOcean console

---

**Happy Deploying! 🎉**
