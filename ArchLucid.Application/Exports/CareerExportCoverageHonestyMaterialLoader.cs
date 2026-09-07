using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Exports;

/// <summary>Loads career export honesty inputs from committed run detail (PC-13 / CD-15 parity with UI).</summary>
public static class CareerExportCoverageHonestyMaterialLoader
{
    public static async Task<CareerExportCoverageHonestyInput> LoadAsync(
        ArchitectureRunDetail detail,
        IAuthorityQueryService authorityQueryService,
        IGraphSnapshotRepository graphSnapshotRepository,
        IAgentExecutionTraceRepository agentExecutionTraceRepository,
        ScopeContext scope,
        bool workingDesk,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(agentExecutionTraceRepository);

        bool preCommitGateEnabled = configuration
            .GetSection(PreCommitGovernanceGateOptions.SectionPath)
            .GetValue<bool>(nameof(PreCommitGovernanceGateOptions.PreCommitGateEnabled));
        AgentOutputQualityGateMode hostQualityGateMode = CareerExportQualityGateHonestyResolver.ResolveHostMode(configuration);
        string? hostAgentExecutionMode = CareerExportQualityGateHonestyResolver.ResolveHostAgentExecutionMode(configuration);

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
        int catalogAdvisoryEngineFailureCount = 0;
        bool isSampleRun = false;
        AgentOutputQualityGateMode? recordedQualityGateMode = null;
        AgentOutputQualityGateOutcome? aggregateQualityGateOutcome = null;

        if (Guid.TryParse(detail.Run.RunId.Trim(), out Guid runGuid))
        {
            RunDetailDto? exportDetail = await authorityQueryService
                .GetRunDetailForExportAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

            enginesSucceeded = exportDetail?.FindingCoverageSummary?.EnginesSucceeded;
            classificationCounts = CountClassificationBands(exportDetail?.FindingsSnapshot);
            catalogAdvisoryEngineFailureCount = FindingsSnapshotWithheldAdvisoryEngineFailuresApplicator
                .CountCatalogAdvisoryFailures(exportDetail?.FindingsSnapshot?.EngineFailures ?? []);
            isSampleRun = exportDetail?.Run.IsSample ?? false;

            IReadOnlyList<AgentExecutionTrace> traces = await agentExecutionTraceRepository
                .GetByRunIdAsync(scope, detail.Run.RunId.Trim(), cancellationToken)
                .ConfigureAwait(false);
            recordedQualityGateMode = CareerExportQualityGateHonestyResolver.ResolveRecordedGateMode(traces);
            aggregateQualityGateOutcome = CareerExportQualityGateHonestyResolver.ResolveAggregateOutcome(traces);
        }

        return new CareerExportCoverageHonestyInput(
            coverageContext,
            enginesSucceeded,
            workingDesk,
            classificationCounts,
            catalogAdvisoryEngineFailureCount,
            preCommitGateEnabled,
            detail.Run.StructuralExecutionMode,
            isSampleRun,
            hostAgentExecutionMode,
            hostQualityGateMode,
            recordedQualityGateMode,
            aggregateQualityGateOutcome);
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
