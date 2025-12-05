# 7agz - Football Booking App ⚽

A real-time football booking application for managing weekly matches. Anyone can create rooms to organize football games, and players can join using shareable codes.

## Features

- **Create Your Own Rooms** - Anyone can create booking rooms and become the room owner
- **Shareable Links & Codes** - Each room has a unique 6-character code for easy sharing
- **Real-time Updates** - Players see changes instantly as others join
- **Waiting List Management** - Automatic promotion when spots open up
- **Friend Adding** - Add yourself or friends (as guests)
- **Team Allocation** - Room owners can manually assign or randomly allocate teams
- **League Mode** - Full standings table with points, goals, and rankings
- **Rotational Mode** - Teams rotate composition between matches
- **Room Owner Controls** - Owners manage their rooms: teams, matches, and results

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Mobile**: React Native with Expo (planned)

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project

### Setup Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Get your web app credentials

### Installation

```bash
# Clone the repository
cd 7agz

# Install dependencies
cd web
npm install

# Configure Firebase
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev
```

### Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## Usage

### Creating a Room

1. Sign up or login
2. Go to "My Rooms"
3. Click "Create Room" and fill in:
   - Date and time
   - Description
   - Location (Google Maps link)
   - Number of accepted players
   - Number of teams and players per team
   - Play mode (League or Rotational)
4. Share the room code/link with your group

### As Room Owner

- Manage team allocation (manual or random)
- Enter match results (League mode)
- Remove players if needed
- Update room status

### Joining a Room

1. Get the room code from the owner
2. Enter the code or click the shared link
3. Add yourself or friends to the list
4. View your position (active or waiting)
5. See team assignments and match schedule

## Project Structure

```
7agz/
├── web/                        # React web app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AddPlayerForm   # Add player to list
│   │   │   ├── BookingList     # Active players list
│   │   │   ├── WaitingList     # Waiting players list
│   │   │   ├── TeamAllocation  # Team management
│   │   │   ├── LeagueTable     # Standings display
│   │   │   ├── MatchSchedule   # Match list
│   │   │   └── RotationalView  # Rotational mode display
│   │   ├── pages/              # Page components
│   │   │   ├── Login           # Authentication
│   │   │   ├── Dashboard       # Browse bookings
│   │   │   ├── BookingView     # Room detail view
│   │   │   └── AdminPanel      # My Rooms management
│   │   ├── services/           # Firebase services
│   │   ├── context/            # Auth context
│   │   └── types/              # TypeScript types
│   └── package.json
├── mobile/                     # React Native app (Expo)
│   ├── src/
│   │   ├── screens/            # App screens
│   │   ├── services/           # Firebase services
│   │   ├── context/            # Auth context
│   │   └── types/              # TypeScript types
│   └── package.json
├── firebase/
│   └── firestore.rules         # Security rules
└── README.md
```

## Running the Mobile App

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with Expo Go app on your phone.

## Key Features Explained

### Room Ownership
- Anyone can create rooms (booking lists)
- The creator becomes the room owner
- Owners can manage teams, enter results, and delete rooms

### Waiting List
- Infinite signup - no hard cap on signups
- Players beyond capacity go to waiting list
- Auto-promotion when spots open up

### Play Modes
- **League**: Full standings with points, goal difference, and rankings
- **Rotational**: Teams rotate composition between matches

## License

MIT

