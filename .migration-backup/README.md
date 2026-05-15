# Quran Recitation & Learning Application

A comprehensive web application for Quran recitation practice, memorization, and learning with authentic audio and interactive features.

## Features

### 🎵 Audio Recitation
- Authentic Quran recitation by Sheikh Alafasy
- Verse-by-verse audio playback with customizable pause intervals
- Multiple reciter support with fallback options
- Audio controls: play, pause, next, previous, repeat

### 📖 Text Display
- Arabic text with proper Islamic typography (Amiri Quran font)
- English translations alongside Arabic verses
- Clean, readable interface with Islamic theming

### 🔖 Enhanced Bookmarking System
- Star rating system (1-5 stars) for verses
- Custom tags for organizing favorite verses
- Personal notes for each bookmarked ayah
- Two view modes: Simple List and Enhanced Collection
- Advanced search and filtering capabilities

### 🔍 Verse Search
- Intelligent search with keyword highlighting
- Search across Arabic text and English translations
- Relevance scoring for search results
- Direct play functionality from search results

### 📊 Session Tracking
- Listening history with session statistics
- Progress tracking for memorization goals
- Time spent and verses completed metrics

### 🎨 User Experience
- Responsive design for all devices
- Islamic green color scheme with modern UI
- Keyboard shortcuts and accessibility features
- Smooth animations and transitions

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** components
- **Wouter** for routing
- **TanStack Query** for data management
- **Framer Motion** for animations

### Backend
- **Express.js** server
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Session management** with secure authentication

### Audio Sources
- EveryAyah CDN for reliable audio delivery
- Al-Quran Cloud API integration
- Multiple fallback sources for reliability

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/quran-recitation-app.git
cd quran-recitation-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Configure your database URL
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### Basic Recitation Practice
1. Select a Surah from the dropdown menu
2. Choose the range of verses you want to practice
3. Adjust pause duration between verses
4. Click play to start the recitation session

### Bookmarking Verses
1. Click the bookmark icon next to any verse
2. Add ratings, tags, and personal notes
3. Access your bookmarks from the Bookmarks page
4. Use the Collection View for advanced organization

### Search Functionality
1. Use the search feature to find specific verses
2. Search by keywords in Arabic or English
3. Click on search results to play directly

## API Endpoints

### Quran Data
- `GET /api/surahs` - Get all Surahs
- `GET /api/surahs/:id/ayahs` - Get verses for a specific Surah

### Bookmarks
- `GET /api/bookmarks` - Get user bookmarks
- `POST /api/bookmarks` - Create new bookmark
- `PUT /api/bookmarks/:id` - Update bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark

### User Preferences
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update preferences

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and profiles
- `bookmarked_ayahs` - User bookmarks with ratings and tags
- `user_preferences` - User settings and preferences
- `recitation_sessions` - Session tracking data

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Quran text and translations from authentic Islamic sources
- Audio recitation by Sheikh Mishary Al-Afasy
- EveryAyah.com for reliable audio hosting
- Islamic typography using Amiri Quran font

## Support

For issues, questions, or contributions, please open an issue on GitHub or contact the maintainers.

---

*May Allah accept this work and make it beneficial for the Muslim community. Ameen.*