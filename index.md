
[戻る](/.)

コンマ (comma) とは、微小な音程のことを指し、 Xenharmonic music では temper out などに関わる重要な概念のひとつです。

このリポジトリでは、 Xenharmonic Wiki の [Large comma](https://en.xen.wiki/w/Large_comma), [Medium comma](https://en.xen.wiki/w/Medium_comma), [Small comma](https://en.xen.wiki/w/Small_comma), [Unnoticeable comma](https://en.xen.wiki/w/Unnoticeable_comma) の4つのページからコンマのデータを取得し、独自のJSON形式にパースしたのち、 [`./out/commas.json`](./out/commas.json) にまとめて保管しています。

日本時間毎日0時頃に更新されます。

## 型

```ts
type CommaData = {
  name: string; // コンマ名
  colorName: [string, string]; // コンマのColor name, [発音表記, 記号表記]
  monzo: [number, number][]; // モンゾ, [底の整数, 指数] のペアの配列
  namedBy?: string; // 命名者 (あれば)
  ratio?: string; // 比率 (モンゾが無い無理比コンマなどのときのみ)
};
```

### example

```json
{
    "name": "Syntonic comma, Didymus comma, meantone comma",
    "colorName": ["Gu", "g1"],
    "monzo": [
      [2, -4],
      [3, 4],
      [5, -1]
    ]
}
```

