using System.Collections.Immutable;

using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackGovernanceDryRunServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task EvaluateAsync_by_run_blocks_when_critical_and_enforcement_requested()
    {
        Guid runGuid = Guid.NewGuid();
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
                ArchitectureRequestId = "req-dry-1",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findingsRepo = new();
        await findingsRepo.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-crit",
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

        PolicyPackGovernanceDryRunServiceTestsFixture fixture = CreateSut(
            runs,
            findingsRepo,
            new InMemoryGoldenManifestRepository(),
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }));

        PolicyPackGovernanceDryRunResult? result = await fixture.Sut.EvaluateAsync(
            """{"metadata":{"governance.blockCommitOnCritical":"true"},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""",
            runGuid.ToString("N"),
            null,
            null,
            null,
            null,
            CancellationToken.None);

        result.Should().NotBeNull();
        result.GateResult.Blocked.Should().BeTrue();
        result.FailedChecks.Should().ContainSingle();

        fixture.Audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.GovernanceDryRunRequested &&
                    e.DataJson.Contains("\"workflow\":\"proposedPolicyPackContent\"", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EvaluateAsync_blocks_when_metadata_uses_PascalCase_enforcement_keys()
    {
        Guid runGuid = Guid.NewGuid();
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
                ArchitectureRequestId = "req-dry-pascal",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findingsRepo = new();
        await findingsRepo.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
                [
                    new Finding
                    {
                        FindingId = "f-crit",
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

        PolicyPackGovernanceDryRunServiceTestsFixture fixture = CreateSut(
            runs,
            findingsRepo,
            new InMemoryGoldenManifestRepository(),
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }));

        PolicyPackGovernanceDryRunResult? result = await fixture.Sut.EvaluateAsync(
            """{"metadata":{"BlockCommitOnCritical":"true"},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""",
            runGuid.ToString("N"),
            null,
            null,
            null,
            null,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.GateResult.Blocked.Should().BeTrue(
            "deserialized metadata dictionaries may lose OrdinalIgnoreCase comparer; enforcement keys must still resolve");
        result.FailedChecks.Should().ContainSingle();
    }

    [Fact]
    public async Task EvaluateAsync_by_manifest_resolves_run_under_scope()
    {
        Guid runGuid = Guid.NewGuid();
        Guid manifestGuid = Guid.NewGuid();
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
                ArchitectureRequestId = "req-dry-2",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findingsRepo = new();
        await findingsRepo.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings = [],
            },
            CancellationToken.None);

        InMemoryGoldenManifestRepository manifests = new();
        ManifestDocument manifest = new()
        {
            ManifestId = manifestGuid,
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ProjectId = TestScope.ProjectId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = snapshotId,
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "hash",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
        };

        await manifests.SaveAsync(manifest, CancellationToken.None);

        PolicyPackGovernanceDryRunServiceTestsFixture fixture = CreateSut(
            runs,
            findingsRepo,
            manifests,
            Options.Create(new PreCommitGovernanceGateOptions()));

        PolicyPackGovernanceDryRunResult? result = await fixture.Sut.EvaluateAsync(
            "{}",
            null,
            manifestGuid,
            true,
            (int)FindingSeverity.Critical,
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            CancellationToken.None);

        result.Should().NotBeNull();
        result.ResolvedRunId.Should().Be(runGuid.ToString("N"));
        result.TargetManifestId.Should().Be(manifestGuid);
        result.GateResult.Blocked.Should().BeFalse();

        fixture.Audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.GovernanceDryRunRequested),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task EvaluateAsync_returns_null_when_manifest_out_of_scope()
    {
        InMemoryRunRepository runs = new();
        InMemoryFindingsSnapshotRepository findingsRepo = new();
        InMemoryGoldenManifestRepository manifests = new();
        Guid otherProject = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid manifestGuid = Guid.NewGuid();
        Guid runGuid = Guid.NewGuid();

        ManifestDocument manifest = new()
        {
            ManifestId = manifestGuid,
            RunId = runGuid,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ProjectId = otherProject,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "hash",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
        };

        await manifests.SaveAsync(manifest, CancellationToken.None);

        PolicyPackGovernanceDryRunServiceTestsFixture fixture = CreateSut(
            runs,
            findingsRepo,
            manifests,
            Options.Create(new PreCommitGovernanceGateOptions()));

        PolicyPackGovernanceDryRunResult? result = await fixture.Sut.EvaluateAsync(
            "{}",
            null,
            manifestGuid,
            true,
            null,
            null,
            CancellationToken.None);

        result.Should().BeNull();

        fixture.Audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EvaluateAsync_blocks_when_technology_consistency_supplemental_findings_would_block_live_gate()
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
                ArchitectureRequestId = "req-dry-tech-consistency",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findingsRepo = new();
        await findingsRepo.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings = [],
            },
            CancellationToken.None);

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.PrimaryDatastore,
                TechnologyName = "Amazon RDS",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        PolicyPackGovernanceDryRunServiceTestsFixture fixture = CreateSut(
            runs,
            findingsRepo,
            new InMemoryGoldenManifestRepository(),
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            ledgerRepository,
            Options.Create(new TechnologyConsistencyFindingEngineOptions
            {
                Enabled = true,
                Mode = TechnologyConsistencyFindingEngineMode.Enforcing,
            }));

        PolicyPackGovernanceDryRunResult? result = await fixture.Sut.EvaluateAsync(
            """{"metadata":{"governance.blockCommitMinimumSeverity":"2"},"complianceRuleIds":[],"complianceRuleKeys":[],"alertRuleIds":[],"compositeAlertRuleIds":[],"advisoryDefaults":{}}""",
            runId,
            null,
            null,
            null,
            null,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.GateResult.Blocked.Should().BeTrue(
            "dry-run must include technology-consistency supplemental findings like the live pre-commit gate");
        result.FailedChecks.Should().Contain(check =>
            check.Contains("pre_commit_severity_gate", StringComparison.Ordinal));
    }

    [Fact]
    public async Task EvaluateAsync_throws_when_run_golden_manifest_is_unsealed()
    {
        Guid runGuid = Guid.NewGuid();
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
                ArchitectureRequestId = "req-dry-unsealed",
                LegacyRunStatus = "ReadyForCommit",
                FindingsSnapshotId = snapshotId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            CancellationToken.None);

        InMemoryFindingsSnapshotRepository findingsRepo = new();
        await findingsRepo.SaveAsync(
            new FindingsSnapshot
            {
                FindingsSnapshotId = snapshotId,
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings = [],
            },
            CancellationToken.None);

        ManifestDocument unsealedManifest = PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateSealedGoldenManifest(
            TestScope,
            runGuid);
        unsealedManifest.ManifestHash = "tampered-hash";

        PolicyPackGovernanceDryRunServiceTestsFixture fixture = CreateSut(
            runs,
            findingsRepo,
            new InMemoryGoldenManifestRepository(),
            Options.Create(new PreCommitGovernanceGateOptions()),
            authorityQueryService: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateAuthorityQueryService(
                TestScope,
                runGuid,
                unsealedManifest),
            manifestHashService: PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService(
                PolicyPackGovernanceDryRunSealedManifestTestSupport.SealedManifestHash));

        Func<Task> act = () => fixture.Sut.EvaluateAsync(
            "{}",
            runGuid.ToString("N"),
            null,
            null,
            null,
            null,
            CancellationToken.None);

        (await act.Should().ThrowAsync<ConflictException>())
            .Which.Message.Should().Contain("sealed manifest hash does not match");

        fixture.Audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private sealed record PolicyPackGovernanceDryRunServiceTestsFixture(
        PolicyPackGovernanceDryRunService Sut,
        Mock<IAuditService> Audit);

    private static PolicyPackGovernanceDryRunServiceTestsFixture CreateSut(
        IRunRepository runs,
        IFindingsSnapshotRepository findings,
        IGoldenManifestRepository goldenManifests,
        IOptions<PreCommitGovernanceGateOptions> options,
        ITechnologyLedgerRepository? ledgerRepository = null,
        IOptions<TechnologyConsistencyFindingEngineOptions>? consistencyOptions = null,
        IOptions<FindingEvidenceLinkageFindingEngineOptions>? linkageOptions = null,
        IAuthorityQueryService? authorityQueryService = null,
        IManifestHashService? manifestHashService = null)
    {
        Mock<IPromptRedactor> redactor = new();
        redactor
            .Setup(r => r.Redact(It.IsAny<string?>()))
            .Returns((string? s) => new PromptRedactionOutcome(s ?? string.Empty, ImmutableDictionary<string, int>.Empty));

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        PolicyPackGovernanceDryRunService sut = new(
            scope.Object,
            runs,
            findings,
            goldenManifests,
            options,
            redactor.Object,
            audit.Object,
            ledgerRepository ?? new InMemoryTechnologyLedgerRepository(),
            new TechnologyConsistencyFindingEngine(),
            consistencyOptions ?? Options.Create(new TechnologyConsistencyFindingEngineOptions { Enabled = false }),
            new FindingEvidenceLinkageFindingEngine(),
            linkageOptions ?? Options.Create(new FindingEvidenceLinkageFindingEngineOptions { Enabled = false }),
            authorityQueryService ?? PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateAuthorityQueryServiceForAnyRun(TestScope),
            manifestHashService ?? PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService(),
            NullLogger<PolicyPackGovernanceDryRunService>.Instance);

        return new PolicyPackGovernanceDryRunServiceTestsFixture(sut, audit);
    }
}
