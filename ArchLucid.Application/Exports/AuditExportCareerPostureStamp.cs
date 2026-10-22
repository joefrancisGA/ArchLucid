namespace ArchLucid.Application.Exports;

/// <summary>CG-026 — execute posture stamped on run-scoped audit CSV exports (export overlay; audit rows stay immutable).</summary>
public sealed record AuditExportCareerPostureStamp(
    string StructuralExecutionMode,
    string WorkingCareerRehearsalDoor,
    bool RehearsalIncomplete);
