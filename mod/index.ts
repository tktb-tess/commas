import { JSDOM } from 'jsdom';
import type { CommaData, CommaMetadata, Commas } from './types';
import { urls, pList } from './data';
import { mkdir, writeFile } from 'node:fs/promises';
import { create, all } from 'mathjs';
import { encode } from 'cbor2';

const math = create(all, {
  number: 'number',
});

const fetchData = async (url: string) => {
  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) {
    throw Error(`failed to fetch:\n${resp.status} ${resp.statusText}`);
  }
  const domStr = await resp.text();
  const html = new JSDOM(domStr);
  const document = html.window.document;
  const allData: CommaData[] = [];

  const tables = [...document.querySelectorAll('table')];

  for (const table of tables) {
    const third = table.querySelectorAll('th').item(2);
    const thirdStr = third.textContent.replaceAll(/\n/g, '').trim();
    const trs = [...table.querySelectorAll('tr:has(td)')]
      .map((tr) => [...tr.querySelectorAll('td')])
      .map((tds) =>
        tds.map((td) => {
          const childs = [...td.childNodes];
          const str = childs
            .map((ch) => {
              return ch.nodeName === 'SUP'
                ? `^${ch.textContent}`
                : ch.textContent ?? '';
            })
            .join('');

          return str.replaceAll(/\n/g, '\x20').trim();
        })
      );

    const tableData = trs.map(async (row): Promise<CommaData> => {
      const name = row[0] ? row[0].split(',').map((s) => s.trim()) : [row[1]];

      const [, cName, cName2] = row;
      const mnz = (() => {
        switch (thirdStr) {
          case 'Ratio': {
            return row[4];
          }
          case 'Monzo': {
            return row[3];
          }
          default: {
            throw Error(`unexpected value: ${thirdStr}`);
          }
        }
      })();

      const namedBy = (() => {
        let n_: string;
        
        switch (thirdStr) {
          case 'Ratio': {
            n_ = row[6];
            break;
          }
          case 'Monzo': {
            n_ = row[5];
            break;
          }
          default: {
            throw Error(`unexpected value: ${thirdStr}`);
          }
        }

        return n_ || undefined;
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

      if (monzo.length > 0) {
        const id = (() => {
          const cbor = encode(monzo);
          return Buffer.from(cbor.buffer, cbor.byteOffset, cbor.byteLength).toString('base64url');
        })();

        return {
          id,
          commaType: 'rational',
          name,
          colorName,
          monzo,
          namedBy,
        };
      } else {
        const ratio = row[3];
        const evaluated: number = math.evaluate(ratio.replaceAll(/π/g, 'pi'));
        const cents = Math.log2(evaluated) * 1200;
        const id = Buffer.from(ratio, 'utf8').toString('base64url');

        return {
          id,
          commaType: 'irrational',
          name,
          colorName,
          ratio,
          cents,
          namedBy,
        };
      }
    });

    await Promise.all(tableData).then((data) => allData.push(...data));
  }

  console.log('success:', allData.length, 'commas from', url);

  return allData;
};

const main = async () => {
  const tasks = urls.map((url) => fetchData(url));
  const commas = await Promise.allSettled(tasks).then((r) =>
    r
      .filter((r) => r.status === 'fulfilled')
      .map((data) => data.value)
      .flat()
  );

  // sorting
  commas.sort((a, b) => {
    const [resa, resb] = [a, b].map((data) => {
      switch (data.commaType) {
        case 'irrational': {
          return data.cents;
        }
        case 'rational': {
          return data.monzo
            .map(([b, v]) => 1200 * Math.log2(b) * v)
            .reduce((prev, cur) => prev + cur, 0);
        }
      }
    });

    return resa - resb;
  });

  const metadata: CommaMetadata = {
    lastUpdate: new Date().toISOString(),
    numberOf: commas.length,
  };

  const obj: Commas = { metadata, commas };
  await mkdir('./public/out', { recursive: true });
  await writeFile('./public/out/commas.json', JSON.stringify(obj));
  console.log(commas.length, 'All tasks succeeded!');
};

main();
