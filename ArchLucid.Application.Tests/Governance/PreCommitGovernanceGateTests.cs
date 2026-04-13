using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitGovernanceGateTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task EvaluateAsync_blocks_when_critical_findings_and_assignment_enforces()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = DateTime.UtcNow,
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-critical",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Critical,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = new(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeTrue();
        r.BlockingFindingIds.Should().ContainSingle().Which.Should().Be("f-critical");
    }

    [Fact]
    public async Task EvaluateAsync_allows_when_no_critical_findings()
    {
        Guid runGuid = Guid.NewGuid();
        string runId = runGuid.ToString("N");
        Guid snapshotId = Guid.NewGuid();
        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = runGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findings = new();
        await findings.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = DateTime.UtcNow,
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-warn",
                        FindingType = "Compliance",
                        Category = "c",
                        EngineType = "e",
                        Severity = FindingSeverity.Warning,
                        Title = "t",
                        Rationale = "r",
                    },
                ],
            },
            CancellationToken.None);

        InMemoryPolicyPackAssignmentRepository assignments = new();
        await assignments.CreateAsync(
            new PolicyPackAssignment
            {
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ScopeLevel = GovernanceScopeLevel.Project,
                PolicyPackId = Guid.NewGuid(),
                PolicyPackVersion = "1.0.0",
                IsEnabled = true,
                BlockCommitOnCritical = true,
            },
            CancellationToken.None);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PreCommitGovernanceGate sut = new(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            scopeProvider.Object,
            runs,
            findings,
            assignments);

        PreCommitGateResult r = await sut.EvaluateAsync(runId, CancellationToken.None);

        r.Blocked.Should().BeFalse();
    }

    [Fact]
    public async Task EvaluateAsync_allows_when_gate_disabled_in_options()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        PreCommitGovernanceGate sut = new(
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = false }),
            scopeProvider.Object,
            new InMemoryRunRepository(),
            new InMemoryFindingsSnapshotRepository(),
            new InMemoryPolicyPackAssignmentRepository());

        PreCommitGateResult r = await sut.EvaluateAsync(Guid.NewGuid().ToString("N"), CancellationToken.None);

        r.Blocked.Should().BeFalse();
        scopeProvider.Verify(s => s.GetCurrentScope(), Times.Never);
    }
}
