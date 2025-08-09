type Monzo = readonly (readonly [number, number])[];

type CommaType =
  | {
      readonly commaType: 'rational';
      readonly monzo: Monzo;
    }
  | {
      readonly commaType: 'irrational';
      readonly ratio: string;
    };

export type CommaData = CommaType & {
  readonly name: string[];
  readonly colorName: readonly [string, string];
  readonly namedBy?: string;
};

export type CommaMetadata = {
  readonly lastUpdate: string; // 最終アップデート日時 (UTC, ISO 8601 形式)
  readonly numberOf: number; // コンマの総数
};

export type UUID = ReturnType<typeof crypto.randomUUID>;

export type Commas = {
  readonly metadata: CommaMetadata;
  readonly commas: Record<UUID, CommaData>;
};
