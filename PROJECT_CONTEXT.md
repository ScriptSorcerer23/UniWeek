# UniWeek - Event Management App

## Overview
Mobile app for COMSATS University Student Week where 3 societies (ACM, CLS, CSS) organize technical/literary/sports events and students register/participate.

## User Roles
1. **Society Handlers** - Create/manage events, view registrations, send notifications, analyze data
2. **Students** - Browse events, register, rate events, view schedule, receive recommendations

---

## App Flow

### First Launch
```
Splash Screen → Role Selection → Login/Signup → Dashboard (Student or Society)
```

### Student Flow
```
Login → Student Dashboard (Bottom Tabs)
  ├─ Home Tab: Browse all events (filterable by society/date/category)
  ├─ My Events Tab: Registered events list
  ├─ Calendar Tab: Calendar view of registered events
  └─ Profile Tab: User info, notifications, logout

From Home → Tap Event Card → Event Details Screen
  → Tap Register → Confirmation Dialog → Registered ✓
  → Add to Calendar (optional)

From My Events → Tap Past Event → Feedback Screen
  → Rate 1-5 stars → Write feedback → Submit

Calendar Tab → View weekly/monthly registered events
  → Tap event → Event Details Screen
```

### Society Handler Flow
```
Login → Society Dashboard (Drawer Navigation)
  ├─ Dashboard: Overview stats, recent registrations
  ├─ My Events: List of created events
  ├─ Create Event: Form to add new event
  ├─ Analytics: Charts and reports
  ├─ Send Notification: Push notification to students
  └─ Profile: Settings, logout

From My Events → Tap Event → Event Registrations Screen
  → View list of registered students
  → Edit Event → Edit Event Screen
  → Delete Event → Confirmation → Delete

From Dashboard → Create Event → Fill Form → Submit
  → Event published to student feeds

From Analytics → View charts:
  - Registration trends
  - Event popularity
  - Participation rates
  - Feedback summary
```

---

## Core Features (Must Build)

### 1. Authentication & Authorization
- Email/password signup with email verification
- Login with session management
- Role selection (Student or Society Handler)
- Society handlers select society type (ACM/CLS/CSS) during signup
- Profile management

### 2. Society Handler Dashboard
- **Event Management:**
  - Create: title, description, date, time, venue, capacity, category, cover image
  - Edit/delete own events only
  - View registrations per event with student details
- **Notifications:**
  - Send push notifications to registered students
  - Compose custom messages
- **Analytics Dashboard:**
  - Total events created
  - Total registrations across events
  - Charts: registrations over time, event popularity, participation rates
  - AI-generated insights (most popular events, peak days)

### 3. Student Dashboard
- **Browse Events:**
  - Card-based list of all upcoming events
  - Society badge on each card (ACM/CLS/CSS)
  - Show: title, date, time, venue, capacity, registration status
- **Filter & Search (Mandatory):**
  - Filter by society (ACM/CLS/CSS)
  - Filter by date range
  - Filter by category (Technical/Literary/Sports)
  - Search by event name
  - AI suggestions based on past participation
- **Registration:**
  - One-click register with confirmation
  - Capacity check (no registration if full)
  - Instant feedback ("Registered Successfully")
- **My Events:**
  - List of registered events (upcoming & past)
  - Past events show "Rate Event" button
- **Calendar View:**
  - Weekly/monthly calendar of registered events
  - Sync with device calendar (optional)

### 4. Event Details Screen
- Full event information display
- Society badge and category tag
- Date, time, venue details
- Description
- Registration count / capacity
- Register button (or "Registered" if already registered)
- "Add to Calendar" button
- Share event option

### 5. Feedback & Ratings System (Mandatory)
- Students rate events after attendance (1-5 stars)
- Optional text feedback
- Society handlers view:
  - Average rating per event
  - All feedback comments
  - AI-generated sentiment analysis summary

### 6. Calendar/Reminder Integration (Mandatory)
- Weekly calendar view of registered events
- Push notifications:
  - 1 day before event
  - 2 hours before event
  - Custom notifications from society handlers
- Add events to device calendar

