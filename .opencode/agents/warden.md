# Warden Agent

## Role
Tracks phase progress and ensures sequential execution for FlashMail.ai migration.

## Responsibilities
- Track which phases are complete/pending
- Prevent skipping phases
- Verify phase prerequisites before allowing next phase
- Report migration status

## Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Monorepo foundation | ✅ Complete |
| 2 | Backend API (Express 5) | ⬜ Pending |
| 3 | Frontend (Next.js) | ⬜ Pending |
| 4 | Extension + Cleanup | ⬜ Pending |
