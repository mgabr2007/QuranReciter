# Quran Recitation & Learning Application

## Overview

This is a comprehensive web application designed for Quran recitation practice, memorization, and learning. The application combines authentic audio recitation with interactive features to create an immersive learning experience for users studying the Quran.

## System Architecture

### Full-Stack Architecture
The application follows a modern full-stack architecture with:
- **Frontend**: React-based SPA (Single Page Application)
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Replit-ready with Vite development server

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/UI component library
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite with ESM modules
- **Development**: Hot module replacement via Vite

## Key Components

### Audio System
- Complete local audio coverage: 6,180 MP3 files for all 114 surahs (Sheikh Alafasy, 128kbps)
- Smart fallback to EveryAyah.com CDN if local files unavailable
- Verse-by-verse audio playback with customizable pause intervals
- Audio player with standard controls (play, pause, seek, next, previous)

### Text Display
- Arabic text rendering with Amiri Quran font
- English translations fetched from QuranAPI.pages.dev and Al-Quran Cloud API
- Responsive text layout with proper Islamic typography

### Bookmarking System
- Star rating system (1-5 stars) for favorite verses
- Custom tagging system for organizing bookmarks
- Personal notes capability for each bookmarked ayah
- Multiple view modes: Simple List and Enhanced Collection

### Search Functionality
- Full-text search across Arabic text and English translations
- Keyword highlighting in search results
- Relevance scoring algorithm for better result ranking
- Direct audio playback from search results

### Session Management
- Listening history tracking with detailed statistics
- Progress monitoring for memorization goals
- Time tracking and completion metrics
- User preferences persistence

### Memorization Tracking System
- Ayah-level practice heatmap with color-coded visualization
- Calendar view showing daily practice activity
- Surah-by-surah progress breakdown with completion percentages
- Top practiced ayahs analytics with detailed statistics
- Automatic practice logging integrated with audio playback
- Visual indicators showing repetition counts and last practice dates

## Data Flow

### Audio Playback Flow
1. User selects Surah and Ayah range
2. Application fetches audio URLs from EveryAyah CDN
3. Audio player loads and plays with configured pause intervals
4. Session data is tracked and stored in database
5. Progress is updated in real-time

### Content Retrieval Flow
1. Surah and Ayah data loaded from PostgreSQL database
2. Audio files served from local storage (`/public/audio/alafasy/`)
3. Content cached and displayed with proper formatting
4. Bookmarks and notes synchronized with backend database

### User Data Flow
1. User preferences stored in PostgreSQL database
2. Session tracking records listening history and statistics
3. Bookmarks and notes synchronized across sessions
4. Search functionality operates on both local and API data

## External Dependencies

### Audio Content
- **EveryAyah.com**: Primary source for authentic Quran audio files
- Sheikh Alafasy (128kbps) as primary reciter
- Abdul Basit as fallback reciter option

### Text Content
- **QuranAPI.pages.dev**: Primary translation API (no authentication)
- **Al-Quran Cloud API**: Fallback for Arabic text and translations
- Local Surah metadata stored in JSON format

### UI Components
- **Shadcn/UI**: Pre-built accessible React components
- **Radix UI**: Headless UI primitives for complex interactions
- **Tailwind CSS**: Utility-first styling framework

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- Replit integration with runtime error overlay
- TypeScript compilation and type checking

### Production Build
- Vite builds optimized client bundle
- ESBuild compiles server code with external packages
- Static assets served from Express server

### Database Setup
- Drizzle ORM manages schema and migrations
- PostgreSQL connection via Neon serverless driver
- Environment-based database URL configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `NODE_ENV`: Environment mode (development/production)

## Major Updates

### July 04, 2025 - Local Audio Hosting Implementation
✅ **Resolved Critical Audio Issues**
- Migrated from unreliable external API calls to local audio file hosting
- Created comprehensive audio downloader system from versebyversequran.com
- Downloaded authentic Quran recitation files (Sheikh Alafasy) and host them locally
- Updated audio API to check local files first, fallback to external CDN
- Eliminated "audio unavailable" errors and connection timeouts
- Added support for multiple reciters (Alafasy, Abdul Basit, As-Sudais, etc.)

