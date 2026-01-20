# Mobile App - Backend Integration Guide

## Overview
The mobile app has been updated to fetch data from the real backend API instead of mock JSON files.

## Changes Made

### 1. Added HTTP Package
- Added `http: ^1.2.0` to `pubspec.yaml` for making API requests

### 2. Created API Configuration
- New file: `lib/config/api_config.dart`
- Contains base URL and endpoint definitions
- **Important**: Update the `baseUrl` based on your device:
  - **Android Emulator**: `http://10.0.2.2:4000` (default)
  - **iOS Simulator**: `http://localhost:4000`
  - **Physical Device**: `http://YOUR_COMPUTER_IP:4000`

### 3. Updated DataService
- `lib/data_service.dart` now fetches data from the API
- Methods:
  - `loadTickets()` - Fetches all tickets
  - `loadTicketById(id)` - Fetches a single ticket with details
  - `loadCustomers()` - Fetches all customers
  - `loadCustomerById(id)` - Fetches a single customer
  - `createTicket(data)` - Creates a new ticket
  - `updateTicket(id, updates)` - Updates an existing ticket

### 4. Updated Models
- Added `Ticket.fromApiJson()` for list response parsing
- Added `Ticket.fromApiDetailJson()` for detail response parsing
- Handles the backend API response format

### 5. Updated Pages
- `lib/pages/home.dart` - No longer requires jsonPath
- `lib/pages/ticket_detail.dart` - No longer requires jsonPath

## How to Run

### 1. Start the Backend Server
```bash
cd backend
npm start
```
The server should be running on port 4000.

### 2. Update API URL (if needed)
Edit `lib/config/api_config.dart`:

For **physical device**, find your computer's IP address:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

Then update:
```dart
static const String baseUrl = 'http://YOUR_IP:4000';
```

### 3. Run the Mobile App
```bash
cd mobile_app
flutter run
```

## Testing the Integration

### 1. Check Backend is Running
Test the API endpoint:
```bash
curl http://localhost:4000/tickets
```

### 2. Check Mobile App Logs
When the app loads, you should see:
- Network requests in the console
- Tickets loaded from the database
- Any errors will be printed with "Error loading..." prefix

### 3. Common Issues

#### Connection Refused
- **Cause**: Backend server not running or wrong URL
- **Fix**: Ensure backend is running on port 4000, check API URL in config

#### Empty List
- **Cause**: Database has no tickets
- **Fix**: Run database seed or create tickets via API

#### 404 Errors
- **Cause**: Endpoint not found
- **Fix**: Check backend routes and API URL

## Backend API Endpoints

### Tickets
- `GET /tickets` - List all tickets
- `GET /tickets/:id` - Get ticket details
- `POST /tickets` - Create new ticket
- `PUT /tickets/:id` - Update ticket
- `DELETE /tickets/:id` - Delete ticket

### Customers
- `GET /customers` - List all customers
- `GET /customers/:id` - Get customer details

### Service Types
- `GET /service-type` - List all service types

## Next Steps

1. Add error handling UI (show error messages to users)
2. Add loading indicators
3. Implement pull-to-refresh
4. Add authentication (JWT tokens)
5. Add offline support with local caching
6. Implement create/update ticket functionality in UI
