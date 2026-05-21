using ArchLucid.Application.Common;
using ArchLucid.Application.Decisions;
using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

using ContractManifestMetadata = ArchLucid.Contracts.Manifest.ManifestMetadata;
using DecisionManifestMetadata = ArchLucid.Core.Manifest.Sections.ManifestMetadata;
using Dm = ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
///     Targets integrity-sensitive branches in <see cref="AuthorityDrivenArchitectureRunCommitOrchestrator" /> that are
///     expensive to reach via full commit orchestration tests but must not be weakened by mutations (governance gate +
///     manifest version alignment).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [SkippableFact]
    public async Task EvaluatePreCommitGovernanceGateOrThrowAsync_when_blocked_audits_and_throws()
    {
        Guid runGuid = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        string runId = runGuid.ToString("N");
        const string actor = "integrity-test-actor";
        const string wireJson = "{}";
        Mock<IPreCommitGovernanceGate> gate = new();
        gate
            .Setup(g =>
                g.EvaluateAsync(runId, wireJson, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PreCommitGateResult
            {
                Blocked = true,
                Reason = "policy",
                BlockingFindingIds = ["f-1"],
                PolicyPackId = "pack-a",
                MinimumBlockingSeverity = 3,
            });

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(gate.Object, audit.Object, scopeProvider.Object);

        Func<Task> act = async () =>
            await sut.EvaluatePreCommitGovernanceGateOrThrowAsync(runId, actor, wireJson, null, CancellationToken.None);

        (await act.Should().ThrowAsync<PreCommitGovernanceBlockedException>())
            .Which.Result.Reason.Should().Be("policy");

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.GovernancePreCommitBlocked && e.RunId == runGuid && e.ActorUserId == actor),
                It.IsAny<CancellationToken>()),
            Times.Once);
        gate.Verify(g => g.EvaluateAsync(runId, wireJson, It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task EvaluatePreCommitGovernanceGateOrThrowAsync_when_blocked_with_justification_audits_bypass_and_does_not_throw()
    {
        Guid runGuid = Guid.Parse("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
        string runId = runGuid.ToString("N");
        const string actor = "integrity-test-actor";
        const string wireJson = "{}";
        Mock<IPreCommitGovernanceGate> gate = new();
        gate
            .Setup(g =>
                g.EvaluateAsync(runId, wireJson, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PreCommitGateResult
            {
                Blocked = true,
                Reason = "policy",
                BlockingFindingIds = ["f-bypass-1"],
                PolicyPackId = "pack-bypass",
                MinimumBlockingSeverity = 3,
            });

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(gate.Object, audit.Object, scopeProvider.Object);

        await sut.EvaluatePreCommitGovernanceGateOrThrowAsync(runId, actor, wireJson, "INC123 emergency release", CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.GovernanceBypassInvoked && e.RunId == runGuid && e.ActorUserId == actor),
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.GovernancePreCommitBlocked),
                It.IsAny<CancellationToken>()),
            Times.Never);
        gate.Verify(g => g.EvaluateAsync(runId, wireJson, It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task EvaluatePreCommitGovernanceGateOrThrowAsync_when_warn_only_audits_and_does_not_throw()
    {
        Guid runGuid = Guid.Parse("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        string runId = runGuid.ToString("N");
        const string actor = "integrity-test-actor";
        const string wireJson = "{}";
        Mock<IPreCommitGovernanceGate> gate = new();
        gate
            .Setup(g =>
                g.EvaluateAsync(runId, wireJson, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PreCommitGateResult
            {
                WarnOnly = true,
                Blocked = false,
                Reason = "near threshold",
                Warnings = ["w1"],
            });

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(gate.Object, audit.Object, scopeProvider.Object);

        await sut.EvaluatePreCommitGovernanceGateOrThrowAsync(runId, actor, wireJson, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.GovernancePreCommitWarned && e.RunId == runGuid),
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.GovernancePreCommitBlocked),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task EvaluatePreCommitGovernanceGateOrThrowAsync_when_allowed_skips_governance_audit_events()
    {
        Guid runGuid = Guid.Parse("cccccccccccccccccccccccccccccccc");
        string runId = runGuid.ToString("N");
        Mock<IPreCommitGovernanceGate> gate = new();
        gate
            .Setup(g =>
                g.EvaluateAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PreCommitGateResult.Allowed());

        Mock<IAuditService> audit = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(gate.Object, audit.Object, scopeProvider.Object);

        await sut.EvaluatePreCommitGovernanceGateOrThrowAsync(runId, "actor", "{}", null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task EvaluatePreCommitGovernanceGateOrThrowAsync_WarnOnly_takes_precedence_over_blocked_flag()
    {
        Guid runGuid = Guid.Parse("dddddddddddddddddddddddddddddddd");
        string runId = runGuid.ToString("N");
        Mock<IPreCommitGovernanceGate> gate = new();
        gate
            .Setup(g =>
                g.EvaluateAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PreCommitGateResult
            {
                WarnOnly = true,
                Blocked = true,
                Reason = "ambiguous synthetic",
            });

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        AuthorityDrivenArchitectureRunCommitOrchestrator sut = CreateSut(gate.Object, audit.Object, scopeProvider.Object);

        await sut.EvaluatePreCommitGovernanceGateOrThrowAsync(runId, "actor", "{}", null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.GovernancePreCommitWarned),
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.GovernancePreCommitBlocked),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public void AlignAuthorityVersionToContract_copies_contract_manifest_version_onto_model()
    {
        ManifestDocument model = new()
        {
            Metadata = new DecisionManifestMetadata { Version = "before" },
        };
        GoldenManifest contract = new()
        {
            Metadata = new ContractManifestMetadata { ManifestVersion = "v9-contract" },
        };

        AuthorityDrivenArchitectureRunCommitOrchestrator.AlignAuthorityVersionToContract(model, contract);

        model.Metadata.Version.Should().Be("v9-contract");
    }

    [SkippableFact]
    public void AlignAuthorityVersionToContract_when_contract_version_blank_leaves_model_version_unchanged()
    {
        ManifestDocument model = new()
        {
            Metadata = new DecisionManifestMetadata { Version = "stable" },
        };
        GoldenManifest contract = new()
        {
            Metadata = new ContractManifestMetadata { ManifestVersion = "   " },
        };

        AuthorityDrivenArchitectureRunCommitOrchestrator.AlignAuthorityVersionToContract(model, contract);

        model.Metadata.Version.Should().Be("stable");
    }

    [SkippableFact]
    public void AlignAuthorityVersionToContract_null_manifest_throws()
    {
        GoldenManifest contract = new()
        {
            Metadata = new ContractManifestMetadata { ManifestVersion = "v1" },
        };

        Action act = () => AuthorityDrivenArchitectureRunCommitOrchestrator.AlignAuthorityVersionToContract(null!, contract);

        act.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("manifestModel");
    }

    [SkippableFact]
    public void AlignAuthorityVersionToContract_null_contract_throws()
    {
        ManifestDocument model = new();

        Action act = () => AuthorityDrivenArchitectureRunCommitOrchestrator.AlignAuthorityVersionToContract(model, null!);

        act.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("contract");
    }

    private static AuthorityDrivenArchitectureRunCommitOrchestrator CreateSut(
        IPreCommitGovernanceGate gate,
        IAuditService audit,
        IScopeContextProvider scopeProvider)
    {
        Mock<IBaselineMutationAuditService> baselineAudit = new();
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunRepository> runRepository = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("unit-test-actor");

        return new AuthorityDrivenArchitectureRunCommitOrchestrator(
            runRepository.Object,
            scopeProvider,
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Mock.Of<IAgentEvidencePackageRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            Mock.Of<IAgentEvaluationService>(),
            Mock.Of<IDecisionEngine>(),
            Mock.Of<IDecisionEngineV2>(),
            Mock.Of<IDecisionNodeRepository>(),
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IGoldenManifestRepository>(),
            Mock.Of<IAuthorityCommitProjectionBuilder>(),
            Mock.Of<IManifestFinalizationService>(),
            gate,
            Mock.Of<IPreCommitGovernanceBlockExplainer>(),
            actor.Object,
            baselineAudit.Object,
            audit,
            Mock.Of<ITrialFunnelCommitHook>(),
            Mock.Of<IFirstSessionLifecycleHook>(),
            Mock.Of<IFindingIacStubGenerator>(),
            Mock.Of<ArchLucid.Application.Findings.IFindingPriorityReranker>(),
            Mock.Of<IDbConnectionFactory>(),
            new RunStateTransitionService(),
            Options.Create(new ArchLucid.Core.Configuration.GenerateIacStubsOptions()),
            Options.Create(new ArchLucid.Core.Configuration.RerankFindingsOptions()),
            Mock.Of<ILogger<AuthorityDrivenArchitectureRunCommitOrchestrator>>());
    }
}