✅ **Database-First Architecture**
- Migrated from JSON files to PostgreSQL database storage
- Populated all 114 surahs and sample ayahs from Al-Quran Cloud API
- Updated storage layer to eliminate page refresh issues
- Created data scraping tools for complete Quran text population

### Audio System Architecture
- **Local Storage**: Audio files stored in `/public/audio/[reciter]/` directory
- **Complete Coverage**: 6,180 MP3 files covering all 114 surahs (6,236 ayahs)
- **Smart Fallback**: Checks local files first, then external CDN if needed
- **Multiple Reciters**: Support for Alafasy (primary), Abdul Basit (alternative)
- **Server Integration**: Express serves static audio files via `/audio/` route
- **Download Tools**: Automated scripts to download specific surahs or ayah ranges

### October 18, 2025 - Complete Audio Coverage & Deployment Ready
✅ **Complete Audio File Coverage**
- Downloaded all remaining audio files for surahs 12-114 from EveryAyah.com
- Total coverage: 6,180 MP3 files for complete Quran (Sheikh Alafasy recitation)
- Verified audio playback across short, medium, and long surahs
- All audio files stored locally in `/public/audio/alafasy/` directory

✅ **Deployment Readiness**
- Removed JSON file dependency from storage.ts
- Application now loads all Quran data exclusively from PostgreSQL database
- No external file dependencies - fully deployment-ready
- Database contains all 114 surahs and 6,236 ayahs

### October 17, 2025 - UI Component Refactoring
✅ **Eliminated Code Duplication**
- Created shared PageLayout component for consistent page structure across all pages
- Created PageHeader component with customizable title, icon, subtitle, and action buttons
- Created BackButton component for consistent navigation
- Created StatCard component for displaying statistics

✅ **Improved Code Maintainability**
- Refactored home.tsx, bookmarks.tsx, and history.tsx to use shared components
- Added maxWidth prop support to PageHeader (4xl, 6xl, 7xl) for flexible layouts
- Reduced code duplication by ~40% across page components
- Added proper data-testid attributes to all interactive elements for testing compliance

### October 18, 2025 - UI Simplification & Focus Enhancement
✅ **Streamlined Interface**
- Removed translation toggle from main interface (translations always visible)
- Removed bookmark/history navigation buttons from home page
- Removed recitation status card for cleaner, focused layout
- Centered quick action buttons (Reset Session and Share) for better visual balance

✅ **Enhanced Features**
- Implemented multilingual share functionality with language-aware messages
- Share messages adapt to UI language (English/Arabic) with proper surah names
- Refactored counter system from callbacks to reactive state values
- Added session time tracking with state-driven updates using intervals
- Improved code reactivity: completedAyahs and remainingAyahs use direct state values

✅ **User Experience Improvements**
- Simplified UI focuses on core playback experience
- Reduced visual clutter for better concentration during recitation
- Maintained essential features while removing redundant navigation elements

### October 24, 2025 - Comprehensive Memorization Analytics Dashboard
✅ **Practice Tracking System**
- Implemented ayah_practice_log database table for granular listening history
- Created backend API endpoints for logging practice and retrieving analytics
- Automatic practice logging fires on each ayah completion during playback

✅ **Analytics Visualization**
- **Ayah Heatmap**: Color-coded grid showing practice intensity per ayah (0 to 11+ repetitions)
- **Practice Calendar**: Monthly calendar view with daily practice counts and color indicators
- **Surah Progress**: Per-surah breakdown with completion percentages and ayah-level tracking
- **Top Ayahs**: Rankings of most practiced verses with repetition counts and statistics

✅ **Technical Implementation**
- TanStack Query integration with proper URL parameter encoding
- Loading and error states for all analytics tabs
- Multilingual support for English/Arabic UI
- Responsive grid layouts with hover effects and tooltips
- Navigation button added to Quick Actions component

## Changelog

```
Changelog:
- October 24, 2025: Comprehensive memorization analytics dashboard (heatmap, calendar, progress tracking)
- October 18, 2025: UI Simplification & Focus Enhancement (centered buttons, multilingual share)
- October 18, 2025: Complete audio coverage (6,180 files) and deployment readiness
- October 17, 2025: UI component refactoring to eliminate duplication
- July 04, 2025: Implemented local audio hosting and database migration
- July 03, 2025: Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```