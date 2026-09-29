/**
 * AssemblyAI Realtime Voice Agent API Client
 * Connects securely to wss://agents.assemblyai.com/v1/ws using a temporary token
 * generated server-side. Handles bidirectional audio streaming, real-time events,
 * and comprehensive development logging for tracing event flows.
 */

export type ConnectionState =
  | 'disconnected'
  | 'fetching_token'
  | 'connecting'
  | 'connected'
  | 'ready'
  | 'error';

export interface AssemblyAIEventHandlers {
  onConnectionChange?: (state: ConnectionState) => void;
  onSessionReady?: (sessionId?: string) => void;
  onUserSpeechStarted?: () => void;
  onUserSpeechStopped?: () => void;
  onUserTranscriptDelta?: (text: string, itemId?: string) => void;
  onUserTranscript?: (text: string, itemId?: string) => void;
  onAgentStarted?: (replyId?: string) => void;
  onAgentTranscript?: (text: string, replyId?: string, interrupted?: boolean) => void;
  onAgentAudioChunk?: (base64Audio: string) => void;
  onAgentReplyDone?: (status: 'completed' | 'interrupted') => void;
  onError?: (error: Error) => void;
  onSessionEnded?: () => void;
}

export interface AssemblyAIVoiceClientOptions {
  tokenEndpoint?: string;
  systemPrompt?: string;
  voice?: string;
}

const DEFAULT_SYSTEM_PROMPT =
  "You are KARYA, a futuristic voice-first AI agent. Your tagline is: 'Don't navigate software. Just speak.' Help users manage tasks, notes, calendar events, search web research, check weather, view GitHub repositories, query system information, control their desktop and browser, and recall memories. Be concise, direct, helpful, and natural because your responses are spoken aloud. When actions are taken, speak the verified result smoothly.";

