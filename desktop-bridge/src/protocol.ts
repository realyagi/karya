export type DesktopCommandType =
  | 'desktop.open_application'
  | 'desktop.open_url'
  | 'desktop.open_folder'
  | 'desktop.create_local_file'
  | 'desktop.read_selected_file'
  | 'desktop.take_screenshot'
  | 'desktop.get_system_info';

export interface DesktopRequest<T = Record<string, unknown>> {
  requestId: string;
  command: DesktopCommandType;
  arguments: T;
  authToken: string;
}

export interface DesktopResponse<T = unknown> {
  requestId: string;
  success: boolean;
  result?: T;
  error?: string;
}

export interface PairingResponse {
  success: boolean;
  authToken?: string;
  error?: string;
}
