const TOKEN = /^[a-f0-9]{48}$/;

export function createToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function isValidToken(token: string) {
  return TOKEN.test(token);
}
