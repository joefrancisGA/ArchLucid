using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Exports;

/// <summary>Loads career export honesty inputs from committed run detail (PC-13 / CD-15 parity with UI).</summary>
public static class CareerExportCoverageHonestyMaterialLoader
{
    public static async Task<CareerExportCoverageHonestyInput> LoadAsync(
        ArchitectureRunDetail detail,
        IAuthorityQueryService authorityQueryService,
        IGraphSnapshotRepository graphSnapshotRepository,
        ScopeContext scope,
        bool workingDesk,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(graphSnapshotRepository);
        ArgumentNullException.ThrowIfNull(scope);

        SponsorReviewCoverageHonestyContext coverageContext = await SponsorReviewCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            authorityQueryService,
            graphSnapshotRepository,
            scope,
            cancellationToken);

        int? enginesSucceeded = null;
        CareerExportClassificationCounts? classificationCounts = null;

        if (Guid.TryParse(detail.Run.RunId.Trim(), out Guid runGuid))
        {
            RunDetailDto? exportDetail = await authorityQueryService
                .GetRunDetailForExportAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

            enginesSucceeded = exportDetail?.FindingCoverageSummary?.EnginesSucceeded;
            classificationCounts = CountClassificationBands(exportDetail?.FindingsSnapshot);
        }

        return new CareerExportCoverageHonestyInput(
            coverageContext,
            enginesSucceeded,
            workingDesk,
            classificationCounts);
    }

    internal static CareerExportClassificationCounts? CountClassificationBands(FindingsSnapshot? findingsSnapshot)
    {
        if (findingsSnapshot?.Findings is not { Count: > 0 } findings)
        {
            return null;
        }

        int decisionGrade = 0;
        int checklist = 0;

        foreach (Finding finding in findings)
        {
            if (finding is null)
            {
                continue;
            }

            if (finding.Classification == FindingClassification.ChecklistCoverage)
            {
                checklist++;
            }
            else
            {
                decisionGrade++;
            }
        }

        if (decisionGrade + checklist == 0)
        {
            return null;
        }

        return new CareerExportClassificationCounts(decisionGrade, checklist);
    }
}
