import { Buffer } from 'node:buffer';

/**
 * min以上, max未満の整数を返す
 * @param min
 * @param max
 * @returns 範囲内の整数乱数
 */
export const getRndInt = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min) + min);
};

/**
 *
 * @param nums
 */
export const toBigInt = (nums: number | number[]) => {
	if (typeof nums === 'number') {
		return BigInt(nums);
	} else {
		return nums.map((n) => BigInt(n));
	}
};

/**
 * `length` ビットの乱数 or `length` ビット以下の乱数を出力する
 * @param length ビット長
 * @param fixed true: 固定長, false (デフォルト値): `length` ビット以下の可変ビット長
 *
 */
export const getRandBIByBitLength = (length: number, fixed = false) => {
	if (length <= 0) throw Error('a bit length must be a positive');
	if (!Number.isFinite(length)) throw Error('a bit length is not a valid number');
	const div = Math.ceil(length / 32);

	const typed_arr = crypto.getRandomValues(new Uint32Array(div));

	let result = Array.from(typed_arr, (n) => n.toString(2).padStart(32, '0')).join('');

	result = result.slice(0, length);

	if (fixed) result = result.replace(/^./, '1');
	// console.log(result);
	return BigInt('0b' + result);
};

/**
 * `min` 以上 `max` 未満の乱数を返す
 * @param min 下限
 * @param max 上限
 * @returns `min` 以上 `max` 未満の乱数
 */
export const getRandBIByRange = (min: bigint, max: bigint) => {
	if (min >= max) throw Error('RangeError');
	const diff = max - min;
	const bitLength = diff.toString(2).length;

	const res = (() => {
		while (true) {
			const res = getRandBIByBitLength(bitLength);
			if (res >= modPow(2n, BigInt(bitLength), diff)) {
				return res % diff;
			}
		}
	})();

	return min + res;
};

/**
 * 配列が等しいかどうかの真偽値を返す
 * @returns
 */
export const isEqArray = <T>(arr1: T[], arr2: T[]) => {
	if (!Array.isArray(arr1) || !Array.isArray(arr2))
		throw TypeError('引数は配列でなければなりません');
	if (arr1.length !== arr2.length) return false;
	else {
		for (let i = 0; i < arr1.length; i++) {
			if (arr1[i] !== arr2[i]) return false;
		}

		return true;
	}
};

/**
 * 冪剰余を計算する
 * @param base 底
 * @param power 指数
 * @param mod 法
 * @returns 冪剰余
 */
export const modPow = (base: bigint, power: bigint, mod: bigint) => {
	if (mod < 1n) throw Error('a modulo must be a positive');
	if (power < 0n) throw Error('a power must not be a negative');

	while (base < 0n) base += mod;
	if (mod === 1n) return 0n;
	if (base % mod === 1n || base % mod === 0n) return base;
	if (base === mod - 1n) return power & 1n ? mod - 1n : 1n;

	let result = 1n;
	while (power > 0n) {
		if (power & 1n) result = (result * base) % mod;
		base = (base * base) % mod;
		power >>= 1n;
		// console.log(base, power, mod);
	}
	return result;
};

/**
 * 拡張ユークリッドの互除法
 * 参考: https://qiita.com/angel_p_57/items/56a902cbd1fe519747bd
 *
 * @description `ax - by = gcd(a, b)`
 * @param a
 * @param b
 * @returns `{x, y, gcd(a, b)}`
 */
export const exEuclidean = (a: bigint, b: bigint) => {
	// a, b に 0 がある場合の処理
	if (a === 0n && b === 0n) return { x: 0n, y: 0n, gcd: 0n };
	if (a === 0n) return b > 0n ? { x: 0n, y: -1n, gcd: b } : { x: 0n, y: 1n, gcd: -b };
	if (b === 0n) return a > 0n ? { x: 1n, y: 0n, gcd: a } : { x: -1n, y: 0n, gcd: -a };

	let [x_1, y_1, c_1] = [1n, 0n, a],
		[x_2, y_2, c_2] = [0n, -1n, b];

	while (true) {
		const q = c_1 / c_2;
		const c_nxt = c_1 - q * c_2;

		if (c_nxt === 0n) break;

		[x_1, x_2] = [x_2, x_1 - q * x_2];
		[y_1, y_2] = [y_2, y_1 - q * y_2];
		[c_1, c_2] = [c_2, c_nxt];
	}

	// GCD が負の場合 -1 倍する
	if (c_2 < 0n) {
		x_2 *= -1n;
		y_2 *= -1n;
		c_2 *= -1n;
	}

	return { x: x_2, y: y_2, gcd: c_2 };
};

