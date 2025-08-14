
[戻る](/.)

コンマ (comma) とは、微小な音程のことを指し、 Xenharmonic music では temper out などに関わる重要な概念のひとつです。

このリポジトリでは、 Xenharmonic Wiki の [Large comma](https://en.xen.wiki/w/Large_comma), [Medium comma](https://en.xen.wiki/w/Medium_comma), [Small comma](https://en.xen.wiki/w/Small_comma), [Unnoticeable comma](https://en.xen.wiki/w/Unnoticeable_comma) の4つのページからコンマのデータを取得し、独自のJSON形式にパースしたのち、 [`./out/commas.json`](./out/commas.json) にまとめて保管しています。

毎月2日午前0時頃 (日本時間) に更新されます。

## 型

```ts
type CommaMetadata = {
  lastUpdate: string; // 最終アップデート日時 (UTC, ISO 8601 形式)
  numberOf: number; // コンマの総数
};

type CommaType =
  | {
      commaType: 'rational'; // 有理数コンマ
      monzo: Monzo; // モンゾ, [底の整数, 指数] のペアの配列
    }
  | {
      commaType: 'irrational'; // 無理数コンマ
      ratio: string; // 比率
      cents: number; // セント値
    };

type CommaData = CommaType & {
  id: string;
  name: string; // コンマ名
  colorName: [string, string]; // コンマのColor name, [発音表記, 記号表記]
  namedBy?: string; // 命名者 (あれば)
};

type Commas = {
  metadata: CommaMetadata;
  commas: CommaData[];
};
```

### example

#### メタデータ

```json
{
  "lastUpdate": "2025-08-04T08:21:52.764Z",
  "numberOf": 1014
}
```

#### コンマデータ

```json
[
  {
    "id": "U3ludG9uaWMgY29tbWE",
    "commaType": "rational",
    "name": ["Syntonic comma", "Didymus comma", "meantone comma"],
    "colorName": ["Gu", "g1"],
    "monzo": [
      [2, -4],
      [3, 4],
      [5, -1]
    ]
  },
]
```

