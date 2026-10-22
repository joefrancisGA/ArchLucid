/**
 * Structural diff for policy pack content JSON (small documents; no external diff engine).
 */

export type PolicyPackDiffItem = {
  path: string;
  changeType: "added" | "removed" | "changed";
  leftValue?: string;
  rightValue?: string;
};

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function valueToString(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  return JSON.stringify(value, null, 2);
}

function displayPath(path: string): string {
  if (path === "") {
    return "(root)";
  }

  return path;
}

function diffValues(path: string, left: unknown, right: unknown, out: PolicyPackDiffItem[]): void {
  if (left === undefined && right === undefined) {
    return;
  }

  if (left === undefined) {
    out.push({
      path: displayPath(path),
      changeType: "added",
      rightValue: valueToString(right),
    });

    return;
  }

  if (right === undefined) {
    out.push({
      path: displayPath(path),
      changeType: "removed",
      leftValue: valueToString(left),
    });

    return;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length);

    for (let i = 0; i < max; i++) {
      const segment = path === "" ? String(i) : `${path}.${i}`;
      diffValues(segment, left[i], right[i], out);
    }

    return;
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    const sorted = [...keys].sort((a, b) => a.localeCompare(b));

    for (const key of sorted) {
      const segment = path === "" ? key : `${path}.${key}`;
      diffValues(segment, left[key], right[key], out);
    }

    return;
  }

  if (JSON.stringify(left) === JSON.stringify(right)) {
    return;
  }

  out.push({
    path: displayPath(path),
    changeType: "changed",
    leftValue: valueToString(left),
    rightValue: valueToString(right),
  });
}

/**
 * Parses two JSON strings and returns a flat list of path-level changes (dot-separated keys, numeric segments for arrays).
 */
export function diffPolicyPackContent(leftJson: string, rightJson: string): PolicyPackDiffItem[] {
  const left = JSON.parse(leftJson.length === 0 ? "null" : leftJson) as unknown;
  const right = JSON.parse(rightJson.length === 0 ? "null" : rightJson) as unknown;
  const out: PolicyPackDiffItem[] = [];

  diffValues("", left, right, out);

  return out.sort((a, b) => a.path.localeCompare(b.path));
}
