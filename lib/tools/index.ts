/**
 * KARYA Extensible Tool System
 * Type definitions and tool registry contracts for future tool integrations.
 */

import { ToolCall } from '@/types/karya';

export interface ToolResult<T = unknown> {
  success: boolean;
  tool: string;
  data?: T;
  message: string;
  error?: string;
  requiresConfirmation?: boolean;
}

export interface ToolDefinition<TParams = Record<string, unknown>, TResult = unknown> {
  name: string;
  displayName: string;
  description: string;
  category: 'tasks' | 'calendar' | 'notes' | 'research' | 'system';
  parametersSchema: Record<string, unknown>;
  requiresConfirmation?: boolean;
  execute(params: TParams): Promise<TResult>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  public register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async executeToolCall(call: ToolCall): Promise<unknown> {
    const tool = this.tools.get(call.toolName);
    if (!tool) {
      throw new Error(`Tool "${call.toolName}" is not registered.`);
    }
    return await tool.execute(call.parameters);
  }
}

export const globalToolRegistry = new ToolRegistry();
