namespace ArchLucid.Application.Exports;

/// <summary>CG-027 — fail-closed gate result for CLI export bundles.</summary>
public sealed record ExportBundleCareerPostureResult(
    bool IsBlocked,
    string? BlockReason,
    ExportBundleCareerPostureStamp? Stamp);
