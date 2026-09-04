using System.Collections.Immutable;

using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using ContractsComplianceRule = ArchLucid.Contracts.Compliance.ComplianceRule;
using ContractsComplianceRulePack = ArchLucid.Contracts.Compliance.ComplianceRulePack;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>
///     Coverage tests for all V1 GA bundled default policy packs: JSON integrity, curated artifact alignment,
///     graph compliance simulator triggers on under-protected topology, and governance dry-run simulation.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DefaultPolicyPackCoverageTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public void Bundled_packs_align_compliance_rule_keys_with_curated_artifacts()
    {
        string? repoRoot = DefaultPolicyPackCoverageTestSupport.TryFindRepoRoot();

        repoRoot.Should().NotBeNull("repo root with docs/samples/policy-packs is required for curated artifact checks");

        IReadOnlyList<DefaultPolicyPackBundleDefinition> bundles = DefaultPolicyPackBundledManifest.LoadBundles();

        bundles.Should().HaveCount(45);

        foreach (DefaultPolicyPackBundleDefinition bundle in bundles)
        {
            PolicyPackContentDocument document = DefaultPolicyPackCoverageTestSupport.DeserializeBundledContent(bundle);

            document.ComplianceRuleKeys.Should().NotBeEmpty($"pack '{bundle.DisplayName}' must reference compliance rules");

            DefaultPolicyPackCoverageTestSupport.AssertCuratedArtifactAligns(repoRoot!, document, bundle.DisplayName);
        }
    }

    [Fact]
    public async Task Each_bundled_pack_filters_to_nonempty_ga_starter_rule_set()
    {
        ContractsComplianceRulePack merged = await DefaultPolicyPackCoverageTestSupport.LoadMergedGaStarterPackAsync();
        IReadOnlyList<DefaultPolicyPackBundleDefinition> bundles = DefaultPolicyPackBundledManifest.LoadBundles();

        foreach (DefaultPolicyPackBundleDefinition bundle in bundles)
        {
            PolicyPackContentDocument document = DefaultPolicyPackCoverageTestSupport.DeserializeBundledContent(bundle);
            ContractsComplianceRulePack filtered = DefaultPolicyPackCoverageTestSupport.FilterPackRules(merged, document);

            filtered.Rules.Select(static rule => rule.RuleId)
                .Should()
                .BeSubsetOf(document.ComplianceRuleKeys, $"pack '{bundle.DisplayName}' should only expose declared keys");
        }
    }

    [Theory]
    [MemberData(nameof(BundledPackMemberData))]
    public async Task Each_bundled_pack_triggers_compliance_on_underprotected_topology(DefaultPolicyPackBundleDefinition bundle)
    {
        ContractsComplianceRulePack merged = await DefaultPolicyPackCoverageTestSupport.LoadMergedGaStarterPackAsync();
        PolicyPackContentDocument document = DefaultPolicyPackCoverageTestSupport.DeserializeBundledContent(bundle);
        ContractsComplianceRulePack filtered = DefaultPolicyPackCoverageTestSupport.FilterPackRules(merged, document);
        ContractsComplianceRule probeRule = filtered.Rules[0];
        GraphSnapshot graph = DefaultPolicyPackCoverageTestSupport.BuildUnderprotectedTopologyGraph(probeRule);

        ComplianceViolation? violation = DefaultPolicyPackCoverageTestSupport.EvaluateFirstViolation(filtered, graph);

        violation.Should().NotBeNull(
            $"pack '{bundle.DisplayName}' should emit a compliance violation for under-protected '{probeRule.AppliesToCategory}' topology");

        violation!.RuleId.Should().Be(probeRule.RuleId);
    }

    [Fact]
    public async Task Each_bundled_pack_simulates_through_governance_dry_run_service()
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
                ArchitectureRequestId = "coverage-dry-run",
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
                        FindingId = "coverage-critical",
                        FindingType = "Compliance",
                        Category = "coverage",
                        EngineType = "compliance",
                        Severity = FindingSeverity.Critical,
                        Title = "Critical coverage probe",
                        Rationale = "Synthetic finding for dry-run gate coverage.",
                    },
                ],
            },
            CancellationToken.None);

        PolicyPackGovernanceDryRunService sut = CreateDryRunService(runs, findingsRepo);
        IReadOnlyList<DefaultPolicyPackBundleDefinition> bundles = DefaultPolicyPackBundledManifest.LoadBundles();

        foreach (DefaultPolicyPackBundleDefinition bundle in bundles)
        {
            PolicyPackGovernanceDryRunResult? result = await sut.EvaluateAsync(
                bundle.ContentJson,
                runGuid.ToString("N"),
                null,
                true,
                (int)FindingSeverity.Critical,
                null,
                CancellationToken.None);

            result.Should().NotBeNull($"dry-run should resolve run for pack '{bundle.DisplayName}'");
            result!.PassedChecks.Should().Contain("policy_pack_content_json: parsed");
            result.GateResult.Blocked.Should().BeTrue($"pack '{bundle.DisplayName}' should block on critical findings when enforcement is enabled");
        }
    }

    public static IEnumerable<object[]> BundledPackMemberData()
    {
        foreach (DefaultPolicyPackBundleDefinition bundle in DefaultPolicyPackBundledManifest.LoadBundles())
            yield return new object[] { bundle };
    }

    private static PolicyPackGovernanceDryRunService CreateDryRunService(
        IRunRepository runs,
        IFindingsSnapshotRepository findings)
    {
        Mock<IPromptRedactor> redactor = new();
        redactor
            .Setup(static r => r.Redact(It.IsAny<string?>()))
            .Returns((string? s) => new PromptRedactionOutcome(s ?? string.Empty, ImmutableDictionary<string, int>.Empty));

        Mock<IAuditService> audit = new();
        audit
            .Setup(static a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(static s => s.GetCurrentScope()).Returns(TestScope);

        return new PolicyPackGovernanceDryRunService(
            scope.Object,
            runs,
            findings,
            new InMemoryGoldenManifestRepository(),
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            redactor.Object,
            audit.Object,
            new InMemoryTechnologyLedgerRepository(),
            new TechnologyConsistencyFindingEngine(),
            Options.Create(new TechnologyConsistencyFindingEngineOptions { Enabled = false }),
            new FindingEvidenceLinkageFindingEngine(),
            Options.Create(new FindingEvidenceLinkageFindingEngineOptions { Enabled = false }),
            NullLogger<PolicyPackGovernanceDryRunService>.Instance);
    }
}
