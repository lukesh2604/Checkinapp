# Employee Check-in System - Django + Expo Mobile App

This project consists of a Django backend with REST APIs and an Expo React Native mobile application for employee check-in/check-out functionality.

## Features

### Backend (Django)
- Employee authentication with custom user model
- Location-based check-in/check-out with geofencing
- Admin dashboard for managing employees and locations
- REST API endpoints for mobile app
- Time-based check-in restrictions (15 minutes before shift)
- Check-in history and duration tracking

### Mobile App (Expo/React Native)
- Employee and Admin login
- Location-based check-in/check-out
- Real-time location tracking
- Check-in history
- Admin dashboard with statistics
- Cross-platform (iOS/Android)

## Setup Instructions

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run database migrations:
```bash
python manage.py migrate
```

3. Create a superuser (admin):
```bash
python manage.py createsuperuser
```

4. Start the Django development server:
```bash
python manage.py runserver 0.0.0.0:8000
```

### Mobile App Setup

1. Navigate to the mobile app directory:
```bash
cd mobile-app/CheckInApp
```

2. Install dependencies:
```bash
npm install
```

3. Update the API base URL in `src/services/apiService.js`:
   - Replace `192.168.1.100` with your computer's local IP address
   - You can find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

4. Start the Expo development server:
```bash
npx expo start
```

5. Use the Expo Go app on your phone to scan the QR code, or run on an emulator

## API Configuration

### Important: Update API URL
Before running the mobile app, you must update the `BASE_URL` in `mobile-app/CheckInApp/src/services/apiService.js`:

```javascript
const BASE_URL = 'http://YOUR_LOCAL_IP:8000'; // Replace with your IP
```

To find your local IP:
- **Windows**: Run `ipconfig` in Command Prompt
- **Mac/Linux**: Run `ifconfig` in Terminal
- Look for your network adapter's IPv4 address (usually starts with 192.168.x.x)

### CORS Configuration
The Django backend is configured to allow CORS requests from the mobile app. If you change the IP or port, update the `CORS_ALLOWED_ORIGINS` in `Checkinapp/settings.py`.

## Default Login Credentials

### Admin User
Create an admin user using:
```bash
python manage.py createsuperuser
```

### Employee User
You can create employee users through:
1. Django admin panel at `http://localhost:8000/django-admin/`
2. The web interface at `http://localhost:8000/admin/`
3. Or create them programmatically

## API Endpoints

### Authentication
- `POST /api/mobile/login/` - Login
- `POST /api/mobile/logout/` - Logout

### Employee Endpoints
- `GET /api/mobile/profile/` - Get user profile
- `GET /api/mobile/locations/` - Get active locations
- `GET /api/mobile/active-checkin/` - Get active check-in
- `GET /api/mobile/checkin-history/` - Get check-in history
- `POST /api/mobile/checkin/` - Check in to location
- `POST /api/mobile/checkout/` - Check out from location

### Admin Endpoints
- `GET /api/mobile/admin/dashboard-stats/` - Dashboard statistics
- `GET /api/mobile/admin/checkins/` - All check-in records
- `GET /api/mobile/admin/employees/` - All employees
- `GET /api/mobile/admin/locations/` - All locations

## Features Overview

### Employee Features
- **Location-based Check-in**: Employees can only check in when within the specified range of a location
- **Time Restrictions**: Check-in is only allowed 15 minutes before shift start time
- **Real-time Location**: Uses device GPS for accurate location tracking
- **History Tracking**: View personal check-in/check-out history with durations
- **Single Active Session**: Prevents multiple simultaneous check-ins

### Admin Features
- **Dashboard Statistics**: Overview of current check-ins, daily totals, employee and location counts
- **Real-time Monitoring**: View all active check-ins and employee locations
- **Employee Management**: View all employees and their details
- **Location Management**: View all locations with their settings
- **Check-in Records**: Complete history of all employee check-ins/check-outs

### Technical Features
- **Geofencing**: Automatic validation of employee location within specified radius
- **Token Authentication**: Secure API access with token-based authentication
- **Cross-platform**: Single codebase runs on both iOS and Android
- **Offline Handling**: Graceful error handling for network issues
- **Real-time Updates**: Pull-to-refresh functionality for live data

## Troubleshooting

### Common Issues

1. **Mobile app can't connect to backend**:
   - Ensure your phone and computer are on the same network
   - Update the IP address in `apiService.js`
   - Check that Django server is running on `0.0.0.0:8000`

2. **Location permission denied**:
   - Grant location permissions to the Expo Go app
   - Enable location services on your device

3. **CORS errors**:
   - Update `CORS_ALLOWED_ORIGINS` in Django settings
   - Ensure the mobile app URL matches the CORS configuration

4. **Database errors**:
   - Run `python manage.py migrate` to apply database changes
   - Check that SQLite database file has proper permissions

## Development Notes

- The Django backend serves both web interface and mobile APIs
- Mobile app uses Expo for easy development and testing
- Location tracking requires device permissions
- Admin features are only accessible to staff users
- All API endpoints require authentication except login

## Production Deployment

For production deployment:
1. Update Django settings for production (DEBUG=False, proper SECRET_KEY, etc.)
2. Use a production database (PostgreSQL recommended)
3. Configure proper CORS settings
4. Build the mobile app for app stores using `expo build`
5. Use HTTPS for API endpoints
6. Implement proper error logging and monitoring