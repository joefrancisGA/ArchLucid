using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

using Cm = ArchLucid.Contracts.Manifest;
using DecisionManifestMetadata = ArchLucid.Core.Manifest.Sections.ManifestMetadata;
using DecisionTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.DecisionTraceDto;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Commit;

[Trait("Category", "Unit")]
public sealed class AuthorityCommitDecisionMaterializationStageLegacyRunIdTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_MaterializeAsync_merges_evidence_and_agent_results_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("51515151-5151-5151-5151-515151515151");
        string runId = runGuid.ToString("N");
        string legacyUpper = runId.ToUpperInvariant();
        Guid contextSnapshotId = Guid.Parse("61616161-6161-6161-6161-616161616161");
        Guid graphId = Guid.Parse("71717171-7171-7171-7171-717171717171");
        Guid findingsId = Guid.Parse("81818181-8181-8181-8181-818181818181");
        Guid decisionTraceId = Guid.Parse("91919191-9191-9191-9191-919191919191");

        AgentEvidencePackage legacyEvidence = new()
        {
            EvidencePackageId = Guid.NewGuid().ToString("N"),
            RunId = legacyUpper,
            CreatedUtc = DateTime.UtcNow,
        };

        List<AgentResult> legacyResults =
        [
            new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                RunId = legacyUpper,
                TaskId = Guid.NewGuid().ToString("N"),
                AgentType = AgentType.Topology,
                CreatedUtc = DateTime.UtcNow,
            },
        ];

        Mock<IAgentEvidencePackageRepository> evidenceRepository = new();
        evidenceRepository
            .Setup(repository => repository.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);
        evidenceRepository
            .Setup(repository => repository.GetByRunIdAsync(legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyEvidence);
        evidenceRepository
            .Setup(repository => repository.GetByRunIdAsync(
                It.Is<string>(id => id != runId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((AgentEvidencePackage?)null);

        Mock<IAgentResultRepository> agentResults = new();
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(TestScope, legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyResults);
        agentResults
            .Setup(repository => repository.GetByRunIdAsync(
                TestScope,
                It.Is<string>(id => id != runId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IGraphSnapshotRepository> graphs = new();
        graphs
            .Setup(repository => repository.GetByIdAsync(TestScope, graphId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GraphSnapshot { GraphSnapshotId = graphId });

        Mock<IFindingsSnapshotRepository> findings = new();
        findings
            .Setup(repository => repository.GetByIdAsync(TestScope, findingsId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingsSnapshot { FindingsSnapshotId = findingsId });

        ManifestDocument manifestModel = new()
        {
            RunId = runGuid,
            ManifestId = Guid.NewGuid(),
            DecisionTraceId = decisionTraceId,
            Metadata = new DecisionManifestMetadata { Version = "1.0.0" },
        };

        RuleAuditTrace trace = RuleAuditTrace.From(new RuleAuditTracePayload
        {
            RunId = runGuid,
            DecisionTraceId = decisionTraceId,
        });
        DecisionTraceDto traceDto = DecisionTraceRecordMapper.ToDto(trace);
        string traceIdN = decisionTraceId.ToString("N");

        Mock<ICommitPipelineManifestReuseService> reuse = new();
        reuse
            .Setup(service => service.TryReusePipelineManifestAsync(
                It.IsAny<ArchitectureRun>(),
                runGuid,
                contextSnapshotId,
                It.IsAny<GraphSnapshot>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<FindingsSnapshot>(),
                TestScope,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitPipelineManifestReuseResult(manifestModel, traceDto));

        Mock<IAuthorityCommitProjectionBuilder> projection = new();
        projection
            .Setup(builder => builder.BuildAsync(
                manifestModel,
                It.IsAny<AuthorityCommitProjectionInput>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Cm.GoldenManifest
            {
                RunId = runId,
                SystemName = "Alpha",
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = "v1.0.0",
                    DecisionTraceIds = [traceIdN],
                },
            });

        Mock<ICommitOutputIntegrityService> integrity = new();
        integrity
            .Setup(service => service.EnsurePassOrThrowAsync(
                It.IsAny<ArchitectureRun>(),
                runId,
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<IReadOnlyList<string>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityCommitDecisionMaterializationStage sut = new(
            evidenceRepository.Object,
            graphs.Object,
            agentResults.Object,
            findings.Object,
            Mock.Of<IPolicyPackAssignmentRepository>(),
            reuse.Object,
            Mock.Of<IDecisionEngine>(),
            projection.Object,
            integrity.Object,
            Mock.Of<IGraphMergeRuntimeInvariantReporter>());

        RunRecord runRecord = new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphId,
            FindingsSnapshotId = findingsId,
            PinnedPolicyPackIdsJson = "[]",
        };

        ArchitectureRun run = new()
        {
            RunId = runId,
            RequestId = "req-materialize-legacy",
            Status = ArchitectureRunStatus.ReadyForCommit,
        };

        AuthorityCommitDecisionMaterializationResult result = await sut.MaterializeAsync(
            run,
            runGuid,
            runRecord,
            new ArchitectureRequest { RequestId = "req-materialize-legacy", SystemName = "Alpha" },
            TestScope,
            commitOptions: null,
            CancellationToken.None);

        result.EvidencePackageForTelemetry.EvidencePackageId.Should().Be(legacyEvidence.EvidencePackageId);
        result.AgentResultsForTelemetry.Should().ContainSingle(r => r.AgentType == AgentType.Topology);
    }
}
