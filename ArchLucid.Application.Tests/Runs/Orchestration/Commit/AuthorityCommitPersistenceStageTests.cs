using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Commit;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using Cm = ArchLucid.Contracts.Manifest;
using DecisionTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.DecisionTraceDto;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Commit;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityCommitPersistenceStageTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task FinalizeAndCompleteAsync_when_working_desk_chain_audit_fails_does_not_record_baseline_or_return_result()
    {
        Guid runGuid = Guid.Parse("dddddddddddddddddddddddddddddddd");
        string runId = runGuid.ToString("N");
        string actor = "working-architect";
        ManifestDocument persistedManifest = CreatePersistedManifest(runGuid);
        AuthorityCommitDecisionMaterializationResult materialization = CreateMaterialization(runGuid, persistedManifest);
        Mock<IBaselineMutationAuditService> baselineAudit = new();
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit down"));
        Mock<IUserWorkspaceModeReader> workspaceModeReader = new();
        workspaceModeReader
            .Setup(reader => reader.IsWorkingDeskAsync(actor, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        Mock<IManifestFinalizationService> finalizationService = new();
        finalizationService
            .Setup(service => service.FinalizeAsync(It.IsAny<ManifestFinalizationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ManifestFinalizationResult(
                persistedManifest.ManifestId,
                WasIdempotentReturn: false,
                ManifestVersion: "1.0.0",
                PersistedManifest: persistedManifest));
        AuthorityCommitPersistenceStage sut = CreateSut(
            finalizationService.Object,
            baselineAudit.Object,
            auditService.Object,
            workspaceModeReader.Object);

        Func<Task> act = () => sut.FinalizeAndCompleteAsync(
            new ArchitectureRun { RunId = runId, RequestId = "req-1", Status = ArchitectureRunStatus.ReadyForCommit },
            runId,
            runGuid,
            CreateRunRecord(runGuid),
            new ArchitectureRequest { RequestId = "req-1" },
            actor,
            new ReadyForCommitRun(new RunId(runGuid)),
            materialization,
            CancellationToken.None);

        (await act.Should().ThrowAsync<DurableAuditWriteFailedException>())
            .Which.OperationLabel.Should().Contain("AuthorityCommittedChainPersisted");
        baselineAudit.Verify(
            service => service.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static AuthorityCommitPersistenceStage CreateSut(
        IManifestFinalizationService finalizationService,
        IBaselineMutationAuditService baselineMutationAudit,
        IAuditService auditService,
        IUserWorkspaceModeReader userWorkspaceModeReader)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);
        Mock<IPostCommitProjectionOutboxRepository> outbox = new();
        outbox
            .Setup(repository => repository.EnqueueAsync(
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new AuthorityCommitPersistenceStage(
            finalizationService,
            Mock.Of<IAuthorityCommitIdempotencyHandler>(),
            baselineMutationAudit,
            scopeProvider.Object,
            Mock.Of<ITrialFunnelCommitHook>(),
            Mock.Of<IFirstSessionLifecycleHook>(),
            new PostCommitProjectionEnqueuer(outbox.Object),
            Mock.Of<IRunRepository>(),
            Mock.Of<IAgentTaskRepository>(),
            auditService,
            Mock.Of<IRunTelemetryRepository>(),
            Mock.Of<IAuthorityCommitFailureRecorder>(),
            Mock.Of<IArtifactBundleRepository>(),
            Options.Create(new GenerateIacStubsOptions()),
            Options.Create(new RerankFindingsOptions()),
            userWorkspaceModeReader,
            NullLogger<AuthorityCommitPersistenceStage>.Instance);
    }

    private static RunRecord CreateRunRecord(Guid runGuid) =>
        new()
        {
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "alpha-sys",
            ArchitectureRequestId = "req-1",
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
            FindingsSnapshotId = Guid.NewGuid(),
        };

    private static ManifestDocument CreatePersistedManifest(Guid runGuid) =>
        new()
        {
            RunId = runGuid,
            ManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            ContextSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            GraphSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            FindingsSnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            DecisionTraceId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
        };

    private static AuthorityCommitDecisionMaterializationResult CreateMaterialization(
        Guid runGuid,
        ManifestDocument manifestModel)
    {
        RuleAuditTrace trace = RuleAuditTrace.From(new RuleAuditTracePayload
        {
            RunId = runGuid,
            DecisionTraceId = manifestModel.DecisionTraceId,
        });
        DecisionTraceDto traceDto = DecisionTraceRecordMapper.ToDto(trace);

        return new AuthorityCommitDecisionMaterializationResult
        {
            ManifestModel = manifestModel,
            TraceDto = traceDto,
            Trace = trace,
            Contract = new Cm.GoldenManifest
            {
                RunId = runGuid.ToString("N"),
                SystemName = "AlphaSys",
                Metadata = new ManifestMetadata { ManifestVersion = "1.0.0" },
            },
            ContractWireJson = "{}",
            EvidencePackageForTelemetry = new AgentEvidencePackage(),
            AgentResultsForTelemetry = Array.Empty<AgentResult>(),
            FindingsForFinalization = new FindingsSnapshot(),
            ScopePolicyPackAssignments = Array.Empty<PolicyPackAssignment>(),
            SkipPersistingPipelineArtifacts = false,
        };
    }
}
