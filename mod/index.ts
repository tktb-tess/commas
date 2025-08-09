import { JSDOM } from 'jsdom';
import type { CommaData, CommaMetadata, Commas, UUID } from './types';
import { urls, pList } from './data';
import { mkdir, writeFile } from 'node:fs/promises';

const fetchData = async (url: string) => {
  const html = await JSDOM.fromURL(url);
  const document = html.window.document;
  const allData: [UUID, CommaData][] = [];

  const tables = [...document.querySelectorAll('table')];

  tables.forEach((table) => {
    const third = table.querySelectorAll('th').item(2);
    const thirds = third.textContent.replaceAll(/\n/g, '').trim();
    const trs = [...table.querySelectorAll('tr:has(td)')]
      .map((tr) => [...tr.querySelectorAll('td')])
      .map((tds) =>
        tds.map((td) => td.textContent.replaceAll(/\n/g, '').trim())
      );

    const tableData = trs.map((row): [UUID, CommaData] => {
      const name = row[0] ? row[0].split(',').map((s) => s.trim()) : [row[1]];

      const [, cName, cName2] = row;
      const mnz = (() => {
        switch (thirds) {
          case 'Ratio': {
            return row[4];
          }
          case 'Monzo': {
            return row[3];
          }
          default: {
            throw Error(`unexpected value: ${thirds}`);
          }
        }
      })();

      const namedBy = (() => {
        switch (thirds) {
          case 'Ratio': {
            return row[6];
          }
          case 'Monzo': {
            return row[5];
          }
          default: {
            throw Error(`unexpected value: ${thirds}`);
          }
        }
      })();

      const colorName = [cName, cName2] as const;

      const monzo = (() => {
        const ketRegex = /\[[-\d\s]+⟩/;
        const basisRegex = /(?:\d+\.)+\d+/;
        const basisM = basisRegex.exec(mnz);
        const ketM = ketRegex.exec(mnz);
        if (!ketM) return [];
        const values = ketM[0]
          .slice(1, -1)
          .split(/\s/)
          .map((s) => Number.parseInt(s));
        if (basisM) {
          const basis = basisM[0].split('.').map((s) => Number.parseInt(s));

          return values.map((v, i) => [basis[i] ?? -1, v] as const);
        } else {
          if (values.length > pList.length) {
            throw Error(
              `a length of the monzo exceeds that of the prime list: ${values.length}`
            );
          }
          const basis = pList.slice(0, values.length);
          return values
            .map((v, i) => [basis[i], v] as const)
            .filter(([, v]) => v !== 0);
        }
      })();

      const uuid = crypto.randomUUID();

      if (monzo.length > 0) {
        return [
          uuid,
          {
            commaType: 'rational',
            name,
            colorName,
            monzo,
            namedBy: namedBy || undefined,
          },
        ];
      } else {
        const ratio = row[3];
        return [
          uuid,
          {
            commaType: 'irrational',
            name,
            colorName,
            ratio,
            namedBy: namedBy || undefined,
          },
        ];
      }
    });

    allData.push(...tableData);
  });

  console.log('success:', allData.length, 'commas in', url);
  
  return allData;
};

const main = async () => {
  const tasks = urls.map((url) => fetchData(url));
  const commas_ = await Promise.all(tasks).then((data) => data.flat());

  commas_.sort(([, a], [, b]) => {

    const [resa, resb] = [a, b].map((data) => {
      switch (data.commaType) {
        case 'irrational': {
          return Number.MAX_SAFE_INTEGER;
        }
        case 'rational': {
          return data.monzo.map(([b, v]) => Math.log2(b) * v).reduce((prev, cur) => prev + cur, 0);
        }
      }
    });

    return resa - resb;
  });

  const commas: Record<UUID, CommaData> = Object.fromEntries(commas_);

  // check
  if (Object.entries(commas).length === commas_.length) {
    console.log('comma uuid check passed');
  } else {
    throw Error('invalid uuid');
  }

  const metadata: CommaMetadata = {
    lastUpdate: new Date().toISOString(),
    numberOf: commas_.length,
  };

  const obj: Commas = { metadata, commas };

  await mkdir('./out', { recursive: true });
  await writeFile('./out/commas.json', JSON.stringify(obj));
  console.log(commas_.length, 'All tasks succeeded!');
};

main();

