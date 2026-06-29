export type TokenType = 'color' | 'size' | 'shadow' | 'font' | 'spacing';

export type TokenValueMap = Record<string, string>;

export type Severity = 'info' | 'warning' | 'error';

export interface Token {
  key: string;
  type: TokenType;
  value: string;
  valueDark?: string;
  description?: string;
  locked?: boolean;
  contrastAgainst?: string;
  contrastMin?: number;
}

export interface ComponentVariant {
  id: string;
  name: string;
  description?: string;
  tokens?: string[];
}

export interface ComponentDef {
  id: string;
  name: string;
  category?: string;
  tokensUsed: string[];
  structure: string[];
  a11y?: {
    description?: string;
  };
  variants?: ComponentVariant[];
}

export interface Theme {
  id: string;
  name: string;
  globalOverrides: Record<string, string>;
  darkOverrides?: Record<string, string>;
  components: Record<string, Record<string, string>>;
  publishedVersions: string[];
}

export interface ThemeSnapshot {
  tokens: TokenValueMap;
  components: Record<string, Record<string, string>>;
}

export interface ThemeVersion {
  snapshotId: string;
  themeId: string;
  version: string;
  createdBy: string;
  createdAt: string;
  snapshot: ThemeSnapshot;
  changelog?: unknown;
}

// Legacy aliases for backward compatibility during migration
export type Preset = Theme;
export type PresetSnapshot = ThemeSnapshot;
export type PresetVersion = ThemeVersion;

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
  componentSummaries?: ImpactComponentSummary[];
}

export interface ImpactMetadata {
  tokensChanged: number;
  componentsAffected: number;
  globalOverridesCount: number;
  componentsCount: number;
}

export interface ImpactComponentSummary {
  id: string;
  name: string;
  structure: string[];
  tokensImpacted: string[];
  variantCount: number;
  severity: 'low' | 'medium' | 'high';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

