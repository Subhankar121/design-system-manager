export type TokenType = 'color' | 'size' | 'shadow' | 'font' | 'spacing';

export type TokenValueMap = Record<string, string>;

export type Severity = 'info' | 'warning' | 'error';

export interface Token {
  key: string;
  type: TokenType;
  value: string;
  description?: string;
  locked?: boolean;
}

export interface ComponentDef {
  id: string;
  name: string;
  tokensUsed: string[];
  structure: string[];
  a11y?: {
    description?: string;
  };
}

export interface Preset {
  id: string;
  name: string;
  globalOverrides: Record<string, string>;
  componentOverrides: Record<string, Record<string, string>>;
  publishedVersions: string[];
}

export interface PresetSnapshot {
  tokens: TokenValueMap;
  componentOverrides: Record<string, Record<string, string>>;
}

export interface PresetVersion {
  snapshotId: string;
  presetId: string;
  version: string;
  createdBy: string;
  createdAt: string;
  snapshot: PresetSnapshot;
  changelog?: unknown;
}

export interface PublishMetadata {
  createdBy: string;
  notes?: string;
}

export interface ValidationIssue {
  id: string;
  message: string;
  severity: Severity;
  field?: string;
}

export interface ValidationSummary {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface AccessibilityResult {
  tokenKey: string;
  ratio: number;
  rating: 'AAA' | 'AA' | 'Fail';
}

export interface ImpactTokenChange {
  key: string;
  from?: string;
  to?: string;
  components: string[];
}

export interface ImpactReport {
  changedTokens: ImpactTokenChange[];
  affectedComponents: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface ImpactMetadata {
  tokensChanged: number;
  componentsAffected: number;
  globalOverridesCount: number;
  componentOverridesCount: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

