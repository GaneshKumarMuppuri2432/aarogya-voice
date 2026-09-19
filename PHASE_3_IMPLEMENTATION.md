# Aarogya Voice — Phase 3 Implementation Report

## Phase 2 Quality Gate Passed
* **Microphone Permissions Handled**: `useSpeechToText` updated to elegantly catch `not-allowed` errors (when permissions are denied or when attempting to use the microphone over HTTP instead of HTTPS/localhost).
* **Clear Error States**: The recording UI now explicitly warns the doctor if the browser is unsupported or permission is denied, instructing them to use the manual text fallback so they are never "stuck."
* **API Version Bumped**: Automatically mitigated the `gemini-2.5-flash` deprecation error by upgrading the backend to use the correct model for processing.

---

## Phase 3 Features Implemented

### 1. Verified Treatment to Reminder Schedule
* **New Data Model**: Created the `Reminder` and `ReminderStatus` types in `src/types/index.ts`.
* **Reminder Generation**: `reminderService.ts` now automatically parses a `DOCTOR_VERIFIED` consultation.
* **Safety First**: It will *only* generate a reminder if the doctor explicitly approved the `timing` (e.g., "08:00 AM"). If it's missing, it is safely ignored, adhering to the rule: *We never convert uncertainty into a medical instruction.*

### 2. Patient Home & Today's Schedule
* **Route Rebuilt**: `src/app/patient/page.tsx` is now the primary voice-first companion screen.
* **Visual Hierarchy**: Features massive, highly readable typography.
* **Grouped Reminders**: Medicines are intelligently grouped by `scheduledTime`. If a patient has multiple medicines at "08:00 AM", they appear in a single block to reduce cognitive load.
* **Mark as Taken**: A clear, large "Mark as Taken" button allows the patient to update the status to `COMPLETED` (showing a clear visual `✓ TAKEN` state).

### 3. Voice Output & Active Alarms (The "Due" State)
* **Active Time Checking**: The patient app constantly checks the time. When the exact time matches a scheduled medicine block (e.g., 08:00 AM hits), it triggers an **Active Alarm Modal**.
* **System Notifications**: It uses the browser's `Notification` API to send a system push notification ("Aarogya Voice - Medicine Due!").
* **Massive Modal UI**: The alarm pops up over the entire screen, preventing the patient from missing it, and requires them to either click "Listen", "MARK ALL AS TAKEN", or explicitly close it.
* **New Abstraction**: `src/hooks/useVoiceOutput.ts` provides a robust wrapper around the browser's `window.speechSynthesis` API.
* **Combined Announcements**: When the patient taps "Listen" or "HEAR AGAIN", the system dynamically constructs a single, natural sentence containing all medicines for that specific time block (e.g., *"Your medicines are due for 08:00 AM. Take 1 tablet of Dolo 650 After food."*).
* **Language Support**: Extracts the patient's `preferredLanguage` (e.g., English, Tamil) and maps it to device-supported TTS voices (e.g., `ta-IN`).
* **Graceful Degradation**: If TTS is entirely unsupported by the browser, the "HEAR AGAIN" button gracefully falls back to a disabled "VOICE NOT SUPPORTED" state, while keeping the text fully readable.

### 4. Patient Phone Device Binding
* **Persistence**: Once the doctor hits `DOCTOR VERIFIED — SET REMINDERS`, the app stores the `arogya_patient_id` in `localStorage` and immediately transitions the phone into **Patient Mode**.
* **Offline Consideration**: Next.js service workers (`@serwist/next`) are configured to cache the UI. Firebase data relies on standard browser caching for the MVP. Full `IndexedDB` persistence was deferred to Phase 4 to avoid SSR hydration complexities.

---

## Known Limitations & Phase 4 Scope
1. **Background Alarms**: True background Push Notifications or Alarms that wake the device from sleep are strictly limited by iOS/Android browser policies without a native wrapper (like Capacitor/React Native). Currently, reminders are visible when the app is open. Phase 4 should introduce Push Notifications or Twilio Automated Voice Calls for guaranteed delivery.
2. **Offline Firebase Sync**: Full offline mutation syncing (Marking a medicine as taken while deep in a rural area with 0 connectivity) relies on basic caching. Phase 4 should explicitly initialize `enableMultiTabIndexedDbPersistence` for robust offline sync.
3. **Complex Timing**: The MVP groups medicines by exact string matches (e.g., "08:00 AM"). Phase 4 will require a more robust cron/date-parsing engine to handle relative terms like "Every 8 hours".

**Status:** Phase 3 Acceptance Criteria Met. Ready for final review.
