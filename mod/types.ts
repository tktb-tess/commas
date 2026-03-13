type Monzo = readonly (readonly [number, number])[];

interface BaseData {
  readonly id: string;
  readonly name: string[];
  readonly colorName: readonly [string, string];
  readonly namedBy?: string;
}

interface RationalComma extends BaseData {
  readonly commaType: 'rational';
  readonly monzo: Monzo;
}

interface IrrationalComma extends BaseData {
  readonly commaType: 'irrational';
  readonly ratio: string;
  readonly cents: number;
}

export type Content = RationalComma | IrrationalComma;

export interface Metadata {
  readonly lastUpdate: string;
  readonly numberOf: number;
}

export interface CommaData {
  readonly metadata: Metadata;
  readonly commas: Content[];
}