/**
 * Miller-Rabin 素数判定法 (n < 2^64 の場合決定的に判定)
 * @param n_ 判定したい整数
 */
export const millerRabin = (n_: bigint) => {
	if (typeof n_ !== 'bigint') throw TypeError('引数型は `bigint` でなければなりません');
	if (n_ < 0n) throw Error('引数は正の整数でなければなりません');
	const n = n_;

	if (n === 2n) return true;
	if (n === 1n || n % 2n === 0n) return false;

	const bit_num = n.toString(2).length;
	const s = BigInt((n - 1n).toString(2).match(/0+$/g)?.[0].length ?? 0);
	const d = (n - 1n) >> s;

	if (n < 2n ** 64n) {
		/** n が 2^64 未満の時、決定的に判定できる 参考: https://miller-rabin.appspot.com/#bases7 */
		const bases_under_64 = [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n] as const;

		challenge: for (const b_ of bases_under_64) {
			const base = b_ >= n ? b_ % n : b_;

			if (base === 0n) continue challenge;

			if (exEuclidean(base, n).gcd != 1n) return false;

			let y = modPow(base, d, n);

			if (y === 1n) continue challenge;

			for (let i = 0n; i < s; i++) {
				if (y === n - 1n) continue challenge;

				y = (y * y) % n;
			}
			return false;
		}
		return true;
	} else {
		/** 試行回数 */
		const max_rot = 40;

		challenge2: for (let i = 0; i < max_rot; i++) {
			let b_ = 0n;

			while (b_ < 2n || b_ >= n) {
				b_ = getRandBIByBitLength(bit_num);
			}

			if (exEuclidean(b_, n).gcd !== 1n) return false;

			const base = b_;

			let y = modPow(base, d, n);

			if (y === 1n) continue challenge2;

			for (let i = 0n; i < s; i++) {
				if (y === n - 1n) continue challenge2;
				y = (y * y) % n;
			}
			return false;
		}
		return true;
	}
};

/**
 * 階乗を計算する 参考: https://qiita.com/AkariLuminous/items/1b2e964ebabde9419224
 * @param n_ 整数
 * @returns 引数の階乗
 */
export const factorial = (n_: number) => {
	if (!Number.isFinite(n_)) throw Error(`not a number`);
	if (n_ < 0) throw Error(`number must be non-negative`);
	if (n_ === 0) return 1n;

	const n = BigInt(n_);

	/**
	 * min 以上 max 「未満」 の奇数の積を返す
	 * @param min 最小値
	 * @param max 最大値
	 * @returns min 以上 max 未満 の奇数の積
	 */
	const oddProd = (min: bigint, max: bigint): bigint => {
		if (min >= max) return 1n;

		const max_bits = BigInt((max - 2n).toString(2).length);
		const num_odds = (max - min) / 2n;

		if (max_bits * num_odds < 63n) {
			let result = min;
			for (let i = min + 2n; i < max; i += 2n) {
				result *= i;
			}
			return result;
		}

		const mid = (min + num_odds) | 1n;
		const lower = oddProd(min, mid);
		const higher = oddProd(mid, max);
		return lower * higher;
	};

	/**
	 * 階乗の奇数部分を計算する
	 * @param n 整数
	 * @returns 奇数部の積
	 */
	const oddPart = (n: bigint) => {
		let L_i = 3n,
			result = 1n,
			tmp = 1n;
		const m = BigInt(n.toString(2).length) - 1n;

		for (let i = m - 1n; i > -1n; i--) {
			const U_i = ((n >> i) + 1n) | 1n;

			tmp *= oddProd(L_i, U_i);
			L_i = U_i;
			result *= tmp;
		}

		return result;
	};

	const two_exp = n - BigInt(n.toString(2).match(/1/g)?.length ?? 0);
	const odd_part = oddPart(n);

	return odd_part << two_exp;
};

