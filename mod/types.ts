export type CommaData = {
  readonly name: string;
  readonly colorName: readonly [string, string];
  readonly monzo: readonly (readonly [number, number])[];
  readonly namedBy: string;
  readonly namedDate: string;
};
