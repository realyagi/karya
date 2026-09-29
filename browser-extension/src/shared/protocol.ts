export type BrowserCommandType =
  | 'GET_ACTIVE_TAB'
  | 'OPEN_URL'
  | 'CREATE_TAB'
  | 'GET_PAGE_TEXT'
  | 'GET_SELECTED_TEXT'
  | 'SCROLL'
  | 'FIND_TEXT';

export type BrowserCommand =
  | {
      type: 'GET_ACTIVE_TAB';
      requestId: string;
    }
  | {
      type: 'OPEN_URL';
      requestId: string;
      url: string;
    }
  | {
      type: 'CREATE_TAB';
      requestId: string;
      url?: string;
    }
  | {
      type: 'GET_PAGE_TEXT';
      requestId: string;
      tabId?: number;
    }
  | {
      type: 'GET_SELECTED_TEXT';
      requestId: string;
      tabId?: number;
    }
  | {
      type: 'SCROLL';
      requestId: string;
      direction: 'up' | 'down';
      amount?: number;
    }
  | {
      type: 'FIND_TEXT';
      requestId: string;
      text: string;
    };

export interface BrowserTabInfo {
  id?: number;
  title?: string;
  url?: string;
  active?: boolean;
}

export interface BrowserResponse<T = unknown> {
  source: 'karya-extension';
  requestId: string;
  success: boolean;
  data?: T;
  error?: string;
}

export interface ExtensionPairingData {
  authToken: string;
  karyaUrl: string;
  pairedAt: number;
}
