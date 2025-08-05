import { millerRabin } from './util';

export const urls = [
  'https://en.xen.wiki/w/Small_comma',
  'https://en.xen.wiki/w/Medium_comma',
  'https://en.xen.wiki/w/Large_comma',
  'https://en.xen.wiki/w/Unnoticeable_comma',
] as const;

export const pList = Array(10000)
  .fill(0)
  .map((_, i) => BigInt(i))
  .filter((n) => millerRabin(n))
  .map((n) => Number(n));
