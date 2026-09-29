/**
 * KARYA Core Types
 * Phase 1 foundational type definitions designed to seamlessly accommodate
 * AssemblyAI Realtime Voice Agent API, agent orchestrators, and tool execution in later phases.
 */

export type VoiceState = 'idle' | 'connecting' | 'ready' | 'listening' | 'processing' | 'speaking' | 'error';

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface VoiceSession {
  id: string;
  state: VoiceState;
  permission: MicPermissionState;
  startTime: number | null;
  duration: number; // in seconds
  audioVolume: number; // 0 to 1 real-time normalized volume level
  error: string | null;
}

export type MessageRole = 'user' | 'karya' | 'system';

export type MessageStatus = 'pending' | 'delivered' | 'processing' | 'completed' | 'error';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status?: MessageStatus;
  toolInvocations?: ToolCall[];
  imageUrl?: string;
}

export type ActivityEventType =
  | 'voice_received'
  | 'transcription_complete'
  | 'intent_understood'
  | 'tool_called'
  | 'tool_completed'
  | 'response_ready';

export type ActivityEventStatus = 'queued' | 'in_progress' | 'completed' | 'failed';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description?: string;
  timestamp: string;
  status: ActivityEventStatus;
  toolName?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  toolName: string;
  displayName: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  calledAt: string;
  completedAt?: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  category: 'tasks' | 'calendar' | 'notes' | 'research';
  promptSuggestion: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface KaryaTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KaryaNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
