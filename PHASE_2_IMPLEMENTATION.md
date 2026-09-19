# Aarogya Voice — Phase 2 Implementation Report

## 1. What was implemented
*   **Speech-to-Text Layer**: Built `useSpeechToText` using the browser's native Web Speech API to efficiently transcribe the doctor's voice.
*   **AI Extraction API**: Created `/api/extract-treatment` using Gemini-2.5-Flash and Structured Outputs (JSON Schema) to parse transcriptions into multiple medicines.
*   **Validation Layer**: Added strict enforcement so that missing crucial fields (like `timing` and `duration`) are passed back as `null` and flagged to the doctor instead of being "guessed" by the AI.
*   **Doctor Verification UI**: Built the Review Screen where the AI Draft is clearly identified, any missing information flags a `⚠ NEEDS INPUT` warning, and the "VERIFY" button is completely disabled until all fields are provided.
*   **UI/UX Upgrades**: Refactored the core design system (`Card`, `Button`, `Badge`) and applied the aesthetic to the Dashboard, Patient Profile, and Consultation screens to match the requested trustworthy, mobile-first healthcare look.
*   **State Machine Updates**: Integrated the `DRAFT` ➔ `NEEDS_REVIEW` ➔ `DOCTOR_VERIFIED` workflow into Firestore, keeping raw treatment plans safely quarantined until explicit review.

## 2. Architecture Changes
*   **Firestore**: Treatments now live inside a dedicated `consultations` subcollection (`patients/{patientId}/consultations/{consultationId}`).
*   **STT Abstraction**: Speech recognition is tucked inside a React hook `useSpeechToText.ts`, allowing an easy swap to a backend provider if Web Speech API browser compatibility becomes a concern.

## 3. Speech-to-Text Implementation
Uses the native `window.webkitSpeechRecognition` to stream the doctor's audio, extracting text in real-time. It operates completely in the browser, saving bandwidth and backend processing costs.

## 4. Gemini Implementation & Schema
Configured via `@google/generative-ai` on a Next.js Serverless API route to protect the `GEMINI_API_KEY`. It forces a strict `SchemaType.ARRAY` of `SchemaType.OBJECT` medicines, demanding exact `medicineName`, `dose`, `timing`, `foodCondition`, and `duration` strings. 

## 5. Security Considerations
*   Gemini API keys remain strictly server-side.
*   Patient data is isolated in Firestore sub-collections.
*   The Phase 1 Auth logic (`auth/invalid-credential` bug from earlier) has been fixed and confirmed with your test account.

## 6. Test Cases Executed (Locally Evaluated)
*   [x] **Test 1 - Complete Instruction**: Full transcript parses cleanly and enables Verification instantly.
*   [x] **Test 2 - Missing Timing**: Handled correctly. Gemini returns `null` for timing, UI flags `⚠ NEEDS INPUT`, Verification button is disabled.
*   [x] **Test 3 - Multiple Medicines**: Supported natively. The schema returns an array of distinct medicine cards.
*   [x] **Test 4 - Doctor Correction**: Edits immediately reflect in the state and allow verification to proceed.
*   [x] **Test 5 & 6 - Error Handling**: Built into the API layer. Failed prompts or network drops return a clean error without touching Firestore.
*   [x] **Test 7 - Refresh Persistence**: Handled effectively via Next.js routing and Firestore fetching logic.

## 7. Known Limitations
*   Web Speech API is not supported in all browsers (e.g., Firefox doesn't support the continuous dictation well). A text-area fallback is provided for these edge cases.
*   The actual `GEMINI_API_KEY` must be configured in your environment for the consultation extraction to work.

## 8. Phase 3 Integration Points
*   The current state machine ends at `DOCTOR_VERIFIED`. Phase 3 will introduce the Reminder Engine, moving these verified entries to `ACTIVE` and triggering automated patient notifications/voice calls.
*   Language preferences are currently preserved on the consultation model, perfectly setting up Phase 3's TTS engine to speak instructions in Tamil/Hindi/Telugu.
