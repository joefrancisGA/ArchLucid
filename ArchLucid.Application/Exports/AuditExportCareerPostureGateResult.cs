namespace ArchLucid.Application.Exports;

/// <summary>Outcome of CG-026 run-scoped audit CSV posture resolution.</summary>
public sealed record AuditExportCareerPostureGateResult(
    bool IsBlocked,
    string? BlockReasonCode,
    string? BlockReason,
    AuditExportCareerPostureStamp? Stamp);
