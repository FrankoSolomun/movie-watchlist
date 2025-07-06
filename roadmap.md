## 📜 PROJECT ROADMAP: *Movie Watchlist App*

---

### ✅ **Phase 1: Project Setup & Auth**
**Goal:** Establish foundation

1. Set up Next.js project (**done**)
2. Install dependencies:
   - TailwindCSS
   - `next-auth` (Google sign-in)
   - `dotenv`, `axios`, `zod` (optional)
3. Configure Google Sign-In via NextAuth
4. Protect routes (e.g. `/watchlist`) for logged-in users only
5. Add a basic layout: header + sign in/out button + page routing

---

### 🎮 **Phase 2: Movie Search & Add to Watchlist**
**Goal:** Search + personal list

1. Integrate TMDB API (API key, axios wrapper)
2. Create a `/search` page:
   - Movie title input
   - Show results with poster, title, release year
3. Add "Add to Watchlist" button per movie

---

### 🎜️ **Phase 3: Watchlist Page**
**Goal:** See saved movies

1. Create `/watchlist` route
2. Display all movies the user added (poster + title)
3. Add:
   - "Mark as Watched"
   - "Add Note" (modal or inline)
   - "Remove" button

---

### 🗓️ **Phase 4: Watch Calendar**
**Goal:** Unique feature — visual calendar

1. Add `/calendar` route
2. Use calendar library (e.g. `react-calendar` or `fullcalendar`)
3. Show watched movies on dates:
   - Save watched date on "Mark as Watched"
   - Clicking a date shows movies + notes

---

### 🛢️ **Phase 5: Backend / Database (Optional)**
**Goal:** Persistence

1. Use Prisma + SQLite/PostgreSQL or Firebase
2. Store:
   - User ID (Google)
   - Movie entries: ID, title, date watched, notes
3. Sync UI actions with database

---

### 🎨 **Phase 6: Polish & Styling**
**Goal:** Final touches

1. Add responsive Tailwind layout
2. Loading states, hover effects
3. Optional: dark mode

---

### 📄 **Phase 7: Documentation & Final Steps**
**Goal:** Final deliverables

1. Write documentation (25+ pages)
2. Screenshot all key features
3. Export DB schema or mock data
4. Push code to GitHub repo

---

### 🔁 Suggested Daily Flow

| Day | Tasks |
|-----|-------|
| **Day 1** | Setup project, auth, layout |
| **Day 2** | TMDB API, search, add to watchlist |
| **Day 3** | Calendar, watched tracking, notes |
| **Day 4** | Styling, polish, documentation |

