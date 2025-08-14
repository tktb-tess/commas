type Monzo = readonly (readonly [number, number])[];

type CommaType =
  | {
      readonly commaType: 'rational';
      readonly monzo: Monzo;
    }
  | {
      readonly commaType: 'irrational';
      readonly ratio: string;
      readonly cents: number;
    };

export type CommaData = CommaType & {
  readonly id: string;
  readonly name: string[];
  readonly colorName: readonly [string, string];
  readonly namedBy?: string;
};

export type CommaMetadata = {
  readonly lastUpdate: string;
  readonly numberOf: number;
};

export type Commas = {
  readonly metadata: CommaMetadata;
  readonly commas: CommaData[];
};
