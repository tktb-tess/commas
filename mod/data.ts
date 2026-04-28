import { bailliePSW } from '@tktb-tess/util-fns/baillie_psw';
import { create, all } from 'mathjs';

if (all == null) {
  throw Error('!');
}

export const math = create(all, {
  number: 'number',
});

export const pList = [...Array(10000)]
  .map((_, i) => BigInt(i))
  .filter((n) => bailliePSW(n))
  .map((n) => Number(n));
