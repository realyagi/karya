# KARYA — Voice-First AI Agent (Phase 2 / B1)

> *"Don't navigate software. Just speak."*

KARYA is a futuristic, voice-first AI agent designed to let users speak naturally to achieve real work: understanding requests, selecting tools, performing actions, verifying results, and replying with voice.

---

## Phase 2: Real AssemblyAI Voice Agent Connection

Phase 2 connects KARYA end-to-end to the **official AssemblyAI Voice Agent API**:

1. **Secure Token Minting**:
   - Server-side route `GET /api/voice/token` requests temporary, one-time-use tokens from AssemblyAI (`https://agents.assemblyai.com/v1/token?expires_in_seconds=600`).
   - The permanent API key `ASSEMBLYAI_API_KEY` remains strictly on the server in `.env.local` and is **never** bundled or exposed to the browser.
2. **Real-time Bidirectional WebSocket**:
   - Browser connects directly to `wss://agents.assemblyai.com/v1/ws?token=<TEMPORARY_TOKEN>`.
   - Sends `session.update` with KARYA's concise, conversational system prompt and a supported AssemblyAI voice configuration (`alba` by default).
3. **24 kHz Audio Capture & Playback**:
   - `AudioStreamManager` captures browser microphone audio, converts Float32 to 24 kHz mono 16-bit PCM (`input.audio`), and computes real-time volume levels for the Voice Orb equalizer.
   - `AudioStreamPlayer` decodes base64 24 kHz mono PCM16 chunks (`reply.audio`) and schedules gapless, low-latency playback via Web Audio API. Supports instant interruption (barge-in).
4. **Live Conversation & Telemetry**:
   - Real user transcripts (`transcript.user`) and agent responses (`transcript.agent`) stream into the `ConversationPanel`.
   - Real-time lifecycle events (`voice_received`, `transcription_complete`, `intent_understood`, `response_ready`) populate the `LiveActivityPanel`.

## B1: Voice Settings

The Settings control opens the current voice settings interface. It lists only voices
documented as supported by the AssemblyAI Voice Agent API, stores the selected voice
in browser local storage, and applies it to the next new voice session. AssemblyAI
binds a voice when a session starts, so changing the setting does not alter an active
conversation. Standalone voice previews are not exposed by the temporary-token
WebSocket architecture, so the preview control remains explicitly unavailable rather
than generating fake audio.

---

## Environment Configuration

Create a `.env.local` file in the project root:

```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

A template `.env.example` is provided:
```env
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

---

## Directory Structure

```
karya/
├── .env.local                   # Server secrets (ignored by git)
├── .env.example                 # Template for environment configuration
├── app/
│   ├── api/
│   │   └── voice/
│   │       └── token/
│   │           └── route.ts     # Secure server-side temporary token generator
│   ├── globals.css              # Dark theme, glassmorphism, & glow styles
│   ├── layout.tsx               # Root layout & KARYA metadata
│   └── page.tsx                 # Main workspace layout (responsive 3-panel & mobile)
├── components/
│   ├── layout/
│   │   └── Navbar.tsx           # Futuristic top navigation & mobile menu
│   ├── voice/
│   │   ├── VoiceOrb.tsx         # Central animated voice orb reacting to speech & playback
│   │   ├── AudioControls.tsx    # Session trigger button with active pulse rings
│   │   ├── QuickActions.tsx     # Suggested query pills
│   │   └── VoiceWorkspace.tsx   # Orchestrates AssemblyAI client, audio capture & player
│   ├── conversation/
│   │   ├── ConversationPanel.tsx # Conversation container with live stream
│   │   └── MessageItem.tsx      # Reusable message bubble component
│   └── activity/
│       ├── LiveActivityPanel.tsx # Live activity telemetry panel
│       └── ActivityEventItem.tsx # Reusable event telemetry component
├── lib/
│   ├── utils.ts                 # Classname merge helper
│   ├── voice/
│   │   ├── audio-recorder.ts    # Web Audio API 24 kHz PCM16 mic capture & visualizer
│   │   ├── audio-player.ts      # Web Audio API 24 kHz PCM16 player with interruption
│   │   └── assemblyai-client.ts # AssemblyAI Realtime Voice Agent WebSocket client
│   ├── agent/
│   │   └── index.ts             # Orchestrator & decision contracts
│   └── tools/
│       └── index.ts             # Extensible tool registry definitions
└── types/
    └── karya.ts                 # Strongly typed core models
```

---

## Getting Started

### 1. Recommended Workspace
Open this folder in your editor/IDE:
```
C:\Users\goatn\.gemini\antigravity\scratch\karya
```

### Browser extension hydration warnings

KARYA does not add `bis_skin_checked`, `_processed`, or `bis_register` attributes.
If those attributes appear in a hydration warning, they were injected by a browser
extension. Verify the page in a clean/incognito browser profile before investigating
KARYA rendering. The application keeps normal document scrolling enabled; only the
conversation and live activity panels use internal scrolling.

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Using KARYA
1. Click the central microphone button.
2. Grant microphone permissions in your browser.
3. Once the Voice Orb transitions to **Ready / Listening**, speak naturally (e.g. *"Hello KARYA, what can you do?"*).
4. Watch the Conversation panel populate with your transcript and KARYA's response, listen to KARYA's voice, and monitor the Live Activity telemetry feed!
