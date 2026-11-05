export interface ResearchEvent {
  id: string;
  name: string;
  timestamp: string;
  sessionId: string;
  path: string;
  properties: Record<string, unknown>;
  utm: Record<string, string>;
}