export const lazyExec = (delay = 2000) => {
	return new Promise<string>((resolve) => {
		setTimeout(() => {
			resolve(`resolved in ${delay} ms`);
		}, delay);
	});
};

/** 遅延評価関数化する */
export const lazify =
	<ArgT extends unknown[], RetT>(func: (...args: ArgT) => RetT) =>
	(...args: ArgT) =>
	() =>
		func(...args);

export const getRandIntFromDate = async () => {
	const today = new Date().toDateString();
	const utf8arr = Buffer.from(today, 'utf-8');
	const hashed = new Uint32Array(await crypto.subtle.digest('SHA-256', utf8arr), 0, 1);
	return hashed[0];
};

/**
 * 32ビット回転 (長整数)
 * @param value 値
 * @param rot 回転数
 * @returns
 */
export const rot32BI = (value: bigint, rot: bigint) => {
	return BigInt.asUintN(32, (value >> (rot & 31n)) | (value << (-rot & 31n)));
};

/**
 * 32ビット回転
 * @param value 値
 * @param rot 回転数
 * @returns
 */
export const rot32 = (value: number, rot: number) => {
	return (value >>> (rot & 31)) | (value << (-rot & 31));
};

/** by ChatGPT */
export const parseCSV = (csv: string) => {
	const rows: string[][] = [];
	let row: string[] = [];
	let currentField = '';
	let isInsideOfQuote = false;

	for (let i = 0; i < csv.length; i++) {
		const char = csv[i];

		if (char === '"' && (i === 0 || csv[i - 1] !== '\\')) {
			// ダブルクォート（not エスケープ）に入った/出た時にトグル
			isInsideOfQuote = !isInsideOfQuote;
		} else if (char === ',' && !isInsideOfQuote) {
			// クォート内でないコンマ
			row.push(currentField.trim()); // フィールドを列配列に追加
			currentField = ''; // クリア
		} else if (char === '\n' && !isInsideOfQuote) {
			// クォート内でない改行
			row.push(currentField.trim()); // フィールドを列配列に追加
			rows.push(row); // 列配列を2次元配列に追加
			row = []; // 列配列, フィールドをクリア
			currentField = '';
		} else {
			// フィールドに文字を追加
			currentField += char;
		}
	}

	// 最後のセルと行を追加
	row.push(currentField.trim());
	rows.push(row);

	return rows;
};

/**
 * 指定範囲内の確率的素数を返す (64ビット未満は確定的)
 * @param min 下限
 * @param max 上限
 * @returns
 */
export const getRandPrimeByRange = (min: bigint, max: bigint) => {
	if (max < 2n) {
		throw Error('noPrimesFound');
	}
	for (let count = 0; count < 100000; count++) {
		const p = getRandBIByRange(min, max);
		if (millerRabin(p)) return p;
	}

	throw Error('noPrimesFound');
};

export const getRandPrimeByBitLength = (bitLength: number) => {
	if (bitLength < 2) {
		throw Error('noPrimesFound');
	}
	for (let count = 0; count < 100000; count++) {
		const p = getRandBIByBitLength(bitLength, true);
		if (millerRabin(p)) return p;
	}

	throw Error('noPrimesFound');
};

type ResolveFunc<T> = (value: T | PromiseLike<T>) => void;
type RejectFunc = (error: unknown) => void;
export type PromiseCallback<T> = (resolve: ResolveFunc<T>, reject: RejectFunc) => void;

export const getHash = async function* (n: number) {
	for (let i = 0; i < n; i++) {
		const date = Date.now().toString(16);
		const a = Uint8Array.from(date.split(/.{2}/g), (s) => Number.parseInt(s, 16));
		yield Buffer.from(await crypto.subtle.digest('SHA-256', a)).toString('base64');
	}
};


