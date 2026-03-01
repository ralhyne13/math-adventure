export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

export function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

export function simplify(n, d) {
  const g = gcd(n, d);
  return [n / g, d / g];
}

export function cmpFractions(aN, aD, bN, bD) {
  const left = aN * bD;
  const right = bN * aD;
  if (left > right) return ">";
  if (left < right) return "<";
  return "=";
}
