/** Guests on the three rings around gelin and damat: 8 + 12 + 16. */
export const GUEST_CAP = 36;

export function cleanName(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
}

/**
 * True when a comment contains "katıl" or "katil".
 * Matching is case-insensitive and the token may sit inside a longer comment.
 * Turkish casing: I → ı, İ → i.
 */
export function commentJoins(comment) {
  if (typeof comment !== 'string') return false;
  const folded = comment.toLocaleLowerCase('tr-TR');
  return folded.includes('katıl') || folded.includes('katil');
}
