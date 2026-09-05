using System.Text.Json;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecuteTimeGovernanceScopeCaptureServiceTests
{
    [Fact]
    public async Task TryCaptureAndPersistAsync_persists_governance_scope_json_and_audit_event()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        RunRecord header = new()
        {
            RunId = runId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            ProjectId = projectId.ToString("N"),
            PinnedPolicyPackIdsJson = JsonSerializer.Serialize(
                new[] { new PinnedPolicyPackRow(packId.ToString("D"), "2.0.0") },
                ContractJson.CamelCaseIgnoreNullCompact)
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectiveGovernanceResolutionResult
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId
            });

        PolicyPackAssignment assignment = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = packId,
            PolicyPackVersion = "2.0.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsEnabled = true
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([assignment]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = packId,
                    Name = "Security Architecture Baseline",
                    TenantId = tenantId,
                    QualityDimension = QualityDimension.Security
                }
            ]);

        InMemoryCoverageAssignmentRepository coverageRepository = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");

        List<AuditEvent> auditEvents = [];
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => auditEvents.Add(auditEvent))
            .Returns(Task.CompletedTask);

        ExecuteTimeGovernanceScopeCaptureService sut = new(
            runs.Object,
            scopeProvider.Object,
            resolver.Object,
            assignments.Object,
            packs.Object,
            Mock.Of<IPolicyPackVersionRepository>(),
            coverageRepository,
            new CoverageAssignmentValidator(),
            actor.Object,
            auditService.Object,
            NullLogger<ExecuteTimeGovernanceScopeCaptureService>.Instance);

        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.Azure,
            PolicyReferences = []
        };

        await sut.TryCaptureAndPersistAsync(runId.ToString("N"), request, CancellationToken.None);

        header.GovernanceScopeJson.Should().NotBeNullOrWhiteSpace();
        ExecutedEffectiveGovernanceSnapshotDescriptor? snapshot =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(header.GovernanceScopeJson);
        snapshot.Should().NotBeNull();
        snapshot!.PackAssignments.Should().ContainSingle(row => row.PolicyPackVersion == "2.0.0");
        snapshot.NotAssessedQualityDimensions.Should().NotBeEmpty();

        IReadOnlyList<CoverageAssignment> coverageRows =
            await coverageRepository.ListByRunIdAsync(scope, runId.ToString("N"), CancellationToken.None);
        coverageRows.Should().NotBeEmpty();

        auditEvents.Should().ContainSingle(row => row.EventType == AuditEventTypes.RunGovernanceScopeResolved);
    }

    [Fact]
    public async Task TryCaptureAndPersistAsync_applies_acknowledged_coverage_exclusions_at_execute()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid overlayPackId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        RunAcknowledgedCoverageDocument acknowledgement = new()
        {
            EvaluationVersion = RunAcknowledgedCoverageDocument.DocumentVersion,
            AcknowledgedUtc = DateTime.UtcNow,
            ActorUserId = "operator@test",
            Entries =
            [
                new RunCoverageAcknowledgementEntry
                {
                    PolicyPackId = overlayPackId,
                    Excluded = true,
                    ExclusionReason = "Pilot excludes cloud overlays"
                }
            ]
        };

        RunRecord header = new()
        {
            RunId = runId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            ProjectId = projectId.ToString("N"),
            PinnedPolicyPackIdsJson = JsonSerializer.Serialize(
                new[] { new PinnedPolicyPackRow(overlayPackId.ToString("D"), "1.0.0") },
                ContractJson.CamelCaseIgnoreNullCompact),
            AcknowledgedCoverageJson = RunAcknowledgedCoverageJson.Serialize(acknowledgement)
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectiveGovernanceResolutionResult
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId
            });

        PolicyPackAssignment assignment = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = overlayPackId,
            PolicyPackVersion = "1.0.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsEnabled = true
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([assignment]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = overlayPackId,
                    Name = DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName,
                    TenantId = tenantId
                }
            ]);

        InMemoryCoverageAssignmentRepository coverageRepository = new();
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("operator@test");

        List<AuditEvent> auditEvents = [];
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => auditEvents.Add(auditEvent))
            .Returns(Task.CompletedTask);

        ExecuteTimeGovernanceScopeCaptureService sut = new(
            runs.Object,
            scopeProvider.Object,
            resolver.Object,
            assignments.Object,
            packs.Object,
            Mock.Of<IPolicyPackVersionRepository>(),
            coverageRepository,
            new CoverageAssignmentValidator(),
            actor.Object,
            auditService.Object,
            NullLogger<ExecuteTimeGovernanceScopeCaptureService>.Instance);

        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.Azure,
            PolicyReferences = [FocusedPilotModePolicyPacks.ReferenceToken]
        };

        await sut.TryCaptureAndPersistAsync(runId.ToString("N"), request, CancellationToken.None);

        ExecutedEffectiveGovernanceSnapshotDescriptor? snapshot =
            ExecutedEffectiveGovernanceSnapshotJson.TryDeserialize(header.GovernanceScopeJson);
        snapshot.Should().NotBeNull();
        snapshot!.PackAssignments.Should().BeEmpty();
        snapshot.CoverageAssignments.Should().ContainSingle(row =>
            row.PolicyPackId == overlayPackId
            && row.SelectionState == CoverageSelectionState.RecommendedButExcluded.ToString()
            && row.ExclusionReason == "Pilot excludes cloud overlays");

        IReadOnlyList<CoverageAssignment> coverageRows =
            await coverageRepository.ListByRunIdAsync(scope, runId.ToString("N"), CancellationToken.None);
        coverageRows.Should().ContainSingle(row =>
            row.PolicyPackId == overlayPackId
            && row.SelectionState == CoverageSelectionState.RecommendedButExcluded
            && row.ExclusionReason == "Pilot excludes cloud overlays");

        auditEvents.Should().ContainSingle(row => row.EventType == AuditEventTypes.RunGovernanceScopeResolved);
    }

    [Fact]
    public async Task TryCaptureAndPersistAsync_is_idempotent_when_scope_already_recorded()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        RunRecord header = new()
        {
            RunId = runId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            ProjectId = projectId.ToString("N"),
            GovernanceScopeJson = """{"generatedUtc":"2026-01-01T00:00:00Z"}"""
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IEffectiveGovernanceResolver> resolver = new();
        Mock<IAuditService> auditService = new();

        ExecuteTimeGovernanceScopeCaptureService sut = new(
            runs.Object,
            scopeProvider.Object,
            resolver.Object,
            Mock.Of<IPolicyPackAssignmentRepository>(),
            Mock.Of<IPolicyPackRepository>(),
            Mock.Of<IPolicyPackVersionRepository>(),
            new InMemoryCoverageAssignmentRepository(),
            new CoverageAssignmentValidator(),
            Mock.Of<IActorContext>(),
            auditService.Object,
            NullLogger<ExecuteTimeGovernanceScopeCaptureService>.Instance);

        await sut.TryCaptureAndPersistAsync(
            runId.ToString("N"),
            new ArchitectureRequest { CloudProvider = CloudProvider.Azure },
            CancellationToken.None);

        runs.Verify(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()), Times.Never);
        resolver.Verify(
            r => r.ResolveAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        auditService.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
