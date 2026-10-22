/**
 * Removes server stack traces and exception dumps from text shown to operators.
 * Technical API validation messages are kept; .NET `at …` frames are not.
 */
export function sanitizeOperatorFacingText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  const lines = trimmed.split(/\r?\n/u);
  const kept: string[] = [];
  let skippingStack = false;

  for (const line of lines) {
    const stackLine = /^\s*at\s+/u.test(line);
    const stackDelimiter = /^\s*---\s/u.test(line);
    const stackHeader = /stack trace:/iu.test(line);

    if (stackHeader || stackLine || stackDelimiter) {
      skippingStack = true;

      continue;
    }

    if (skippingStack && line.trim().length === 0) {
      continue;
    }

    skippingStack = false;
    kept.push(line);
  }

  let result = kept.join("\n").trim();

  const typedException = /^([A-Za-z0-9_.]+Exception):\s*([\s\S]+)/u.exec(result);

  if (typedException !== null) {
    const messageOnly = typedException[2].split("\n")[0]?.trim() ?? "";

    if (messageOnly.length > 0) {
      result = messageOnly;
    }
  }

  if (result.length > 2000) {
    return `${result.slice(0, 1997)}…`;
  }

  return result;
}
