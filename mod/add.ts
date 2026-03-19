import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { pList } from './data.ts';
import { encode } from 'cbor2';
import type { CommaData, Content, Metadata } from './types.ts';
import { sortComma } from './funcs.ts';

const factorise = (n: number) => {
  const pList2 = pList.filter((p) => p <= n);

  let i = 0;
  const ans: [number, number][] = [];

  while (i < pList2.length) {
    const p = pList2[i];
    if (p == null) throw TypeError('!');
    if (n % p === 0) {
      n /= p;
      const k = ans.find((e) => e[0] === p);
      if (k) {
        k[1] += 1;
      } else {
        ans.push([p, 1]);
      }
    } else {
      i++;
    }
  }

  return ans;
};

const removeD = (contents: readonly Content[]) => {
  const ans: Content[] = [];

  a: for (let i = 0; i < contents.length; i++) {
    const con = contents[i];
    if (!con) throw TypeError('!');
    for (let j = 0; j < i; j++) {
      const con2 = contents[j];
      if (!con2) throw TypeError('!');
      if (con.id === con2.id) {
        continue a;
      }
    }
    ans.push(con);
  }

  return ans;
};

const getCents = (mnz: readonly (readonly [number, number])[]) => {
  return mnz
    .map(([b, e]) => 1200 * Math.log2(b) * e)
    .reduce((p, c) => p + c, 0);
};

const parseColorName = (cells: readonly string[], index: number) => {
  if (index !== 0 && index !== 1) throw Error('!');
  if (index === 0) {
    const c = cells[2]?.split(',').map((s) => s.trim());
    return [c?.[0] ?? '', c?.[1] ?? ''] as const;
  } else {
    const c = cells[2]?.trim();
    const c2 = cells[3]?.trim();
    return [c ?? '', c2 ?? ''] as const;
  }
};

const parseName = (cells: readonly string[], index: number) => {
  if (index !== 0 && index !== 1) throw Error('!');
  const i = index === 0 ? 4 : 5;
  const reg = /\(\s?\[[^⟩]+⟩\s?\)/gs;
  const n = cells[i]
    ?.replace(reg, '')
    .split(',')
    .map((s) => s.trim()) ?? ['[NO DATA]'];

  return n.map((n) => n.trim());
};

const addComma = async () => {
  const f = await readFile('./resource/gallery_of_ji.html', {
    encoding: 'utf-8',
  });

  const window = new JSDOM(f).window;
  const tables = window.document.querySelectorAll('table');
  const addContents: Content[] = [];

  for (const [i, table] of tables.entries()) {
    const trs = [...table.querySelectorAll('tbody tr')];
    for (const tr of trs) {
      const cells = [...tr.querySelectorAll('td')].map((c) =>
        c.textContent.replaceAll(/\s+/g, ' ').trim(),
      );

      const mnz = (() => {
        const tu = cells[0]?.split('/').map((n) => Number.parseInt(n));
        const num = tu?.[0];
        const denom = tu?.[1];
        if (num == null || denom == null)
          throw TypeError('!', {
            cause: [table.textContent, tr.textContent],
          });

        const numF = factorise(num);
        const denomF = factorise(denom);

        const bases = [
          ...new Set([...numF.map(([b]) => b), ...denomF.map(([b]) => b)]),
        ];

        const aaa = bases.map((p): readonly [number, number] => {
          const numE = numF.find(([b]) => b === p)?.[1] ?? 0;
          const denomE = denomF.find(([b]) => b === p)?.[1] ?? 0;
          return [p, numE - denomE];
        });

        return aaa.sort((l, r) => l[0] - r[0]);
      })();

      const colorName = parseColorName(cells, i);

      const name = parseName(cells, i);

      const id = Buffer.from(encode(mnz).buffer).toString('base64url');

      addContents.push({
        id,
        name,
        colorName,
        commaType: 'rational',
        monzo: mnz,
      });
    }
  }

  const commaData = (
    await import('../public/out/commas.json', { with: { type: 'json' } })
  ).default as unknown as CommaData;
  const contents = commaData.commas.concat(addContents);

  contents.sort((l, r) => {
    return sortComma(l) - sortComma(r);
  });

  const removed = removeD(contents);

  const metadata: Metadata = {
    lastUpdate: new Date().toISOString(),
    numberOf: removed.length,
  };

  const obj: CommaData = { metadata, commas: removed };

  console.log(obj.metadata);
  console.log(
    obj.commas
      .map((c) => {
        const s = c.commaType === 'rational' ? getCents(c.monzo) : c.cents;
        return `${s} ${c.name[0]}`;
      })
      .join('\n'),
  );

  const dir = `./public/out`;
  const path = './public/out/commas.json';
  const pathOld = './public/out/commas-old.json';

  // await mkdir(dir, { recursive: true });
  // await readFile(path, { encoding: 'utf-8' }).then(
  //   async (old) => {
  //     console.log(`writing commas-old.json...`);
  //     await writeFile(pathOld, old);
  //   },
  //   () => console.log('no previous commas.json, skipped'),
  // );
  //
  // console.log(`writing commas.json...`);
  // await writeFile(path, JSON.stringify(obj, null, 2));
  // console.log(removed.length, 'All tasks succeeded!');
};

addComma();
