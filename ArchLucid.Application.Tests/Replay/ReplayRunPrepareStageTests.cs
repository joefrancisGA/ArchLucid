using ArchLucid.Application.Replay;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Replay;

[Trait("Category", "Unit")]
public sealed class ReplayRunPrepareStageTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_PrepareAsync_loads_evidence_package_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("30303030-3030-3030-3030-303030303030");
        string runId = runGuid.ToString("N");
        string legacyUpper = runId.ToUpperInvariant();
        string requestId = Guid.NewGuid().ToString("D");

        Mock<IReRunExecuteSealedManifestPinGate> pinGate = new();
        pinGate
            .Setup(gate => gate.EnsureReadyAsync(runId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunDetailQueryService> runDetail = new();
        runDetail
            .Setup(service => service.GetRunDetailAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = runId, RequestId = requestId },
                Tasks = [],
                AuthorityPipelineComplete = true,
            });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repository => repository.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { RequestId = requestId });

        InMemoryAgentEvidencePackageRepository evidence = new();
        await evidence.CreateAsync(
            new AgentEvidencePackage
            {
                EvidencePackageId = "pkg-legacy-replay-prepare",
                RunId = legacyUpper,
                SystemName = "legacy-keyed",
            },
            CancellationToken.None);

        Mock<IRunRepository> authorityRuns = new();
        authorityRuns
            .Setup(repository => repository.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
            });
        authorityRuns
            .Setup(repository => repository.SaveAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IRunPolicyPackPinService> policyPins = new();
        policyPins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                TestScope,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunEvidencePackagePinService> evidencePins = new();
        evidencePins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                TestScope,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ReplayRunPrepareStage sut = new(
            runDetail.Object,
            requests.Object,
            evidence,
            authorityRuns.Object,
            scopeProvider.Object,
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IRunStageOutcomesRepository>(),
            policyPins.Object,
            evidencePins.Object,
            new ReplayRunCloneStage(),
            pinGate.Object);

        string replayRunId = await sut.PrepareAsync(runId, CancellationToken.None);

        replayRunId.Should().NotBeNullOrWhiteSpace();
        Guid.Parse(replayRunId).Should().NotBe(Guid.Empty);
    }
}