### 7. Analytics & Reports for Societies (Mandatory)
- **Charts:**
  - Registrations over time (line chart)
  - Event popularity (bar chart)
  - Participation rates per event
  - Society-wise comparison (ACM vs CLS vs CSS)
- **AI Insights:**
  - "Most popular events" report
  - "Peak participation days" analysis
  - Feedback trend summary

### 8. AI-Powered Features (Mandatory - Pick at least 1)
- **Event Recommendations for Students:**
  - Based on past registrations
  - Based on event category preferences
  - "Suggested for You" section on dashboard
- **Event Category Suggestions for Societies:**
  - AI suggests relevant categories based on title/description
- **Feedback Analysis:**
  - AI summarizes feedback sentiment
  - Highlights improvement areas

---

## Optional Features (Bonus Marks)

### 2. Leaderboards & Achievements
- Track top participants across ACM, CLS, CSS
- Award badges: "Top Coder", "Star Debater", "Sports Champion"
- Leaderboard screen showing rankings
- AI highlights participation trends

### 4. Group & Team Management
- Students form teams for coding/sports events
- Track team members and status
- AI suggests teams based on skills or past participation

### 8. Chat/Discussion Module
- Event-specific chat rooms
- Students discuss events, share tips, ask questions
- AI moderation or discussion summarization

### 9. Event Waitlist & Capacity Management
- Students join waitlist when event is full
- Auto-notify when spot opens
- AI predicts which events will fill up soon

---

## Database Schema (Supabase)

### Tables

#### **users**
```sql
id UUID PRIMARY KEY (auth.users.id)
email TEXT UNIQUE NOT NULL
name TEXT NOT NULL
role TEXT NOT NULL CHECK (role IN ('student', 'society'))
society_type TEXT CHECK (society_type IN ('ACM', 'CLS', 'CSS'))
avatar_url TEXT
created_at TIMESTAMP DEFAULT NOW()
```

#### **events**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title TEXT NOT NULL
description TEXT NOT NULL
date DATE NOT NULL
time TIME NOT NULL
venue TEXT NOT NULL
society TEXT NOT NULL CHECK (society IN ('ACM', 'CLS', 'CSS'))
category TEXT NOT NULL
capacity INTEGER NOT NULL
registered_count INTEGER DEFAULT 0
cover_image_url TEXT
created_by UUID REFERENCES users(id)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

#### **registrations**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
event_id UUID REFERENCES events(id) ON DELETE CASCADE
registered_at TIMESTAMP DEFAULT NOW()
attended BOOLEAN DEFAULT FALSE
rating INTEGER CHECK (rating >= 1 AND rating <= 5)
feedback TEXT
feedback_at TIMESTAMP
UNIQUE(user_id, event_id)
```

#### **notifications**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
event_id UUID REFERENCES events(id) ON DELETE CASCADE
title TEXT NOT NULL
message TEXT NOT NULL
sent_by UUID REFERENCES users(id)
sent_at TIMESTAMP DEFAULT NOW()
recipient_type TEXT CHECK (recipient_type IN ('all', 'registered'))
```

