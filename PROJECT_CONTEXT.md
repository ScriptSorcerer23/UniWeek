# UniWeek - Event Management App

## Overview
Mobile app for university Student Week where 3 societies (ACM, CLS, CSS) organize events and students register/participate.

## User Roles
1. **Society Handlers** - Create/manage events, view registrations, send notifications
2. **Students** - Browse events, register, rate events, view schedule

## Core Features

### Authentication
- Email/password login & signup
- Role selection during signup (Student or Society)
- Society handlers select their society (ACM/CLS/CSS)

### Society Dashboard
- Create event: title, description, date, time, venue, capacity, category
- Edit/delete own events
- View registrations list per event
- Send push notifications to registered students
- View analytics (charts for registrations, popular events)

### Student Dashboard
- Browse all events (list with cards)
- Filter by society (ACM/CLS/CSS), date, category
- Search events by name
- One-click registration with confirmation
- View "My Events" (registered events)
- Calendar view of registered events
- Rate & review events after attendance

### Event Details
- Full event info display
- Register button (changes to "Registered" after registration)
- Show registration count / capacity
- Society badge (ACM/CLS/CSS)
- Add to device calendar option

### Notifications
- Push notifications for upcoming events (1 day before)
- Society can send custom notifications to registered students

### Analytics (Society View)
- Registration trends chart
- Most popular events
- Participation rates
- Feedback summary with ratings

### AI Feature (Choose One)
- Event recommendations for students based on past registrations
- Auto-suggest event categories for society handlers
- Feedback sentiment analysis

## Database Schema

### Users Collection
```
{
  id, email, name, role: 'student'|'society',
  societyType?: 'ACM'|'CLS'|'CSS',
  registeredEvents: [eventIds]
}
```

### Events Collection
```
{
  id, title, description, date, time, venue,
  society: 'ACM'|'CLS'|'CSS',
  category: string,
  capacity: number,
  registeredStudents: [userIds],
  createdBy: userId
}
```

### Registrations Collection
```
{
  id, userId, eventId, timestamp,
  attended: boolean,
  rating?: number (1-5),
  feedback?: string
}
```

## Tech Stack
- **Framework**: Expo React Native + TypeScript
- **Database**: supabase Firestore
- **Auth**: supabase Authentication
- **State**: React Context API
- **Navigation**: React Navigation
- **UI**: React Native Paper
- **Charts**: react-native-chart-kit
- **Notifications**: expo-notifications
- **Calendar**: expo-calendar
- **AI**: Claude API for recommendations

## Key Flows

### Society: Create Event
1. Navigate to "Create Event"
2. Fill form (all fields required)
3. Submit → Save to Firestore
4. Show in student feeds immediately

### Student: Register for Event
1. Browse events → Tap event card
2. View details → Tap "Register"
3. Confirm → Save to Registrations collection
4. Add to user's registeredEvents array
5. Receive confirmation + calendar reminder

### Student: Rate Event (Post-Event)
1. View "My Events" → Past events show "Rate"
2. Tap → Rate 1-5 stars + optional text feedback
3. Save to Registration document
4. Update event analytics

## Priority Order
1. Auth + supabase setup
2. Event CRUD (Society)
3. Event browsing + Registration (Student)
4. Filtering & Search
5. Notifications setup
6. Feedback/Rating system
7. Calendar integration
8. Analytics charts
9. AI recommendations
10. Polish UI

## Design Notes
- Use primary colors: Blue (ACM), Green (CLS), Orange (CSS) for society badges
- Bottom tabs for main navigation
- Stack navigation for detail screens
- Loading states for all async operations
- Error handling with user-friendly messages