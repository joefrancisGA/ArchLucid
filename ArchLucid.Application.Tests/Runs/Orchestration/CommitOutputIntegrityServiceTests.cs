using ArchLucid.Application;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;
using FluentAssertions.Specialized;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class CommitOutputIntegrityServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_EnsurePassOrThrowAsync_merges_traces_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("20202020-2020-2020-2020-202020202020");
        string runId = runGuid.ToString("N");
        string legacyUpper = runId.ToUpperInvariant();

        ArchitectureRun run = new()
        {
            RunId = runId,
            StructuralExecutionMode = StructuralExecutionMode.Real,
            GoldenManifestId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetByRunIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        traces
            .Setup(repository => repository.GetByRunIdAsync(TestScope, legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTrace
                {
                    TraceId = "trace-legacy-commit-integrity",
                    RunId = legacyUpper,
                    AgentType = AgentType.Topology,
                    TaskId = "task-topology",
                    RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
                },
            ]);
        traces
            .Setup(repository => repository.GetByRunIdAsync(
                TestScope,
                It.Is<string>(id => id != runId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentOutputQualityGateOptionsResolver> qualityResolver = new();
        qualityResolver
            .Setup(resolver => resolver.Resolve(It.IsAny<CancellationToken>()))
            .Returns(new AgentOutputQualityGateOptions
            {
                Enabled = true,
                Mode = AgentOutputQualityGateMode.PilotStrict,
            });

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                FindingsSnapshotId = Guid.NewGuid(),
            });

        Mock<IRunStageOutcomesRepository> stageOutcomes = new();
        stageOutcomes
            .Setup(repository => repository.ListByRunIdAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(SucceededAuthorityStages());

        Mock<IRunPolicyPackPinService> policyPins = new();
        Mock<IRunEvidencePackagePinService> evidencePins = new();
        Mock<IDraftRequestRepository> drafts = new();
        Mock<IArchitectureKnowledgeModelAccess> knowledgeModel = new();
        Mock<IArchitectureVersionRepository> architectureVersions = new();

        Mock<IFinalizeQualityGate> finalizeGate = new();
        finalizeGate
            .Setup(gate => gate.EnsurePassOrThrowAsync(
                TestScope,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunAssumptionAcknowledgementService> assumptionAcks = new();
        assumptionAcks
            .Setup(service => service.GetAcknowledgedIdsAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<string>(StringComparer.Ordinal));

        Mock<IFindingSemanticSupportBandFinalizeJudge> semanticJudge = new();
        semanticJudge
            .Setup(judge => judge.ApplyAsync(
                It.IsAny<ArchitectureRun>(),
                It.IsAny<FindingsSnapshot>(),
                TestScope,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        CommitOutputIntegrityService sut = new(
            scopeProvider.Object,
            traces.Object,
            qualityResolver.Object,
            runRepository.Object,
            stageOutcomes.Object,
            policyPins.Object,
            evidencePins.Object,
            knowledgeModel.Object,
            drafts.Object,
            architectureVersions.Object,
            finalizeGate.Object,
            assumptionAcks.Object,
            semanticJudge.Object);

        FindingsSnapshot findings = new() { Findings = [], GenerationStatus = FindingsSnapshotGenerationStatus.Complete };
        ArchitectureRequest request = new() { RequestId = Guid.NewGuid().ToString("D") };

        Func<Task> act = () => sut.EnsurePassOrThrowAsync(
            run,
            runId,
            findings,
            request,
            acknowledgedAssumptionIds: null,
            CancellationToken.None);

        ExceptionAssertions<ConflictException> thrown = await act.Should().ThrowAsync<ConflictException>();
        thrown.Which.Message.Should().NotContain(
            "no agent execution traces",
            because: "legacy-key traces must satisfy Real PilotStrict quality evaluation before later commit gates");
        thrown.Which.Message.Should().Contain("ArchitectureVersionId");
    }

    private static IReadOnlyList<StageTimelineSummary> SucceededAuthorityStages()
    {
        DateTime started = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        return AuthorityPipelineStageNames.Sequence
            .Select(name => StageTimelineSummary.FromRow(
                name,
                started,
                started.AddMinutes(1),
                AuthorityPipelineStageNames.SucceededOutcomeStatus))
            .ToList();
    }
}
