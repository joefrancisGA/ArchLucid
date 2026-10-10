using ArchLucid.Application.Exports;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Application.Tests.Roi;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

internal static class FirstValueReportBuilderTestDoubles
{
    internal static RoiCostEvidenceCollectionResolver CreateDefaultCostEvidenceResolver()
    {
        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();

        return RoiCostEvidenceCollectionResolverTestSupport.Create(azureRepository.Object, cloudRepository.Object);
    }

    internal static IOptions<RoiCostEvidenceFreshnessOptions> CreateDefaultFreshnessOptions() =>
        Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 });

    internal static IGraphSnapshotRepository CreateGraphSnapshotRepository() =>
        Mock.Of<IGraphSnapshotRepository>();

    internal static IConfiguration CreateCareerExportReadyConfiguration() =>
        SealedExportReceiptTestSupport.CreateSuccessfulExportHonestyConfiguration();

    internal static IManifestHashService CreateCareerExportReadyManifestHash() =>
        SealedManifestHashTestSupport.CreateManifestHashService();

    internal static IAgentExecutionTraceRepository CreateEmptyTraceRepository()
    {
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return traces.Object;
    }

    internal static IAuthorityQueryService CreateCareerExportReadyAuthorityQuery()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(service => service.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) => CreateSealedRunDetail(runId));
        authority
            .Setup(service => service.GetRunDetailForExportAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) => CreateSealedRunDetail(runId));
        authority
            .Setup(service => service.GetRunDetailAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<bool>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _, bool _) => CreateSealedRunDetail(runId));

        return authority.Object;
    }

    private static RunDetailDto CreateSealedRunDetail(Guid runId)
    {
        IManifestHashService manifestHash = CreateCareerExportReadyManifestHash();
        Guid manifestId = Guid.NewGuid();
        FeasibilityVerdict verdict = new()
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
        ManifestDocument manifest = new()
        {
            ManifestId = manifestId,
            RunId = runId,
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            RuleSetId = "default",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            ManifestHash = SealedManifestHashTestSupport.DefaultHash,
            Metadata = new ManifestMetadata { Version = "v1" },
            FeasibilityVerdict = verdict,
        };
        string hashBeforeReceipt = ManifestDecisionReceiptExportBinder.ComputeHashBeforeReceipt(manifest, manifestHash);
        DecisionReceiptDocument sealedReceipt = DecisionReceiptComposer.BuildForRun(
            runId,
            verdict,
            hashBeforeReceipt,
            "v1");
        manifest.CommittedDecisionReceiptHashSha256 = sealedReceipt.ReceiptHashSha256;
        manifest.ManifestHash = manifestHash.ComputeHash(manifest);

        return new RunDetailDto
        {
            Run = new RunRecord
            {
                RunId = runId,
                GoldenManifestId = manifestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            },
            GoldenManifest = manifest,
            FindingCoverageSummary = new RunFindingCoverageSummary { EnginesSucceeded = 50 },
        };
    }
}
