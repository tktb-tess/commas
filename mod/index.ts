import type { CommaMetadata, Commas } from './types';
import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fetchData } from './funcs';

const main = async () => {
  const mode = process.argv.at(2);

  if (mode !== undefined && mode !== 'dry') {
    throw Error('invalid argument');
  }

  const gl = glob('./resource/*.html');
  const paths = await Array.fromAsync(gl);
  const tasks = paths.map(fetchData);
  const commas = (await Promise.all(tasks)).flat();

  // sorting
  console.log('sorting...');
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
  const dir = `./public/out`;
  const path = './public/out/commas.json';
  const obj: Commas = { metadata, commas };

  if (mode === 'dry') {
    console.log('dry run\n', commas.map(({ name }) => name[0]).join(', '));
    console.log(commas.length, 'All tasks succeeded!');
  } else {
    await readFile(path).then(
      async (old) => {
        const path2 = './public/out/commas-old.json';
        console.log(`writing commas-old.json...`);
        await mkdir(dir, { recursive: true });
        await writeFile(path2, old);
      },
      () => console.log('no previous commas.json')
    );

    await mkdir(dir, { recursive: true });
    console.log(`writing commas.json...`);
    await writeFile(path, JSON.stringify(obj, null, 2));
    console.log(commas.length, 'All tasks succeeded!');
  }
};

main();
