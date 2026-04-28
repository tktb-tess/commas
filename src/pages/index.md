---
layout: ../layouts/layout.astro
title: Commas
---

[戻る](/.)

### 目次

## What is comma?

コンマ (comma) とは、微小な音程のことを指し、 Xenharmonic music では temper out などに関わる重要な概念のひとつです。

このリポジトリでは、Xenharmonic Wikiからコンマのデータを取得し、独自のJSON形式にパースしたのち、 [`./out/commas.json`](./out/commas.json) にまとめて保管しています。

不定期更新です。

## 型

```ts
// モンゾ, [底の整数, 指数] のペアの配列
type Monzo = [number, number][];

interface BaseData {
  id: string; // 一意なID
  name: string[]; // コンマ名
  colorName: [string, string]; // コンマのColor name, [発音表記, 記号表記]
  namedBy?: string; // 命名者 (あれば)
}

// 有理数コンマ
interface RationalComma extends BaseData {
  commaType: 'rational';
  monzo: Monzo;
}

// 無理数コンマ
interface IrrationalComma extends BaseData {
  commaType: 'irrational';
  ratio: string; // 比率
  cents: number; // セント値
}

type Content = RationalComma | IrrationalComma;

interface Metadata {
  lastUpdate: string; // 最終アップデート日時 (UTC, ISO 8601 形式)
  numberOf: number; // コンマの総数
};

interface CommaData {
  metadata: Metadata;
  commas: Content[];
};
```

### example

#### Metadata

```json
{
  "lastUpdate": "2025-08-04T08:21:52.764Z",
  "numberOf": 1014
}
```

#### Content

```json
{
  "id": "g4ICI4IDBIIFIA",
  "commaType": "rational",
  "name": [
    "Syntonic comma",
    "Didymus comma",
    "meantone comma"
  ],
  "colorName": ["Gu", "g1"],
  "monzo": [
    [2, -4],
    [3, 4],
    [5, -1]
  ]
}
```

