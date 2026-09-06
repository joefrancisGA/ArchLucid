using ArchLucid.Application.Pilots;

namespace ArchLucid.Application.Exports;

/// <summary>Inputs for the shared career export honesty block (PC-01 measurement floor + CD-15 coverage honesty).</summary>
public sealed record CareerExportCoverageHonestyInput(
    SponsorReviewCoverageHonestyContext CoverageContext,
    int? EnginesSucceeded,
    bool WorkingDesk,
    CareerExportClassificationCounts? ClassificationCounts,
    int CatalogAdvisoryEngineFailureCount = 0);
