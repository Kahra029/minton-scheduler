import { monotonicFactory } from 'ulid';

/**
 * ULID 生成器。
 *
 * ulid パッケージの既定 PRNG は Node の crypto.randomBytes を使おうとするが、
 * Cloudflare Workers には存在しないため (TypeError: nodeCrypto.randomBytes is not a function)、
 * Web Crypto (crypto.getRandomValues) を使う PRNG を明示的に渡す。
 * monotonicFactory により同一ミリ秒内でも単調増加する ID を生成する。
 */
const prng = (): number => {
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0xff;
};

export const ulid = monotonicFactory(prng);
