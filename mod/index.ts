import { JSDOM } from 'jsdom';
import type { CommaData } from './types';
import { urls, pList } from './data';
import { writeFile } from 'node:fs/promises';

const fetchData = async (url: string) => {
  const html = await JSDOM.fromURL(url);
  const document = html.window.document;
  const allData: CommaData[] = [];

  const tables = [...document.querySelectorAll('table')];

  tables.forEach((table) => {
    const third = table.querySelectorAll('th').item(2);
    const thirds = third.textContent?.replaceAll(/\n/g, '').trim();
    const trs = [...table.querySelectorAll('tr:has(td)')]
      .map((tr) => [...tr.querySelectorAll('td')])
      .map((tds) =>
        tds.map((td) => td.textContent?.replaceAll(/\n/g, '').trim() ?? '')
      );

    const tableData = trs.map((row): CommaData => {
      const [name, cName, cName2] = row;
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
          const basis = pList.slice(0, values.length);
          return values
            .map((v, i) => [basis[i], v] as const)
            .filter(([, v]) => v !== 0);
        }
      })();

      const ratio = monzo.length === 0 ? row[3] : undefined;

      return {
        name,
        colorName,
        monzo,
        namedBy,
        ratio,
      };
    });
    allData.push(...tableData);
  });

  console.log(url, allData.length, 'success!');
  return allData;
};

const main = async () => {
  const tasks = urls.map((url) => fetchData(url));
  const data = await Promise.all(tasks).then((data) => data.flat());

  data.sort((a, b) => {
    const [resa, resb] = [a.monzo, b.monzo].map((monzo) => {
      if (monzo.length === 0) return Number.MAX_SAFE_INTEGER;
      return monzo
        .map(([basis, value]) => Math.log(basis) * value)
        .reduce((prev, current) => prev + current);
    });

    return resa - resb;
  });

  await writeFile('out/comma.json', JSON.stringify(data));
  console.log(data.length, 'All tasks succeeded!');
};

main();

export {};
