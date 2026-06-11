# ☕ Coffee Shop System - Quick Start Guide

## 🚀 Start the System

### Step 1: Run the startup script
**Double-click**: `docker-start.bat`

Wait for the containers to build and start (first time may take 2-5 minutes).

### Step 2: Check system status
**Double-click**: `check-system.bat`

You should see:
- ✅ Backend running on http://localhost:3000
- ✅ Frontend running on http://localhost

### Step 3: Access the system
Open your browser and go to: **http://localhost**

---

## 🔐 Default Login Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system control

### Employee Accounts
- **Username**: `emp001` - `emp005`
- **Password**: `password123`
- **Access**: Clock in/out, view shifts

---

## 📋 Quick Test Checklist

After starting the system:

1. **Open browser**: http://localhost
2. **Login as admin**: admin / admin123
3. **Check dashboard**: Should see statistics
4. **Create schedule**: Click "Schedule Management" → "Generate Schedule"
5. **Test clock-in**: Logout, login as emp001, click "Clock In"

---

## 🛠️ Management Scripts

| Script | Purpose |
|--------|---------|
| `docker-start.bat` | Start all services |
| `docker-stop.bat` | Stop all services |
| `check-system.bat` | Check system status |
| `docker-status.bat` | View container status |
| `docker-logs.bat` | View logs |

---

## ❓ Troubleshooting

### Containers not starting?
```cmd
docker-stop.bat
docker-start.bat
```

### Port already in use?
```cmd
# Check what's using the port
netstat -ano | findstr :80
netstat -ano | findstr :3000

# Stop the process or restart computer
```

### Database issues?
Delete `backend/database/coffee-shop.db` and restart - it will be recreated.

### Still having problems?
Check logs:
```cmd
docker-logs.bat
```

---

## 📚 Full Documentation

- **README.md** - Complete system overview
- **DOCKER_INSTALLATION.md** - Docker setup guide
- **PROJECT_COMPLETION_REPORT.md** - Feature list and tech details

---

## 🎯 Next Steps

After successful startup:

1. **Change default passwords** (especially admin!)
2. **Add your employees** via Admin Dashboard
3. **Set employee availability** for each staff member
4. **Generate schedules** using auto-schedule feature
5. **Export payroll** data to Excel/CSV

---

## 💡 Tips

- First startup takes longer (downloading images, building)
- Keep Docker Desktop running in background
- Use Chrome/Edge/Firefox for best experience
- Data persists in SQLite database (survives restarts)

---

**Need help?** Check the full README.md or PROJECT_COMPLETION_REPORT.md
