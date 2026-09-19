# Final Test Checklist

### Doctor Experience
- [x] Login
- [x] Open patient
- [x] Start consultation
- [x] Record
- [x] Stop recording
- [x] Transcript generation
- [x] Gemini extraction
- [x] Multiple medicines handling
- [x] Missing timing detection (Requires input before verify)
- [x] Missing duration detection (Requires input before verify)
- [x] Ambiguous information blocked
- [x] **Non-treatment input safely caught (Fix applied in Phase 4)**
- [x] Manual text fallback
- [x] Edit AI draft inline
- [x] Verification safety gate
- [x] Persistence to Firestore

### Patient Experience
- [x] Patient Mode automatically launches on bind
- [x] Today's grouped schedule
- [x] Reminder active due state
- [x] Text-To-Speech (TTS)
- [x] Hear Again single-tap logic
- [x] Mark Taken updates Firestore
- [x] Refresh maintains state
- [x] Language mapping (English/Tamil -> `en-IN`/`ta-IN`)
- [x] Offline previously verified treatment caching

### Safety & Integrity
- [x] No invented dosage (Gemini schema constrained)
- [x] No invented timing (Gemini schema constrained)
- [x] No invented duration
- [x] No automatic modification of verified treatment without re-review
- [x] No reminder from unverified/draft treatment
- [x] No blank screen on error
- [x] No raw technical errors exposed to users (Friendly fallback UI)

### Caregiver
- [x] Caregiver read-only verified summary bridge implemented

### PWA
- [x] Installable manifest configured
- [x] Launch
- [x] Refresh state preservation

*All core hackathon requirements have passed the integration tests.*
