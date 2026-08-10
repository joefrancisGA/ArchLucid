export function truncateMiddle(text: string, maxLength: number): string {
  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  if (maxLength < 4) {
    return `${trimmed.slice(0, maxLength)}…`;
  }

  const headLength = Math.ceil((maxLength - 1) / 2);
  const tailLength = Math.floor((maxLength - 1) / 2);

  return `${trimmed.slice(0, headLength)}…${trimmed.slice(trimmed.length - tailLength)}`;
}
