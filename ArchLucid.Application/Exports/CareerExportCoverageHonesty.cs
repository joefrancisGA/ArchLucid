using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Exports;

/// <summary>Resolved career export honesty for sponsor PDF, consulting DOCX, and packet exports (PC-13).</summary>
public sealed record CareerExportCoverageHonesty(
    InsightDensityMeasurementFloorPresentation MeasurementFloor,
    string? MeasurementFloorBlockedReason,
    string SponsorHonestyMarkdown,
    bool BlockedForWorkingCareerExport);
