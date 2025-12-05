import { JSDOM } from 'jsdom';
import { pList, math } from './data';
import { encode } from 'cbor2';
import { readFile } from 'node:fs/promises';
import type { CommaData } from './types';

export const fetchData = async (path: string) => {
  const domStr = await readFile(path, {
    encoding: 'utf-8',
  });

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
          const { buffer, byteOffset, length } = encode(monzo);
          return Buffer.from(buffer, byteOffset, length).toString('base64url');
        })();

        // console.log(name[0], 'was parsed');

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

        // console.log(name[0], 'was parsed');

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

  console.log('success:', allData.length, 'commas from', path);

  return allData;
};


