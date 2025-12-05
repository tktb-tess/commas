import { bailliePSW } from '@tktb-tess/util-fns';
import { create, all } from 'mathjs';

export const math = create(all, {
  number: 'number',
});

export const pList = Array(10000)
  .fill(0)
  .map((_, i) => BigInt(i))
  .filter((n) => bailliePSW(n))
  .map((n) => Number(n));
