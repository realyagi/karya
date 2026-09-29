export type IntegrationProvider = 'google-calendar' | 'github';
export type IntegrationStatus = 'not-configured' | 'not-connected' | 'connected' | 'error';

export interface IntegrationStatusResponse {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  accountLabel?: string;
  message?: string;
}

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}