using ArchLucid.Application.Replay;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

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

    [Theory]
    [InlineData(null)]
    [InlineData("pins")]
    [InlineData("tasks")]
    public async Task PrepareAsync_loads_legacy_evidence_and_closes_failed_preparation(string? failureStep)
    {
        Guid runGuid = Guid.Parse("30303030-3030-3030-3030-303030303030");
        string runId = runGuid.ToString("N");
        string legacyUpper = runId.ToUpperInvariant();
        string requestId = Guid.NewGuid().ToString("D");
        using CancellationTokenSource cancel = new();
        CancellationToken cancellationToken = cancel.Token;
        ConflictException pinFailure = new("Policy pin drifted.");
        OperationCanceledException taskFailure = new(cancellationToken);

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
                Tasks = failureStep == "tasks" ? [new AgentTask { RunId = runId }] : [],
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
        RunRecord? saved = null;
        authorityRuns
            .Setup(repository => repository.GetByIdAsync(TestScope, It.Is<Guid>(id => id != runGuid), CancellationToken.None))
            .ReturnsAsync((ScopeContext _, Guid id, CancellationToken _) => saved?.RunId == id ? saved : null);
        authorityRuns
            .Setup(repository => repository.SaveAsync(It.IsAny<RunRecord>(), cancellationToken, null, null))
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (run, _, _, _) => saved = run)
            .Returns(Task.CompletedTask);

        Mock<IAgentTaskRepository> taskRepository = new();
        if (failureStep == "tasks")
        {
            taskRepository
                .Setup(repository => repository.CreateManyAsync(It.IsAny<IEnumerable<AgentTask>>(), cancellationToken, null, null))
                .Returns(() =>
                {
                    cancel.Cancel();
                    return Task.FromException(taskFailure);
                });
        }

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IRunPolicyPackPinService> policyPins = new();
        policyPins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                TestScope,
                It.IsAny<CancellationToken>()))
            .Returns(failureStep == "pins" ? Task.FromException(pinFailure) : Task.CompletedTask);

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
            taskRepository.Object,
            Mock.Of<IRunStageOutcomesRepository>(),
            policyPins.Object,
            evidencePins.Object,
            new ReplayRunCloneStage(),
            pinGate.Object,
            NullLogger<ReplayRunPrepareStage>.Instance);

        if (failureStep is null)
        {
            string replayRunId = await sut.PrepareAsync(runId, cancellationToken);

            replayRunId.Should().NotBeNullOrWhiteSpace();
            Guid.Parse(replayRunId).Should().Be(saved!.RunId);
        }
        else if (failureStep == "pins")
        {
            Func<Task> prepare = () => sut.PrepareAsync(runId, cancellationToken);

            (await prepare.Should().ThrowAsync<ConflictException>()).Which.Should().BeSameAs(pinFailure);
            saved.Should().BeNull();
        }
        else
        {
            Func<Task> prepare = () => sut.PrepareAsync(runId, cancellationToken);

            (await prepare.Should().ThrowAsync<OperationCanceledException>()).Which.Should().BeSameAs(taskFailure);
            saved.Should().NotBeNull();
            saved!.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.Failed));
            saved.CompletedUtc.Should().NotBeNull();
            authorityRuns.Verify(
                repository => repository.UpdateAsync(saved, CancellationToken.None, null, null),
                Times.Once);
        }
    }
}
