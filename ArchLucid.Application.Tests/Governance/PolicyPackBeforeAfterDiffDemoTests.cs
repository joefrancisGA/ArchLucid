using System.Collections.Immutable;

using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Host.Core.Services;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using VerifyXunit;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     Fixture-backed before/after policy-pack diff demo (assessment §17.1 / Tier 1 #1).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackBeforeAfterDiffDemoTests : VerifyBase
{
    public PolicyPackBeforeAfterDiffDemoTests()
        : base()
    {
    }

    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid FixedRunGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static readonly Guid FixedDemoPackId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid FixedDemoAssignmentId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task Synthetic_fixture_produces_before_after_diff_with_finding_priority_and_executive_summary_changes()
    {
        (InMemoryRunRepository runs, InMemoryFindingsSnapshotRepository findingsRepo, List<Finding> committedFindings) =
            await SeedCommittedRunAsync();

        PolicyPackGovernanceDryRunService dryRun = CreateDryRunService(runs, findingsRepo, new InMemoryGoldenManifestRepository());

        PolicyPackGovernanceDryRunResult? defaultArm = await dryRun.EvaluateAsync(
            PolicyAbDemoFixture.DefaultContentJson(),
            FixedRunGuid.ToString("N"),
            null,
            blockCommitOnCritical: false,
            blockCommitMinimumSeverity: null,
            null,
            CancellationToken.None);

        PolicyPackGovernanceDryRunResult? strictArm = await dryRun.EvaluateAsync(
            PolicyAbDemoFixture.StrictContentJson(),
            FixedRunGuid.ToString("N"),
            null,
            blockCommitOnCritical: true,
            blockCommitMinimumSeverity: (int)FindingSeverity.Critical,
            null,
            CancellationToken.None);

        defaultArm.Should().NotBeNull();
        strictArm.Should().NotBeNull();
        defaultArm!.GateResult.Blocked.Should().BeFalse();
        strictArm!.GateResult.Blocked.Should().BeTrue();

        (PolicyPackAssignment assignment, List<AuditEvent> auditEvents) = await AssignStrictDemoPackAsync();

        PolicyPackBeforeAfterAuditCitation assignmentCitation = new()
        {
            EventType = AuditEventTypes.PolicyPackAssignmentCreated,
            RunId = FixedRunGuid.ToString("N"),
            AssignmentId = FixedDemoAssignmentId,
            PolicyPackId = FixedDemoPackId,
            PolicyPackVersion = assignment.PolicyPackVersion,
        };

        auditEvents.Should().ContainSingle(e => e.EventType == AuditEventTypes.PolicyPackAssignmentCreated);

        PolicyPackBeforeAfterDiffDemoService demoService = new();
        PolicyPackBeforeAfterDiffArtifact artifact = demoService.BuildSyntheticFixtureArtifact(
            FixedRunGuid.ToString("N"),
            committedFindings,
            defaultArm.GateResult,
            strictArm.GateResult,
            [assignmentCitation]);

        artifact.Changes.AddedComplianceRuleKeys.Should().Contain(PolicyAbDemoFixture.AddedComplianceRuleKey);
        artifact.Changes.GateBlockedFlipped.Should().BeTrue();
        artifact.Changes.FindingsNewlyBlockingCommit.Should().Contain("demo-finding-critical");
        artifact.Changes.SponsorReportLinesAdded.Should().NotBeEmpty();
        artifact.Changes.SponsorReportLinesRemoved.Should().NotBeEmpty();
        artifact.Before.ActiveComplianceRuleKeysOrdered.Count.Should().BeLessThan(artifact.After.ActiveComplianceRuleKeysOrdered.Count);
        artifact.AuditTrailCitations.Should().ContainSingle(c => c.EventType == AuditEventTypes.PolicyPackAssignmentCreated);

        string markdown = PolicyPackBeforeAfterDiffMarkdownRenderer.Render(artifact);
        markdown.Should().Contain("Configuration A");
        markdown.Should().Contain("Configuration B");
        markdown.Should().Contain(PolicyAbDemoFixture.AddedComplianceRuleKey);

        string json = PolicyPackBeforeAfterDiffArtifactJson.Serialize(artifact);
        await Verify(NormalizeForVerifySnapshot(json));
    }

    private static async Task<(InMemoryRunRepository Runs, InMemoryFindingsSnapshotRepository Findings, List<Finding> CommittedFindings)> SeedCommittedRunAsync()
    {
        Guid snapshotId = Guid.NewGuid();
        List<Finding> committedFindings =
        [
            new Finding
            {
                FindingId = "demo-finding-critical",
                FindingType = "Compliance",
                Category = "Compliance",
                EngineType = "compliance",
                Severity = FindingSeverity.Critical,
                Title = "Demo critical compliance gap (synthetic)",
                Rationale = "Synthetic finding for policy A/B demo fixture.",
            },
        ];

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            new RunRecord
            {
                RunId = FixedRunGuid,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ScopeProjectId = TestScope.ProjectId,
                ProjectId = "default",
                ArchitectureRequestId = "req-policy-ab-demo",
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
                RunId = FixedRunGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings = committedFindings,
            },
            CancellationToken.None);

        return (runs, findingsRepo, committedFindings);
    }

    private static async Task<(PolicyPackAssignment Assignment, List<AuditEvent> AuditEvents)> AssignStrictDemoPackAsync()
    {
        InMemoryPolicyPackRepository packs = new();
        InMemoryPolicyPackVersionRepository versions = new();
        InMemoryPolicyPackAssignmentRepository assignments = new();
        InMemoryPolicyPackChangeLogRepository changeLog = new();
        IArchLucidUnitOfWorkFactory uowFactory = ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory();

        PolicyPackManagementService management = PolicyPackManagementServiceComposer.Compose(
            packs,
            versions,
            assignments,
            changeLog,
            uowFactory,
            new Mock<IPolicyPackResolverCacheInvalidator>().Object);

        List<AuditEvent> auditEvents = [];

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => auditEvents.Add(auditEvent))
            .Returns(Task.CompletedTask);

        PolicyPacksAppService appService = new(
            management,
            packs,
            versions,
            audit.Object,
            Mock.Of<IIntegrationEventOutboxRepository>(),
            Mock.Of<IIntegrationEventPublisher>(),
            CreateIntegrationEventsOptionsMonitor(),
            NullLogger<PolicyPacksAppService>.Instance);

        await packs.CreateAsync(
            new PolicyPack
            {
                PolicyPackId = FixedDemoPackId,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                Name = "Policy A/B strict swap demo",
                Description = "Synthetic strict assignment for before/after diff artifact.",
                PackType = PolicyPackType.ProjectCustom,
                Status = PolicyPackStatus.Draft,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                CurrentVersion = "1.0.0",
            },
            CancellationToken.None);

        await versions.CreateAsync(
            new PolicyPackVersion
            {
                PolicyPackVersionId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                PolicyPackId = FixedDemoPackId,
                Version = "1.0.0",
                ContentJson = PolicyAbDemoFixture.StrictContentJson(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true,
            },
            CancellationToken.None);

        PolicyPackAssignment? assignment = await appService.TryAssignAsync(
            TestScope.TenantId,
            TestScope.WorkspaceId,
            TestScope.ProjectId,
            FixedDemoPackId,
            "1.0.0",
            GovernanceScopeLevel.Project,
            isPinned: false,
            CancellationToken.None);

        assignment.Should().NotBeNull();

        PolicyPackAssignment stableAssignment = new()
        {
            AssignmentId = FixedDemoAssignmentId,
            TenantId = assignment!.TenantId,
            WorkspaceId = assignment.WorkspaceId,
            ProjectId = assignment.ProjectId,
            PolicyPackId = FixedDemoPackId,
            PolicyPackVersion = assignment.PolicyPackVersion,
            IsEnabled = assignment.IsEnabled,
            ScopeLevel = assignment.ScopeLevel,
            IsPinned = assignment.IsPinned,
            AssignedUtc = assignment.AssignedUtc,
        };

        return (stableAssignment, auditEvents);
    }

    private static PolicyPackGovernanceDryRunService CreateDryRunService(
        IRunRepository runs,
        IFindingsSnapshotRepository findings,
        IGoldenManifestRepository goldenManifests)
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

        return new PolicyPackGovernanceDryRunService(
            scope.Object,
            runs,
            findings,
            goldenManifests,
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            redactor.Object,
            audit.Object,
            new InMemoryTechnologyLedgerRepository(),
            new TechnologyConsistencyFindingEngine(),
            Options.Create(new TechnologyConsistencyFindingEngineOptions { Enabled = false }),
            new FindingEvidenceLinkageFindingEngine(),
            Options.Create(new FindingEvidenceLinkageFindingEngineOptions { Enabled = false }),
            Mock.Of<IManifestHashService>(),
            NullLogger<PolicyPackGovernanceDryRunService>.Instance);
    }

    private static string NormalizeForVerifySnapshot(string text) =>
        text.ReplaceLineEndings("\n").TrimEnd() + "\n";

    private static IOptionsMonitor<IntegrationEventsOptions> CreateIntegrationEventsOptionsMonitor()
    {
        Mock<IOptionsMonitor<IntegrationEventsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new IntegrationEventsOptions());

        return options.Object;
    }
}
