using System.Collections.Immutable;

using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     Regression guard for the policy-to-decision demo (assessment Tier 1 #1 / candidate #15).
///     Fails if the stricter <see cref="PolicyAbDemoFixture" /> pack stops adding a compliance rule key
///     or stops flipping the pre-commit gate to blocked on the same committed findings.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyAbDemoRegressionTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public void Stricter_pack_selects_one_additional_compliance_rule_key()
    {
        ComplianceRulePack source = PolicyAbDemoFixture.BuildSourceRulePack();

        ComplianceRulePack defaultFiltered =
            ComplianceRulePackGovernanceFilter.Filter(source, PolicyAbDemoFixture.BuildDefaultContent());
        ComplianceRulePack strictFiltered =
            ComplianceRulePackGovernanceFilter.Filter(source, PolicyAbDemoFixture.BuildStrictContent());

        IReadOnlyList<string> defaultKeys = defaultFiltered.Rules.Select(rule => rule.RuleId).ToList();
        IReadOnlyList<string> strictKeys = strictFiltered.Rules.Select(rule => rule.RuleId).ToList();

        defaultKeys.Should().BeEquivalentTo(PolicyAbDemoFixture.DefaultComplianceRuleKeys);
        defaultKeys.Should().NotContain(PolicyAbDemoFixture.AddedComplianceRuleKey);

        strictKeys.Should().BeEquivalentTo(PolicyAbDemoFixture.StrictComplianceRuleKeys);
        strictKeys.Should().Contain(PolicyAbDemoFixture.AddedComplianceRuleKey);
        strictFiltered.Rules.Count.Should().BeGreaterThan(defaultFiltered.Rules.Count);
    }

    [Fact]
    public async Task Stricter_pack_flips_pre_commit_gate_to_blocked_on_same_findings()
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
                RunId = runGuid,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                Findings =
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
                ],
            },
            CancellationToken.None);

        PolicyPackGovernanceDryRunService sut = CreateSut(runs, findingsRepo, new InMemoryGoldenManifestRepository());

        // Same committed run + same findings snapshot; only the policy posture differs between arms.
        PolicyPackGovernanceDryRunResult? allowArm = await sut.EvaluateAsync(
            PolicyAbDemoFixture.DefaultContentJson(),
            runGuid.ToString("N"),
            null,
            blockCommitOnCritical: false,
            blockCommitMinimumSeverity: null,
            null,
            CancellationToken.None);

        PolicyPackGovernanceDryRunResult? blockArm = await sut.EvaluateAsync(
            PolicyAbDemoFixture.StrictContentJson(),
            runGuid.ToString("N"),
            null,
            blockCommitOnCritical: true,
            blockCommitMinimumSeverity: (int)FindingSeverity.Critical,
            null,
            CancellationToken.None);

        allowArm.Should().NotBeNull();
        blockArm.Should().NotBeNull();
        allowArm!.GateResult.Blocked.Should().BeFalse();
        blockArm!.GateResult.Blocked.Should().BeTrue();
    }

    private static PolicyPackGovernanceDryRunService CreateSut(
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
            NullLogger<PolicyPackGovernanceDryRunService>.Instance);
    }
}
