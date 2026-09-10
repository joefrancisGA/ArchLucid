using System.Collections.Immutable;
using System.Text.Json;

using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPackCompoundingEvidenceLedger;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Host.Core.Services;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     TB-885 / DX-18: policy-pack compounding-evidence ledger on one historical run.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackCompoundingEvidenceLedgerTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid FixedRunGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    private static readonly Guid FixedPackId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    [Fact]
    public async Task Change_log_two_version_publish_transition_produces_incremental_catch_ledger()
    {
        (InMemoryRunRepository runs, InMemoryFindingsSnapshotRepository findingsRepo, List<Finding> committedFindings) =
            await SeedCommittedRunAsync();

        InMemoryPolicyPackChangeLogRepository changeLog = await SeedTwoVersionPublishChangeLogAsync();

        IReadOnlyList<PolicyPackChangeLogEntry> entries =
            await changeLog.GetByPolicyPackIdAsync(FixedPackId, maxRows: 10, CancellationToken.None);

        PolicyPackChangeLogVersionPairSelector.VersionTransition? transition =
            PolicyPackChangeLogVersionPairSelector.TrySelectLatestTransition(entries);

        transition.Should().NotBeNull();
        transition!.OlderVersionLabel.Should().Be("1.0.0");
        transition.NewerVersionLabel.Should().Be("2.0.0");

        PolicyPackGovernanceDryRunService dryRun = CreateDryRunService(runs, findingsRepo, new InMemoryGoldenManifestRepository());

        PolicyPackGovernanceDryRunResult? olderArm = await dryRun.EvaluateAsync(
            transition.OlderContentJson,
            FixedRunGuid.ToString("N"),
            null,
            blockCommitOnCritical: false,
            blockCommitMinimumSeverity: null,
            null,
            CancellationToken.None);

        PolicyPackGovernanceDryRunResult? newerArm = await dryRun.EvaluateAsync(
            transition.NewerContentJson,
            FixedRunGuid.ToString("N"),
            null,
            blockCommitOnCritical: true,
            blockCommitMinimumSeverity: (int)FindingSeverity.Critical,
            null,
            CancellationToken.None);

        olderArm.Should().NotBeNull();
        newerArm.Should().NotBeNull();
        olderArm!.GateResult.Blocked.Should().BeFalse();
        newerArm!.GateResult.Blocked.Should().BeTrue();

        PolicyPackCompoundingEvidenceLedgerBuilder builder = new();
        PolicyPackCompoundingEvidenceLedger ledger = builder.BuildFromChangeLogTransition(
            FixedPackId,
            FixedRunGuid.ToString("N"),
            transition,
            PolicyAbDemoFixture.BuildSourceRulePack(),
            committedFindings,
            olderArm.GateResult,
            newerArm.GateResult);

        ledger.Schema.Should().Be(PolicyPackCompoundingEvidenceLedger.SchemaId);
        ledger.IncrementalCatch.AddedComplianceRuleKeys.Should().Contain(PolicyAbDemoFixture.AddedComplianceRuleKey);
        ledger.IncrementalCatch.GateBlockedFlipped.Should().BeTrue();
        ledger.IncrementalCatch.FindingsNewlyBlockingCommit.Should().Contain("demo-finding-critical");
        ledger.ChangeLogCitations.Should().NotBeEmpty();
        ledger.ClaimBoundaryText.Should().Contain("not a buyer compounding rate");

        string markdown = PolicyPackCompoundingEvidenceLedgerMarkdownRenderer.Render(ledger);
        markdown.Should().Contain("demo-finding-critical");
        markdown.Should().Contain(PolicyAbDemoFixture.AddedComplianceRuleKey);

        string json = PolicyPackCompoundingEvidenceLedgerJson.Serialize(ledger);
        json.Should().Contain("\"schema\": \"archlucid.policy-pack-compounding-evidence-ledger.v1\"");
    }

    [Fact]
    public void Version_pair_selector_returns_null_when_only_one_publish_exists()
    {
        PolicyPackChangeLogEntry onlyPublish = new()
        {
            ChangeLogId = Guid.NewGuid(),
            PolicyPackId = FixedPackId,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ProjectId = TestScope.ProjectId,
            ChangeType = PolicyPackChangeTypes.VersionPublished,
            ChangedBy = "system",
            ChangedUtc = TimeProvider.System.UtcNowDateTime(),
            PreviousValue = null,
            NewValue = PolicyAbDemoFixture.DefaultContentJson(),
            SummaryText = "Version '1.0.0' published for pack '22222222-2222-2222-2222-222222222222'.",
        };

        PolicyPackChangeLogVersionPairSelector.TrySelectLatestTransition([onlyPublish])
            .Should()
            .BeNull();
    }

    [Fact]
    public void Version_pair_selector_extracts_version_from_summary_text()
    {
        PolicyPackChangeLogVersionPairSelector.ExtractVersionFromSummary(
                "Version '2.0.0' published for pack '22222222-2222-2222-2222-222222222222'.")
            .Should()
            .Be("2.0.0");
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
                Rationale = "Synthetic finding for policy compounding ledger fixture.",
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
                ArchitectureRequestId = "req-policy-compounding-ledger",
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

    private static async Task<InMemoryPolicyPackChangeLogRepository> SeedTwoVersionPublishChangeLogAsync()
    {
        InMemoryPolicyPackChangeLogRepository changeLog = new();
        string defaultJson = PolicyAbDemoFixture.DefaultContentJson();
        string strictJson = BuildStrictContentWithEnforcementJson();

        await changeLog.AppendAsync(
            new PolicyPackChangeLogEntry
            {
                ChangeLogId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                PolicyPackId = FixedPackId,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ChangeType = PolicyPackChangeTypes.VersionPublished,
                ChangedBy = "system",
                ChangedUtc = TimeProvider.System.UtcNowDateTime().AddMinutes(-10),
                PreviousValue = null,
                NewValue = defaultJson,
                SummaryText = $"Version '1.0.0' published for pack '{FixedPackId:D}'.",
            },
            CancellationToken.None);

        await changeLog.AppendAsync(
            new PolicyPackChangeLogEntry
            {
                ChangeLogId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                PolicyPackId = FixedPackId,
                TenantId = TestScope.TenantId,
                WorkspaceId = TestScope.WorkspaceId,
                ProjectId = TestScope.ProjectId,
                ChangeType = PolicyPackChangeTypes.VersionPublished,
                ChangedBy = "system",
                ChangedUtc = TimeProvider.System.UtcNowDateTime(),
                PreviousValue = defaultJson,
                NewValue = strictJson,
                SummaryText = $"Version '2.0.0' published for pack '{FixedPackId:D}'.",
            },
            CancellationToken.None);

        return changeLog;
    }

    private static string BuildStrictContentWithEnforcementJson()
    {
        PolicyPackContentDocument content = PolicyAbDemoFixture.BuildStrictContent();
        content.Metadata["governance.blockCommitOnCritical"] = "true";
        content.Metadata["governance.blockCommitMinimumSeverity"] = ((int)FindingSeverity.Critical).ToString();

        return JsonSerializer.Serialize(content, Decisioning.Governance.PolicyPacks.PolicyPackJsonSerializerOptions.Default);
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
            PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateAuthorityQueryServiceForAnyRun(TestScope),
            PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateManifestHashService(),
            PolicyPackGovernanceDryRunSealedManifestTestSupport.CreateEmptyFindingReviewTrailRepository(),
            NullLogger<PolicyPackGovernanceDryRunService>.Instance);
    }
}
