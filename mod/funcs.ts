import { JSDOM } from 'jsdom';
import { pList, math } from './data.ts';
import { encode } from 'cbor2';
import { readFile } from 'node:fs/promises';
import type { Content } from './types.ts';

const tableTo2DArray = (table: HTMLTableElement) => {
  const third = table.querySelectorAll('th').item(2);
  const thirdStr = third.textContent.replaceAll(/\n/g, '').trim();
  const trs = [...table.querySelectorAll('tr:has(td)')];
  const td2DArray = trs.map((tr) => [...tr.querySelectorAll('td')]);
  const array2D = td2DArray.map((tds) => {
    return tds.map((td) => {
      const childs = [...td.childNodes];
      const strs = childs.map((ch) => {
        return ch.nodeName === 'SUP'
          ? `^${ch.textContent}`
          : (ch.textContent ?? '');
      });
      return strs.join('').replace(/\s+/g, '\x20').trim();
    });
  });
  return [array2D, thirdStr] as const;
};

const formatMonzo = (mnz: string) => {
  const ketRegex = /\[(?:(?:-?\d+)|\s)+⟩/;
  const basisRegex = /(?:\d+\.)+\d+/;
  const basisM = basisRegex.exec(mnz);
  const ketM = ketRegex.exec(mnz);

  if (!ketM) return null;

  const values = ketM[0]
    .slice(1, -1)
    .split(/\s/)
    .map((s) => Number.parseInt(s))
    .filter((n) => Number.isFinite(n));

  if (values.length === 0) return null;
  if (basisM) {
    const basis = basisM[0]
      .split('.')
      .map((s) => Number.parseInt(s))
      .filter((n) => Number.isFinite(n));

    if (basis.length !== values.length) {
      throw Error(
        `basis.length: ${basis.length} !== values.length: ${values.length}`,
      );
    }

    return values.map((v, i) => {
      const b = basis[i];
      if (b == null) {
        throw Error(`unexpected basis: ${basis} ${values}`);
      }
      return [b, v] as const;
    });
  } else {
    if (values.length > pList.length) {
      throw Error(
        `a length of the monzo exceeds that of the prime list: ${values.length}`,
      );
    }

    const basis = pList.slice(0, values.length);

    return values.map((v, i) => {
      const b = basis[i];
      if (b == null) {
        throw Error('unexpected basis');
      }
      return [b, v] as const;
    });
  }
};

const formatCommaData = async (
  row: string[],
  thirdStr: string,
): Promise<Content> => {
  try {
    await new Promise<void>((res) => setTimeout(res, 0));
    const [_n1, _n2, _n3] = row;
    const name = (() => {
      if (_n1) {
        return _n1.split(',').map((s) => s.trim());
      } else if (_n2) {
        return [_n2];
      }
      throw Error('No name');
    })();

    const mnz = (() => {
      switch (thirdStr) {
        case 'Ratio': {
          return row[4] ?? '';
        }
        case 'Monzo': {
          return row[3] ?? '';
        }
        default: {
          throw Error(`unexpected value: ${thirdStr}`);
        }
      }
    })();

    const namedBy = (() => {
      switch (thirdStr) {
        case 'Ratio': {
          return row[6] || undefined;
        }
        case 'Monzo': {
          return row[5] || undefined;
        }
        default: {
          throw Error(`unexpected value: ${thirdStr}`);
        }
      }
    })();

    const colorName = [_n2 ?? '', _n3 ?? ''] as const;

    const monzo = formatMonzo(mnz);

    if (monzo && monzo.length > 0) {
      const id = (() => {
        const bin = encode(monzo);
        return Buffer.copyBytesFrom(bin).toString('base64url');
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
      const ratio = row[3] ?? '';
      const evaluated: unknown = math.evaluate(ratio.replaceAll(/π/g, 'pi'));
      if (typeof evaluated !== 'number') {
        throw Error('failed to evaluate expression', {
          cause: JSON.stringify(row),
        });
      }
      const cents = Math.log2(evaluated) * 1200;
      const id = Buffer.from(ratio, 'utf-8').toString('base64url');

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
  } catch (e) {
    if (e instanceof Error) {
      e.cause = JSON.stringify(row);
      throw e;
    }
    throw e;
  }
};

export const fetchData = async (path: string) => {
  const domStr = await readFile(path, {
    encoding: 'utf-8',
  });

  const html = new JSDOM(domStr);
  const document = html.window.document;
  const tables = [...document.querySelectorAll('table')];

  const promises = tables.map(async (table) => {
    const [array2D, thirdStr] = tableTo2DArray(table);
    const cdPromise = array2D.map((row) => formatCommaData(row, thirdStr));
    return Promise.all(cdPromise);
  });

  const allData = (await Promise.all(promises)).flat();

  console.log('success:', allData.length, 'commas from', path);

  return allData;
};

export const sortComma = (data: Content) => {
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
};
