import { writeFile } from 'node:fs/promises';
import { millerRabin } from './util';

(async () => {
  const pList: readonly number[] = Array(100000)
    .fill(0)
    .map((_, i) => BigInt(i))
    .filter((n) => millerRabin(n))
    .map((n) => Number(n));

  const fCont = `const primes=${JSON.stringify(pList)}as const;`;
  await writeFile('src/primes.ts', fCont);
})();
