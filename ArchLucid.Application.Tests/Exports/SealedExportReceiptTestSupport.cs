using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

/// <summary>
///     Configures authority/manifest-hash doubles so export paths pass sealed receipt verification.
/// </summary>
internal static class SealedExportReceiptTestSupport
{
    internal static ArchLucid.Persistence.Data.Repositories.IAgentExecutionTraceRepository CreateEmptyAgentExecutionTraceRepository()
    {
        Mock<ArchLucid.Persistence.Data.Repositories.IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(r => r.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArchLucid.Contracts.Agents.AgentExecutionTrace>());

        return traces.Object;
    }

    internal static IConfiguration CreateCareerExportHonestyConfiguration()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            [$"{PreCommitGovernanceGateOptions.SectionPath}:{nameof(PreCommitGovernanceGateOptions.PreCommitGateEnabled)}"] = "false",
            [$"{AgentOutputQualityGateOptions.SectionPath}:{nameof(AgentOutputQualityGateOptions.Mode)}"] =
                AgentOutputQualityGateMode.WarnOnly.ToString(),
            ["AgentExecution:Mode"] = "Simulator",
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    internal static IAuthorityQueryService CreateAuthorityQueryService(Guid runId, IManifestHashService manifestHashService)
    {
        Mock<IAuthorityQueryService> authority = new();
        ConfigureVerifiedSealedExport(authority, runId, manifestHashService);

        return authority.Object;
    }

    internal static ManifestDocument ConfigureVerifiedSealedExport(
        Mock<IAuthorityQueryService> authority,
        Guid runId,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(authority);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        FeasibilityVerdict verdict = CreateExportFeasibilityVerdict();

        ManifestDocument manifest = new()
        {
            ManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RunId = runId,
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            RuleSetId = "default",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            ManifestHash = "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789",
            Metadata = new ManifestMetadata { Version = "v1" },
            FeasibilityVerdict = verdict,
        };

        string hashBeforeReceipt = ManifestDecisionReceiptExportBinder.ComputeHashBeforeReceipt(manifest, manifestHashService);
        DecisionReceiptDocument sealedReceipt = DecisionReceiptComposer.BuildForRun(
            runId,
            verdict,
            hashBeforeReceipt,
            "v1");
        manifest.CommittedDecisionReceiptHashSha256 = sealedReceipt.ReceiptHashSha256;
        manifest.ManifestHash = manifestHashService.ComputeHash(manifest);

        RunDetailDto runDetail = new()
        {
            Run = new RunRecord { RunId = runId },
            GoldenManifest = manifest,
        };

        authority
            .Setup(static s => s.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid requestedRunId, CancellationToken _) =>
                requestedRunId == runId
                    ? runDetail
                    : null);

        authority
            .Setup(static s => s.GetRunDetailForExportAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid requestedRunId, CancellationToken _) =>
                requestedRunId == runId
                    ? new RunDetailDto
                    {
                        Run = new RunRecord { RunId = runId },
                        GoldenManifest = manifest,
                        FindingCoverageSummary = new RunFindingCoverageSummary { EnginesSucceeded = 50 },
                    }
                    : null);

        return manifest;
    }

    internal static void ConfigureSampleRunExportDetail(
        Mock<IAuthorityQueryService> authority,
        Guid runId,
        ManifestDocument goldenManifest)
    {
        ArgumentNullException.ThrowIfNull(authority);
        ArgumentNullException.ThrowIfNull(goldenManifest);

        authority
            .Setup(static s => s.GetRunDetailForExportAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid requestedRunId, CancellationToken _) =>
                requestedRunId == runId
                    ? new RunDetailDto
                    {
                        Run = new RunRecord { RunId = runId, IsSample = true },
                        GoldenManifest = goldenManifest,
                        FindingCoverageSummary = new RunFindingCoverageSummary { EnginesSucceeded = 50 },
                    }
                    : null);
    }

    private static FeasibilityVerdict CreateExportFeasibilityVerdict()
    {
        return new FeasibilityVerdict
        {
            Kind = FeasibilityVerdictKind.Feasible,
            Summary = "Architecture satisfies policy controls.",
            TransparencyTrail = new TransparencyTrail
            {
                Asserted =
                [
                    new AssertedTrailEntry { Key = "businessOutcome", Value = "Reduce triage time" },
                ],
                Inferred = [],
                Skipped = [],
            },
        };
    }

    internal static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        runGuid = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runId))
            return false;

        if (Guid.TryParse(runId, out runGuid))
            return true;

        if (runId.Length >= 32 && Guid.TryParseExact(runId[..32], "N", out runGuid))
            return true;

        return false;
    }
}
