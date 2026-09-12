namespace ArchLucid.Application.Exports;

/// <summary>CG-092 — execute posture summary for support-bundle triage indexes (identifiers only).</summary>
public sealed record ExportBundleCareerPostureTriageResult(
    string WorkingCareerRehearsalDoor,
    string CareerPostureLabel,
    bool RehearsalIncomplete,
    bool CareerBlocked);
