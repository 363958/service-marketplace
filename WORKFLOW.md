# Service Marketplace — Workflow & Project Layout

This repo follows the end-to-end flow from the project specification.

## Platform

| Layer | Stack |
|-------|--------|
| Mobile | React Native (Expo Router) — customer & provider in one app |
| API | Django REST + JWT |
| Admin | Django Admin (KYC approval, users, services) |

## Backend apps (`backend/`)

| Spec folder | Django app | Purpose |
|-------------|------------|---------|
| `accounts/` | `users/` | Register, OTP, login |
| `kyc/` | `kyc/` | Provider profile, KYC submit |
| `services/` | `marketplace/` | Service catalog |
| `portfolio/` | `portfolio/` | Provider portfolio items |
| `bookings/` | `bookings/` | Booking lifecycle |
| `chat/` | `chats/` | Chat rooms & messages |
| `notifications/` | `notifications/` | In-app / event notifications |
| `reviews/` | `reviews/` | Post-service reviews |
| `analytics/` | `analytics/` | Admin summary stats |
| `maps/` | `maps/` | Map search (placeholder) |
| `media/` | `media_app/` | Uploaded files |

### Main API paths

- `POST /users/send-otp/` → `POST /users/verify-otp-register/` → `POST /users/login/`
- `POST /providers/profile/` — provider setup
- `POST /kyc/submit/` — KYC submission
- `GET/POST /services/` — services
- `GET/POST /bookings/` — bookings
- `GET /analytics/summary/` — admin metrics

## Frontend layout (`frontend/src/`)

```
src/
  screens/          # UI by role (auth, customer, provider, shared)
  navigation/       # routes.ts, workflow.ts (post-login routing)
  services/api/     # axios client + API modules
  components/       # Navbar, shared UI
  auth/             # session helpers
  utils/            # AsyncStorage keys
  theme/            # colors
app/                # expo-router thin re-exports → screens
```

## Customer flow

1. **Register** + email OTP → **Login**
2. **Choose services** (`/choose-services`)
3. **Dashboard** (`/home`) → Search → Book → Chat → Review

## Provider flow

1. **Register** + OTP → **Login**
2. **Provider setup** (`/provider-onboarding`) → `POST /providers/profile/`
3. **KYC** (`/provider-kyc`) → `POST /kyc/submit/`
4. **Admin approval** (Django Admin → approve KYC)
5. **Dashboard** (`/provider-home`) → Create service / portfolio / availability

## Booking flow (backend ready, UI placeholder)

Pending → Provider accept/reject → Chat → Service → Completion → Review

## Run locally

```bash
# Backend
cd backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8001

# Frontend
cd frontend
npx expo start
```

Update `frontend/src/services/api/client.ts` `baseURL` to your machine IP.