#### **user_preferences** (for AI recommendations)
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
preferred_categories TEXT[]
preferred_societies TEXT[]
updated_at TIMESTAMP DEFAULT NOW()
```

### Row Level Security (RLS) Policies
- Students can read all events, create registrations for themselves only
- Society handlers can CRUD events they created only
- Society handlers can read registrations for their events only
- All users can read their own profile, update their own data

---

## Tech Stack

- **Framework**: Expo React Native + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Authentication
- **Realtime**: Supabase Realtime for live updates
- **State Management**: Zustand
- **Navigation**: React Navigation (Stack + Bottom Tabs + Drawer)
- **UI Library**: React Native Paper
- **Charts**: react-native-chart-kit
- **Notifications**: expo-notifications
- **Calendar**: expo-calendar
- **AI Integration**: Claude API (Anthropic) for recommendations & insights
- **Environment Variables**: expo-constants + .env

---

## Screen-by-Screen Breakdown

### Auth Screens
1. **RoleSelectionScreen**: Choose Student or Society Handler
2. **LoginScreen**: Email/password login
3. **SignupScreen**: Email/password signup + role-specific fields

### Student Screens (Bottom Tabs)
1. **StudentDashboard** (Home Tab): Event cards grid with filters/search
2. **MyEventsScreen** (My Events Tab): List of registered events
3. **CalendarViewScreen** (Calendar Tab): Calendar with registered events
4. **ProfileScreen** (Profile Tab): User info, settings, logout
5. **EventDetailsScreen**: Full event info + register button
6. **FeedbackScreen**: Rate & review past events
7. **NotificationsScreen**: List of received notifications

### Society Screens (Drawer Nav)
1. **SocietyDashboard**: Overview stats + recent activity
2. **CreateEventScreen**: Form to create new event
3. **EditEventScreen**: Form to edit existing event
4. **EventRegistrationsScreen**: List of students registered for event
5. **SocietyAnalyticsScreen**: Charts + AI insights
6. **SendNotificationScreen**: Compose & send notifications
7. **ProfileScreen**: Settings, logout

---

## Development Priority Order

### Phase 1: Foundation (Days 1-2)
1. Expo + TypeScript setup
2. Supabase project setup + tables + RLS policies
3. Auth flow (signup/login/role selection)
4. Navigation structure (auth, student, society)
5. Zustand stores (auth, events)

### Phase 2: Core Features (Days 3-5)
6. Society: Create/Edit/Delete events
7. Student: Browse events (list view)
8. Event Details screen
9. Student: Register for events
10. Supabase realtime subscription for live updates

### Phase 3: Mandatory Features (Days 6-8)
11. Filter & Search (society/date/category)
12. My Events screen (registered events list)
13. Calendar view + expo-calendar integration
14. Push notifications setup (expo-notifications)
15. Feedback & Rating system
16. Event Registrations screen (society view)

### Phase 4: Analytics & AI (Days 9-10)
17. Analytics dashboard with charts
18. AI feature #1: Event recommendations for students
19. AI feature #2: Feedback sentiment analysis
20. AI insights for society analytics

### Phase 5: Polish & Bonus (Days 11-12)
21. UI/UX improvements + animations
22. Leaderboards module (bonus)
23. Waitlist feature (bonus)
24. Error handling + loading states
25. Testing on physical device

### Phase 6: Final (Day 13)
26. Bug fixes
27. Demo preparation
28. Ensure all mandatory features work
29. Prepare presentation

---

## Key Implementation Notes

### Supabase Setup
- Create project on Supabase dashboard
- Copy API URL + Anon Key to `.env`
- Run SQL schema in Supabase SQL Editor
- Set up RLS policies for security
- Enable Realtime on `events` and `registrations` tables

### Push Notifications
- Use Expo Notifications API
- Store Expo push tokens in `users` table
- Send notifications via Supabase Edge Functions or directly from app

### AI Integration
- Use Claude API for:
  - Analyzing past registrations → generate recommendations
  - Summarizing feedback text → sentiment analysis
  - Generating insights from analytics data
- Store AI preferences in `user_preferences` table

### Offline Support (Optional)
- Cache events locally using AsyncStorage
- Sync when online

### Performance
- Use FlatList for event lists (virtualization)
- Lazy load event images
- Pagination for large datasets

---

## Environment Variables (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CLAUDE_API_KEY=your_claude_api_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Design Guidelines

- **Color Scheme:**
  - ACM: Blue (#2196F3)
  - CLS: Green (#4CAF50)
  - CSS: Orange (#FF9800)
  - Primary: #6200EE (Purple)
  - Background: #F5F5F5 (Light Gray)

- **Typography:**
  - Headers: Bold, 20-24px
  - Body: Regular, 14-16px
  - Captions: 12px

- **Components:**
  - Event cards: Elevated with shadow
  - Buttons: Rounded, filled primary color
  - Society badges: Small chips with society colors
  - Charts: Use gradients for visual appeal

---

## Testing Checklist

- [ ] Auth: Signup, login, logout work
- [ ] Society can create/edit/delete events
- [ ] Student can browse and filter events
- [ ] Student can register for events (capacity check works)
- [ ] Notifications are sent and received
- [ ] Calendar integration works
- [ ] Feedback/rating system works
- [ ] Analytics charts display correctly
- [ ] AI recommendations appear
- [ ] App works on physical device
- [ ] All mandatory features functional

---

**READY TO BUILD! 🚀**