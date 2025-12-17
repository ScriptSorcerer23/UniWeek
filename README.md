# UniWeek - University Event Management App

A comprehensive mobile application for university Student Week where societies (ACM, CLS, CSS) can create and manage events, and students can browse, register, and provide feedback.

## 🚀 Features

### For Students
- Browse all university events with cover images
- Filter by society (ACM/CLS/CSS), date, and category
- Search events by name
- One-click registration with capacity management
- View registered events ("My Events")
- Rate and review events after attendance
- Push notifications for upcoming events

### For Society Handlers
- Create, edit, and delete events with image uploads
- Upload event cover images from gallery or camera
- View event registrations and analytics
- Send custom notifications to registered students
- Track participation rates and feedback
- View charts for registration trends

## 🛠 Tech Stack

- **Framework**: Expo React Native + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for event images)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Navigation**: React Navigation v6
- **UI Components**: React Native Paper
- **Charts**: react-native-chart-kit
- **Notifications**: expo-notifications
- **Image Picker**: expo-image-picker
- **Calendar**: expo-calendar

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier available)

## 🔧 Installation

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings > API**
3. Copy your **Project URL** and **anon/public key**
4. Navigate to `src/services/`
5. Copy `supabase-config.example.ts` to `supabase-config.ts`
6. Fill in your Supabase credentials:

```typescript
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 3. Database & Storage Setup

The database and storage bucket are already configured in your Supabase project:
- `users` table (student and society profiles)
- `events` table (all event information with cover_image_url)
- `registrations` table (event registrations with ratings)
- `notifications` table (custom notifications with recipient_ids)
- `event-images` storage bucket (5MB limit, JPEG/PNG/WebP)
- Row Level Security policies for all tables and storage

### 4. Install Additional Dependencies

If using a physical device, install the Expo Go app:
- [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🚀 Running the App

### Development Mode

```bash
npm start
```

This will open Expo DevTools. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan QR code with Expo Go app on your phone

### Platform-Specific

```bash
# Android
npm run android

# iOS  
npm run ios
```

## 📁 Project Structure

```
uniweek/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components (Button, Card, Input)
│   │   ├── events/          # Event-specific components
│   │   └── analytics/       # Chart and analytics components
│   ├── context/
│   │   ├── AuthContext.tsx  # Authentication state management
│   │   └── EventContext.tsx # Event state management
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Root navigator
│   │   ├── AuthNavigator.tsx     # Login/Signup flow
│   │   ├── StudentNavigator.tsx  # Student tab navigation
│   │   └── SocietyNavigator.tsx  # Society tab navigation
│   ├── screens/
│   │   ├── auth/            # Login and Signup screens
│   │   ├── student/         # Student-specific screens
│   │   ├── society/         # Society-specific screens
│   │   └── shared/          # Shared screens (Profile, Feedback)
│   ├── services/
│   │   ├── supabase.ts      # Supabase client setup
│   │   ├── auth.ts          # Authentication services
│   │   ├── events.ts        # Event CRUD operations
│   │   ├── storage.ts       # Image upload/delete operations
│   │   ├── notifications.ts # Push notification handling
│   │   └── ai.ts            # AI recommendations
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   └── utils/
│       ├── constants.ts     # App constants and theme
│       └── helpers.ts       # Utility functions
├── App.tsx                  # App entry point
├── package.json
└── README.md
```

## 🔐 Authentication Flow

1. **Signup**: Users create an account selecting role (Student/Society)
   - Society users also select their society (ACM/CLS/CSS)
2. **Login**: Email/password authentication via Supabase Auth
3. **Navigation**: Users are routed to appropriate dashboard based on role

## 💾 Database Schema

### Users
```sql
id, email, name, role (student|society), 
society_type (ACM|CLS|CSS), registered_events[], created_at
```

### Events
```sql
id, title, description, date, time, venue, society,
category, capacity, cover_image_url, registered_students[], 
created_by, created_at, updated_at
```

### Registrations
```sql
id, user_id, event_id, timestamp, attended, 
rating (1-5), feedback
```

### Notifications
```sql
id, title, body, event_id, recipient_ids[], 
sent_by, sent_at
```

## 📸 Image Upload Features

### Storage Service
The app includes a comprehensive storage service (`src/services/storage.ts`) that handles:
- **Permission requests** for camera and media library
- **Image picking** from device gallery (16:9 aspect ratio, 80% quality)
- **Photo capture** using device camera
- **Upload to Supabase** storage bucket with automatic compression
- **Image deletion** when events are updated or deleted
- **URL extraction** from storage paths

### Event Service Integration
The events service (`src/services/events.ts`) provides helper methods:
- `pickAndUploadEventImage(eventId)` - Pick from gallery and upload
- `takeAndUploadEventPhoto(eventId)` - Take photo and upload
- Automatic cleanup of old images when updating events
- Automatic deletion of images when events are deleted

### Usage Example
```typescript
// In your event creation form
const handleImageUpload = async (eventId: string) => {
  try {
    const imageUrl = await eventService.pickAndUploadEventImage(eventId);
    if (imageUrl) {
      // Update event with imageUrl
      await eventService.updateEvent(eventId, { coverImageUrl: imageUrl }, userId);
    }
  } catch (error) {
    console.error('Failed to upload image:', error);
  }
};
```

## 🎨 Design System

- **Society Colors**:
  - ACM: Blue (#2196F3)
  - CLS: Green (#4CAF50)
  - CSS: Orange (#FF9800)

- **Theme**: Material Design principles with React Native Paper

## 📱 Key Screens

### Student Flow
1. **Browse Events** - Filter and search all events with cover images
2. **Event Details** - View full event info, images, and register
3. **My Events** - View registered events
4. **Feedback** - Rate and review attended events

### Society Flow
1. **My Events** - View and manage created events
2. **Create/Edit Event** - Event management forms with image upload
3. **Event Analytics** - Registration stats and feedback
4. **Send Notifications** - Notify registered students

## 🔔 Notifications

- Automatic reminders 24 hours before registered events
- Custom notifications from societies to registered students
- Push notification permissions requested on first launch

## 🤖 AI Features

The app includes basic AI-powered features:
- **Event Recommendations**: Suggests events based on past registrations
- **Category Auto-Suggest**: Suggests categories based on event title/description
- **Sentiment Analysis**: Analyzes feedback for positive/negative sentiment

## 🐛 Troubleshooting

### Supabase Connection Issues
- Verify your `supabase-config.ts` has correct credentials
- Check that Row Level Security policies are properly set up
- Ensure database tables and storage bucket were created successfully

### Image Upload Issues
- Ensure camera/media permissions are granted on device
- Check that images are under 5MB
- Verify storage bucket `event-images` exists in Supabase

### React Native Issues
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

### TypeScript Errors
- Run `npm install` to ensure all type definitions are installed
- Check `tsconfig.json` is properly configured

## 📄 License

This project is created for educational purposes as part of a university mobile app dev competition.

## 👥 Team

Developed for University Student Week Event Management

---

## 📝 Next Steps

1. Install dependencies: `npm install`
2. Set up Supabase project and configure `supabase-config.ts`
3. Database and storage are already configured!
4. Start development server: `npm start`
5. Test with Expo Go on your device or emulator

For questions or issues, refer to:
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
