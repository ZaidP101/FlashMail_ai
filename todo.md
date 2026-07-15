# FlashMail.ai - Supabase Integration & Auth

## ✅ Backend (Complete — Phase 1)

- [x] Add `spring-boot-starter-data-jpa` + `postgresql` to `pom.xml`
- [x] Configure `application.properties` with Supabase datasource + JPA
- [x] Remove `DataSourceAutoConfiguration` exclusion from main class
- [x] Create `Entity/Users.java` (JPA entity for `users` table)
- [x] Create `Entity/Formats.java` (JPA entity for `formats` table with JSONB support)
- [x] Create `Repository/UsersRepository.java` (`findByEmail`)
- [x] Create `Repository/FormatsRepository.java` (`findByUserId`)
- [x] Create DTOs: `SignUpRequest`, `LoginRequest`, `AuthResponse`
- [x] Create `Service/SupabaseAuthService.java` (signup, signin, getUser via Supabase Auth REST API)
- [x] Create `Controller/AuthController.java` (POST /auth/signup, POST /auth/login, GET /auth/profile)
- [x] Create `Config/AppConfig.java` (WebClient bean)
- [x] Update `.env` with Supabase project keys

## 📋 Frontend (Future — Phase 2)

- [ ] Add `react-router-dom` for routing
- [ ] Create `AuthContext` or `AuthProvider` to manage JWT state
- [ ] Create `LoginPage.jsx` — email + password login form
- [ ] Create `SignUpPage.jsx` — name + email + password signup form
- [ ] Create `ProfilePage.jsx` — show user info + saved formats
- [ ] Create `ProtectedRoute.jsx` — redirect to login if no JWT
- [ ] Update `App.jsx` to send JWT in `Authorization` header
- [ ] Add "Save Format" / "Load Format" UI for tone presets
- [ ] Add logout functionality
- [ ] Handle token refresh on 401 responses