export class AssemblyAIVoiceClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private handlers: AssemblyAIEventHandlers;
  private options: AssemblyAIVoiceClientOptions;
  private isSessionReady: boolean = false;
  private isConnecting: boolean = false;
  private connectionAttempt = 0;

  constructor(
    handlers: AssemblyAIEventHandlers = {},
    options: AssemblyAIVoiceClientOptions = {}
  ) {
    this.handlers = handlers;
    this.options = {
      tokenEndpoint: '/api/voice/token',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      voice: 'alba',
      ...options,
    };
  }

  public setHandlers(handlers: AssemblyAIEventHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public getIsReady(): boolean {
    return this.isSessionReady && this.ws?.readyState === WebSocket.OPEN;
  }

  public setVoice(voice: string): boolean {
    if (this.state !== 'disconnected') {
      return false;
    }

    this.options.voice = voice;
    return true;
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.handlers.onConnectionChange?.(newState);
  }

  /**
   * Connects to the AssemblyAI Voice Agent WebSocket using a server-issued temporary token.
   */
  public async connect(): Promise<void> {
    if (this.isConnecting || this.state === 'connected' || this.state === 'ready') {
      console.warn('[AssemblyAI Client] Connection already in progress or established. Ignoring.');
      return;
    }

    try {
      const attempt = ++this.connectionAttempt;
      this.isConnecting = true;
      this.isSessionReady = false;
      this.setState('fetching_token');

      console.log('[AssemblyAI Client] Fetching temporary voice token from server...');

      // 1. Fetch short-lived token from secure server route
      const tokenRes = await fetch(this.options.tokenEndpoint || '/api/voice/token', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to obtain voice token (${tokenRes.status})`
        );
      }

      const { token } = await tokenRes.json();
      if (!token) {
        throw new Error('No voice token received from server.');
      }

      console.log('[AssemblyAI Client] Token acquired. Connecting to Voice Agent WebSocket...');
      this.setState('connecting');

      // 2. Establish WebSocket to AssemblyAI Voice Agent API
      const wsUrl = `wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(token)}`;
      if (attempt !== this.connectionAttempt) return;
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.isConnecting = false;
        this.setState('connected');
        console.log(`[AssemblyAI WS] Connection open (readyState: ${socket.readyState}). Sending session.update...`);

        // 3. Send session.update immediately upon opening
        const sessionUpdateMessage = {
          type: 'session.update',
          session: {
            system_prompt: this.options.systemPrompt,
            input: {
              format: { encoding: 'audio/pcm' },
              turn_detection: {
                interrupt_response: true,
              },
            },
            output: {
              voice: this.options.voice || 'ivy',
              format: { encoding: 'audio/pcm' },
            },
          },
        };

        socket.send(JSON.stringify(sessionUpdateMessage));
        console.log('[AssemblyAI WS] session.update sent. Awaiting session.ready...');
      };

      socket.onmessage = (event: MessageEvent) => {
        if (this.ws !== socket) return;
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (parseErr) {
          console.error('[AssemblyAI WS] Error parsing incoming WebSocket event:', parseErr, event.data);
        }
      };

      socket.onerror = (event: Event) => {
        if (this.ws !== socket) return;
        console.error('[AssemblyAI WS] WebSocket error occurred:', event);
        const err = new Error('WebSocket connection error with AssemblyAI Voice Agent.');
        this.isConnecting = false;
        this.handlers.onError?.(err);
        this.setState('error');
      };

      socket.onclose = (event: CloseEvent) => {
        if (this.ws !== socket) return;
        console.log(`[AssemblyAI WS] Connection closed (code: ${event.code}, reason: "${event.reason}", clean: ${event.wasClean})`);
        this.isConnecting = false;
        this.isSessionReady = false;
        this.setState('disconnected');
        this.handlers.onSessionEnded?.();
      };
    } catch (err: unknown) {
      console.error('[AssemblyAI Client] Connection initialization failed:', err);
      this.isConnecting = false;
      const error = err instanceof Error ? err : new Error(String(err));
      this.setState('error');
      this.handlers.onError?.(error);
      this.disconnect();
    }
  }

  /**
   * Internal dispatcher for AssemblyAI Voice Agent WebSocket events with full trace logging
   */
  private handleServerEvent(event: {
    type?: string;
    text?: string;
    data?: string;
    status?: string;
    message?: string;
    session_id?: string;
    [key: string]: unknown;
  }) {
    const readyState = this.ws?.readyState;
    
    // Log EVERY incoming event with its key fields (without sensitive data)
    console.log(`[AssemblyAI Event] Type: "${event.type}" (WS readyState: ${readyState})`, {
      type: event.type,
      text: event.text ? `"${event.text}"` : undefined,
      status: event.status,
      hasAudio: Boolean(event.data),
      audioLength: event.data ? event.data.length : undefined,
      sessionId: event.session_id,
      message: event.message,
    });

    switch (event.type) {
      case 'session.ready':
      case 'session.updated':
        this.isSessionReady = true;
        this.setState('ready');
        console.log('[AssemblyAI Client] >>> SESSION READY! Audio streaming is now permitted.');
        this.handlers.onSessionReady?.(event.session_id);
        break;

      case 'input.speech.started':
        this.handlers.onUserSpeechStarted?.();
        break;

      case 'input.speech.stopped':
        this.handlers.onUserSpeechStopped?.();
        break;

      case 'transcript.user.delta':
        if (event.text) {
          this.handlers.onUserTranscriptDelta?.(
            event.text,
            typeof event.item_id === 'string' ? event.item_id : undefined
          );
        }
        break;

      case 'transcript.user':
        if (event.text) {
          this.handlers.onUserTranscript?.(
            event.text,
            typeof event.item_id === 'string' ? event.item_id : undefined
          );
        }
        break;

      case 'reply.started':
        this.handlers.onAgentStarted?.(
          typeof event.reply_id === 'string' ? event.reply_id : undefined
        );
        break;

      case 'transcript.agent':
        if (event.text) {
          this.handlers.onAgentTranscript?.(
            event.text,
            typeof event.reply_id === 'string' ? event.reply_id : undefined,
            event.interrupted === true
          );
        }
        break;

      case 'reply.audio':
        if (event.data) {
          this.handlers.onAgentAudioChunk?.(event.data);
        }
        break;

      case 'reply.done':
        const replyStatus = event.status === 'interrupted' ? 'interrupted' : 'completed';
        console.log(`[AssemblyAI Client] Reply done. Status: ${replyStatus}`);
        this.handlers.onAgentReplyDone?.(replyStatus);
        break;

      case 'session.error':
      case 'error':
        const errorMsg = event.message || JSON.stringify(event);
        console.error('[AssemblyAI Client] Session error received:', errorMsg);
        this.handlers.onError?.(new Error(errorMsg));
        break;

      default:
        console.log('[AssemblyAI Client] Unhandled auxiliary event:', event.type);
        break;
    }
  }

  /**
   * Sends base64-encoded PCM16 audio chunk from microphone
   */
  public sendAudioChunk(base64Audio: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!this.isSessionReady) {
      // Per AssemblyAI documentation: Never send audio before session.ready
      return;
    }

    const payload = {
      type: 'input.audio',
      audio: base64Audio,
    };

    try {
      this.ws.send(JSON.stringify(payload));
    } catch (error) {
      console.error('[AssemblyAI Client] Failed to send audio chunk:', error);
    }
  }

  /**
   * Disconnects and cleans up active WebSocket
   */
  public disconnect(): void {
    this.connectionAttempt++;
    this.isConnecting = false;
    this.isSessionReady = false;
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        console.log('[AssemblyAI Client] Closing WebSocket connection gracefully.');
        this.ws.close(1000, 'Client closed session');
      }
      this.ws = null;
    }
    this.setState('disconnected');
  }
}
