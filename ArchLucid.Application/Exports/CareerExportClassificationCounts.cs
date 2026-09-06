namespace ArchLucid.Application.Exports;

/// <summary>Decision-grade vs checklist finding band counts for career export honesty (ADR 0070 / PC-13).</summary>
public sealed record CareerExportClassificationCounts(int DecisionGrade, int Checklist);
