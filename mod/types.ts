export type CommaData = {
  readonly name: string;
  readonly colorName: readonly [string, string];
  readonly monzo: readonly (readonly [number, number])[];
  readonly namedBy?: string;
  readonly ratio?: string;
};

export type CommaMetadata = {
  readonly lastUpdate: string; // 最終アップデート日時 (UTC, ISO 8601 形式)
  readonly numberOf: number; // コンマの総数
};

export type Commas = {
  readonly metadata: CommaMetadata;
  readonly commas: readonly CommaData[];
};