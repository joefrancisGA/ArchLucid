using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Api.Tests;

internal static class DocxExportControllerTestSupport
{
    internal static ManifestDocument CreateSealedExportManifest(
        Guid runId,
        Guid manifestId,
        FeasibilityVerdict verdict,
        IManifestHashService manifestHashService)
    {
        ManifestDocument manifest = new()
        {
            ManifestId = manifestId,
            RunId = runId,
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "h",
            Metadata = new ManifestMetadata { Version = "v12" },
            FeasibilityVerdict = verdict,
        };

        string hashBeforeReceipt = ManifestDecisionReceiptExportBinder.ComputeHashBeforeReceipt(manifest, manifestHashService);
        DecisionReceiptDocument receipt = DecisionReceiptComposer.BuildForRun(
            runId,
            verdict,
            hashBeforeReceipt,
            "v12");
        manifest.CommittedDecisionReceiptHashSha256 = receipt.ReceiptHashSha256;
        manifest.ManifestHash = manifestHashService.ComputeHash(manifest);

        return manifest;
    }

    internal static FeasibilityVerdict CreateFeasibilityVerdictWithTrail()
    {
        return new FeasibilityVerdict
        {
            Kind = FeasibilityVerdictKind.Feasible,
            Summary = "Feasible for export test.",
            TransparencyTrail = new TransparencyTrail
            {
                Asserted = [new AssertedTrailEntry { Key = "businessOutcome", Value = "Reduce triage time" }],
                Inferred = [],
                Skipped = [],
            },
        };
    }

    internal static FeasibilityVerdict CreateFeasibilityVerdictWithoutTrail()
    {
        return new FeasibilityVerdict
        {
            Kind = FeasibilityVerdictKind.Feasible,
            Summary = "Feasible for export test.",
        };
    }

    internal static void SetupAuthorityForDocxExport(
        Mock<IAuthorityQueryService> authority,
        Guid runId,
        ManifestDocument sealedManifest,
        int? enginesSucceeded = null)
    {
        RunDetailDto runDetail = new()
        {
            Run = new RunRecord { RunId = runId },
            GoldenManifest = sealedManifest,
        };

        RunDetailDto exportDetail = new()
        {
            Run = new RunRecord { RunId = runId },
            GoldenManifest = sealedManifest,
            FindingCoverageSummary = enginesSucceeded is null
                ? null
                : new RunFindingCoverageSummary { EnginesSucceeded = enginesSucceeded.Value },
        };

        authority
            .Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);
        authority
            .Setup(a => a.GetRunDetailForExportAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(exportDetail);
        authority
            .Setup(a => a.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runDetail);
    }

    internal static IAgentExecutionTraceRepository CreateAgentExecutionTraceRepository()
    {
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<AgentExecutionTrace>());

        return traces.Object;
    }
}
