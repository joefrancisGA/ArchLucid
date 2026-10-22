export function presentComplianceDriftChangeCount(value: unknown): {
  readonly known: boolean;
  readonly display: string;
  readonly numeric: number;
} {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { known: false, display: "Not returned", numeric: 0 };
  }

  const numeric = Math.max(0, Math.floor(value));

  return { known: true, display: String(numeric), numeric };
}
