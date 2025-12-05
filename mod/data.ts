import { bailliePSW } from '@tktb-tess/util-fns';

export const pattern = './resource/*.html';

export const pList = Array(10000)
  .fill(0)
  .map((_, i) => BigInt(i))
  .filter((n) => bailliePSW(n))
  .map((n) => Number(n));
