using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class PremiumInsightDensityLlmJudgeTests
{
    [Fact]
    public async Task ApplyToArchitectureFindingsAsync_when_disabled_leaves_findings_unchanged()
    {
        ArchitectureFinding finding = CreatePromotedFinding();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient("""{"findingId":"f1"}"""),
            enableLlmJudge: false,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToArchitectureFindingsAsync(
            [finding],
            new AgentEvidencePackage(),
            new ArchitectureRequest { RequestId = "REQ-1", SystemName = "Sys" },
            CancellationToken.None);

        finding.WhyThisIsNotGeneric.Should().BeNull();
        finding.Treatment.Should().Be(FindingTreatment.Promote);
    }

    [Fact]
    public async Task ApplyToArchitectureFindingsAsync_when_enabled_enriches_promoted_finding()
    {
        ArchitectureFinding finding = CreatePromotedFinding();
        const string judgmentJson = """
                                      {
                                        "findingId": "f1",
                                        "insightDensityScore": 88,
                                        "whyThisIsNotGeneric": "Names PaymentDb secret handling gap.",
                                        "principalArchitectValue": "Blocks prod rollout until secrets are scoped.",
                                        "decisionConsequence": "Defer prod cutover until Key Vault binding is added.",
                                        "demoteToChecklist": false,
                                        "evidenceRefs": ["doc:manifest.json#services"]
                                      }
                                      """;

        PremiumInsightDensityLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient(judgmentJson),
            enableLlmJudge: true,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToArchitectureFindingsAsync(
            [finding],
            new AgentEvidencePackage(),
            new ArchitectureRequest { RequestId = "REQ-1", SystemName = "Checkout" },
            CancellationToken.None);

        finding.WhyThisIsNotGeneric.Should().Contain("PaymentDb");
        finding.PrincipalArchitectValue.Should().NotBeNullOrWhiteSpace();
        finding.DecisionConsequence.Should().Contain("Defer");
        finding.Treatment.Should().Be(FindingTreatment.Promote);
        finding.InsightDensityScore.Should().BeGreaterThan(50);
    }

    [Fact]
    public async Task ApplyToArchitectureFindingsAsync_demotes_when_decision_consequence_missing()
    {
        ArchitectureFinding finding = CreatePromotedFinding();
        const string judgmentJson = """
                                      {
                                        "findingId": "f1",
                                        "insightDensityScore": 40,
                                        "whyThisIsNotGeneric": "Generic template.",
                                        "principalArchitectValue": "Low value.",
                                        "decisionConsequence": "",
                                        "demoteToChecklist": false,
                                        "evidenceRefs": ["doc:manifest.json#services"]
                                      }
                                      """;

        PremiumInsightDensityLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient(judgmentJson),
            enableLlmJudge: true,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToArchitectureFindingsAsync(
            [finding],
            new AgentEvidencePackage(),
            new ArchitectureRequest { RequestId = "REQ-1", SystemName = "Checkout" },
            CancellationToken.None);

        finding.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        finding.Classification.Should().Be(FindingClassification.ChecklistCoverage);
    }

    [Fact]
    public async Task ApplyToArchitectureFindingsAsync_skips_demoted_candidates()
    {
        ArchitectureFinding finding = CreatePromotedFinding();
        finding.Treatment = FindingTreatment.DemoteToChecklist;

        CountingCompletionClient countingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            countingClient,
            enableLlmJudge: true,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToArchitectureFindingsAsync(
            [finding],
            new AgentEvidencePackage(),
            new ArchitectureRequest { RequestId = "REQ-1", SystemName = "Checkout" },
            CancellationToken.None);

        countingClient.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ApplyToFindingsAsync_when_engine_flag_off_issues_no_completions()
    {
        Finding finding = CreatePromotedEngineFinding();
        CountingCompletionClient countingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            countingClient,
            enableLlmJudge: true,
            enableEngineJudge: false,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([finding], CancellationToken.None);

        countingClient.CallCount.Should().Be(0);
        finding.WhyThisIsNotGeneric.Should().BeNull();
    }

    [Fact]
    public async Task ApplyToFindingsAsync_when_enabled_enriches_engine_finding()
    {
        Finding finding = CreatePromotedEngineFinding();
        const string judgmentJson = """
                                      {
                                        "findingId": "engine-f1",
                                        "insightDensityScore": 90,
                                        "whyThisIsNotGeneric": "Names overdue deferral on payments-api.",
                                        "principalArchitectValue": "Blocks approval until revisit closes.",
                                        "decisionConsequence": "Defer release until the deferral is resolved.",
                                        "demoteToChecklist": false,
                                        "evidenceRefs": ["payments-api-node"]
                                      }
                                      """;

        PremiumInsightDensityLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient(judgmentJson),
            enableLlmJudge: true,
            enableEngineJudge: true,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([finding], CancellationToken.None);

        finding.WhyThisIsNotGeneric.Should().Contain("deferral");
        finding.DecisionConsequence.Should().Contain("Defer");
        finding.Treatment.Should().Be(FindingTreatment.Promote);
        finding.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
    }

    [Fact]
    public async Task ApplyToFindingsAsync_prefers_preferred_engine_type_under_cap()
    {
        List<Finding> findings = Enumerable.Range(0, 12)
            .Select(index => CreatePromotedEngineFinding(
                $"coverage-{index:D2}",
                engineType: "topology-coverage",
                severity: FindingSeverity.Warning,
                insightDensityScore: 50))
            .ToList();

        Finding blastRadiusFinding = CreatePromotedEngineFinding(
            "blast-1",
            engineType: "identity-blast-radius",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        findings.Add(blastRadiusFinding);

        JudgedFindingIdsCompletionClient judgingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 12,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync(findings, CancellationToken.None);

        judgingClient.CallCount.Should().Be(12);
        judgingClient.JudgedFindingIds.Should().Contain("blast-1");
        judgingClient.JudgedFindingIds.Should().NotContain("coverage-11");
    }

    [Fact]
    public async Task ApplyToFindingsAsync_prefers_dangling_declaration_reference_under_cap()
    {
        List<Finding> findings = Enumerable.Range(0, 12)
            .Select(index => CreatePromotedEngineFinding(
                $"coverage-{index:D2}",
                engineType: "topology-coverage",
                severity: FindingSeverity.Warning,
                insightDensityScore: 50))
            .ToList();

        Finding danglingFinding = CreatePromotedEngineFinding(
            "dangling-1",
            engineType: "dangling-declaration-reference",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        findings.Add(danglingFinding);

        JudgedFindingIdsCompletionClient judgingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 12,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync(findings, CancellationToken.None);

        judgingClient.CallCount.Should().Be(12);
        judgingClient.JudgedFindingIds.Should().Contain("dangling-1");
        judgingClient.JudgedFindingIds.Should().NotContain("coverage-11");
    }

    [Fact]
    public async Task ApplyToFindingsAsync_respects_per_snapshot_cap()
    {
        List<Finding> findings = Enumerable.Range(0, 30)
            .Select(index => CreatePromotedEngineFinding(
                $"engine-f{index}",
                severity: FindingSeverity.Warning,
                insightDensityScore: 40 + index))
            .ToList();

        CountingCompletionClient countingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            countingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 12,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync(findings, CancellationToken.None);

        countingClient.CallCount.Should().Be(12);
    }

    [Fact]
    public async Task ApplyToFindingsAsync_faithfulness_failure_leaves_treatment_unchanged()
    {
        Finding finding = CreatePromotedEngineFinding();
        const string judgmentJson = """
                                      {
                                        "findingId": "engine-f1",
                                        "insightDensityScore": 90,
                                        "whyThisIsNotGeneric": "Names overdue deferral.",
                                        "principalArchitectValue": "Blocks approval.",
                                        "decisionConsequence": "Defer release.",
                                        "demoteToChecklist": false,
                                        "evidenceRefs": ["fabricated-node"]
                                      }
                                      """;

        PremiumInsightDensityLlmJudge judge = CreateJudge(
            new StubAgentCompletionClient(judgmentJson),
            enableLlmJudge: true,
            enableEngineJudge: true,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([finding], CancellationToken.None);

        finding.Treatment.Should().Be(FindingTreatment.Promote);
        finding.WhyThisIsNotGeneric.Should().BeNull();
    }

    [Fact]
    public async Task ApplyToFindingsAsync_one_failure_does_not_fail_batch()
    {
        Finding successFinding = CreatePromotedEngineFinding(
            "engine-ok",
            severity: FindingSeverity.Error,
            insightDensityScore: 30);
        Finding throwFinding = CreatePromotedEngineFinding(
            "engine-bad",
            severity: FindingSeverity.Error,
            insightDensityScore: 20);

        PremiumInsightDensityLlmJudge judge = CreateJudge(
            new ThrowingThenSuccessCompletionClient(throwFinding.FindingId),
            enableLlmJudge: true,
            enableEngineJudge: true,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([successFinding, throwFinding], CancellationToken.None);

        successFinding.DecisionConsequence.Should().NotBeNullOrWhiteSpace();
        throwFinding.DecisionConsequence.Should().BeNull();
    }

    [Fact]
    public async Task ApplyToFindingsAsync_when_prefer_high_novelty_false_preserves_default_order()
    {
        Finding firstCoverage = CreatePromotedEngineFinding(
            "coverage-first",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        Finding secondCoverage = CreatePromotedEngineFinding(
            "coverage-second",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);

        JudgedFindingIdsCompletionClient judgingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 1,
            preferHighNoveltyEngines: false,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([firstCoverage, secondCoverage], CancellationToken.None);

        judgingClient.JudgedFindingIds.Should().ContainSingle().Which.Should().Be("coverage-first");
    }

    [Fact]
    public async Task ApplyToFindingsAsync_when_prefer_high_novelty_true_prefers_higher_rate_engine()
    {
        Finding lowRateFinding = CreatePromotedEngineFinding(
            "low-rate",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        Finding highRateFinding = CreatePromotedEngineFinding(
            "high-rate",
            engineType: "review-pack-gap",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);

        JudgedFindingIdsCompletionClient judgingClient = new();
        StubNoveltyRateRepository repository = new()
        {
            Rates =
            {
                ["topology-coverage"] = 0.0,
                ["review-pack-gap"] = 0.8,
            },
        };

        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 1,
            preferHighNoveltyEngines: true,
            insightSignalRepository: repository,
            scopeContextProvider: new FixedScopeContextProvider(new ScopeContext { TenantId = Guid.NewGuid() }),
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([lowRateFinding, highRateFinding], CancellationToken.None);

        judgingClient.JudgedFindingIds.Should().ContainSingle().Which.Should().Be("high-rate");
    }

    [Fact]
    public async Task ApplyToFindingsAsync_novelty_repository_uses_current_tenant_scope()
    {
        Guid tenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        TenantScopedNoveltyRateRepository repository = new();
        repository.SetRates(tenantA, "topology-coverage", 0.0);
        repository.SetRates(tenantA, "custom-engine-a", 0.9);
        repository.SetRates(tenantB, "custom-engine-b", 0.9);

        Finding tenantAFinding = CreatePromotedEngineFinding(
            "tenant-a-low",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        Finding tenantAHighFinding = CreatePromotedEngineFinding(
            "tenant-a-high",
            engineType: "custom-engine-a",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);

        JudgedFindingIdsCompletionClient judgingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 1,
            preferHighNoveltyEngines: true,
            insightSignalRepository: repository,
            scopeContextProvider: new FixedScopeContextProvider(new ScopeContext { TenantId = tenantA }),
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([tenantAFinding, tenantAHighFinding], CancellationToken.None);

        judgingClient.JudgedFindingIds.Should().ContainSingle().Which.Should().Be("tenant-a-high");
    }

    [Fact]
    public async Task ApplyToFindingsAsync_novelty_repository_failure_falls_back_to_default_order()
    {
        Finding firstCoverage = CreatePromotedEngineFinding(
            "coverage-first",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        Finding secondCoverage = CreatePromotedEngineFinding(
            "coverage-second",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);

        JudgedFindingIdsCompletionClient judgingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 1,
            preferHighNoveltyEngines: true,
            insightSignalRepository: new ThrowingNoveltyRateRepository(),
            scopeContextProvider: new FixedScopeContextProvider(new ScopeContext { TenantId = Guid.NewGuid() }),
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([firstCoverage, secondCoverage], CancellationToken.None);

        judgingClient.JudgedFindingIds.Should().ContainSingle().Which.Should().Be("coverage-first");
    }

    [Fact]
    public void SelectEngineJudgedCandidates_orders_by_preferred_then_novelty_then_severity()
    {
        Finding lowRate = CreatePromotedEngineFinding(
            "low-rate",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        Finding highRate = CreatePromotedEngineFinding(
            "high-rate",
            engineType: "review-pack-gap",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);

        Dictionary<string, double> rates = new(StringComparer.OrdinalIgnoreCase)
        {
            ["topology-coverage"] = 0.0,
            ["review-pack-gap"] = 0.8,
        };

        (IReadOnlyList<Finding> judged, int skipped) = InsightDensityJudgeCandidateSelector.SelectEngineJudgedCandidates(
            [lowRate, highRate],
            maxJudgedFindingsPerSnapshot: 1,
            rates);

        skipped.Should().Be(1);
        judged.Should().ContainSingle().Which.FindingId.Should().Be("high-rate");
    }

    [Fact]
    public void SelectEngineJudgedCandidates_orders_by_verification_prior_when_flag_enabled()
    {
        Finding lowRate = CreatePromotedEngineFinding(
            "low-verification",
            engineType: "topology-coverage",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);
        Finding highRate = CreatePromotedEngineFinding(
            "high-verification",
            engineType: "review-pack-gap",
            severity: FindingSeverity.Warning,
            insightDensityScore: 50);

        Dictionary<string, double> verificationRates = new(StringComparer.OrdinalIgnoreCase)
        {
            ["topology-coverage"] = 0.2,
            ["review-pack-gap"] = 0.9,
        };

        (IReadOnlyList<Finding> judged, int skipped) = InsightDensityJudgeCandidateSelector.SelectEngineJudgedCandidates(
            [lowRate, highRate],
            maxJudgedFindingsPerSnapshot: 1,
            noveltyRatesByEngineType: null,
            verificationPriorRatesByEngineType: verificationRates);

        skipped.Should().Be(1);
        judged.Should().ContainSingle().Which.FindingId.Should().Be("high-verification");
    }

    [Fact]
    public void ResolveVerificationPriorRate_uses_neutral_prior_for_missing_engine()
    {
        Dictionary<string, double> rates = new(StringComparer.OrdinalIgnoreCase)
        {
            ["known-engine"] = 0.9,
        };

        InsightDensityVerificationPriorLookup.ResolveVerificationPriorRate("unknown-engine", rates)
            .Should()
            .Be(EngineVerificationConfirmedRateAggregation.NeutralPriorRate);
    }

    [Fact]
    public async Task ApplyToFindingsAsync_remaining_zero_budget_skips_all_candidates()
    {
        List<Finding> findings = Enumerable.Range(0, 10)
            .Select(index => CreatePromotedEngineFinding($"engine-{index:D2}"))
            .ToList();

        CountingCompletionClient countingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            countingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 40,
            reasoningDeployment: "reasoning-deploy",
            scopeContextProvider: new FixedScopeContextProvider(new ScopeContext { TenantId = Guid.NewGuid() }),
            budgetPolicyResolver: new FixedBudgetPolicyResolver(remainingUsd: 0m),
            costEstimator: new FixedJudgeCostEstimator(0.10m));

        InsightDensityLlmJudgeApplyResult result = await judge.ApplyToFindingsAsync(findings, CancellationToken.None);

        countingClient.CallCount.Should().Be(0);
        result.SkippedByCap.Should().Be(10);
        result.JudgeConfiguredCap.Should().Be(40);
        result.JudgeEffectiveCap.Should().Be(0);
    }

    [Fact]
    public async Task ApplyToFindingsAsync_remaining_budget_shrinks_cap_before_selection()
    {
        List<Finding> findings = Enumerable.Range(0, 10)
            .Select(index => CreatePromotedEngineFinding($"engine-{index:D2}"))
            .ToList();

        JudgedFindingIdsCompletionClient judgingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 40,
            reasoningDeployment: "reasoning-deploy",
            scopeContextProvider: new FixedScopeContextProvider(new ScopeContext { TenantId = Guid.NewGuid() }),
            budgetPolicyResolver: new FixedBudgetPolicyResolver(remainingUsd: 0.30m),
            costEstimator: new FixedJudgeCostEstimator(0.10m));

        InsightDensityLlmJudgeApplyResult result = await judge.ApplyToFindingsAsync(findings, CancellationToken.None);

        judgingClient.CallCount.Should().Be(3);
        result.SkippedByCap.Should().Be(7);
        result.JudgeConfiguredCap.Should().Be(40);
        result.JudgeEffectiveCap.Should().Be(3);
    }

    [Fact]
    public async Task ApplyToFindingsAsync_null_budget_resolver_keeps_configured_cap()
    {
        List<Finding> findings = Enumerable.Range(0, 10)
            .Select(index => CreatePromotedEngineFinding($"engine-{index:D2}"))
            .ToList();

        JudgedFindingIdsCompletionClient judgingClient = new();
        PremiumInsightDensityLlmJudge judge = CreateJudge(
            judgingClient,
            enableLlmJudge: true,
            enableEngineJudge: true,
            maxJudged: 40,
            reasoningDeployment: "reasoning-deploy");

        InsightDensityLlmJudgeApplyResult result = await judge.ApplyToFindingsAsync(findings, CancellationToken.None);

        judgingClient.CallCount.Should().Be(10);
        result.SkippedByCap.Should().Be(0);
        result.JudgeConfiguredCap.Should().BeNull();
        result.JudgeEffectiveCap.Should().BeNull();
    }

    private sealed class FixedBudgetPolicyResolver(decimal remainingUsd) : ITenantAiBudgetPolicyResolver
    {
        public Task<TenantAiBudgetPolicySnapshot> ResolveAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
            Task.FromResult(new TenantAiBudgetPolicySnapshot
            {
                RemainingAmountUsd = remainingUsd,
            });

        public Task<AiUsageWorkspaceKind> ResolveWorkspaceKindAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
            Task.FromResult(AiUsageWorkspaceKind.Paid);
    }

    private sealed class FixedJudgeCostEstimator(decimal costUsd) : ILlmCostEstimator
    {
        public decimal? EstimateUsd(
            int inputTokens,
            int outputTokens,
            int reasoningTokens = 0,
            string? deploymentLabel = null,
            string? modelAliasId = null) => costUsd;
    }

    private static Finding CreatePromotedEngineFinding(
        string findingId = "engine-f1",
        string engineType = "topology",
        FindingSeverity severity = FindingSeverity.Warning,
        int insightDensityScore = 55)
    {
        return new Finding
        {
            FindingId = findingId,
            EngineType = engineType,
            Category = "Security",
            Title = "Overdue deferral on payments-api",
            Rationale = "Revisit date passed for payments-api deferral.",
            FindingType = "test",
            Severity = severity,
            Treatment = FindingTreatment.Promote,
            Classification = FindingClassification.DecisionGradeFinding,
            InsightDensityScore = insightDensityScore,
            RelatedNodeIds = ["payments-api-node"],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = ["payments-api-node"],
                RulesApplied = ["open-commitment.overdue-deferral"],
            },
        };
    }

    private static ArchitectureFinding CreatePromotedFinding()
    {
        return new ArchitectureFinding
        {
            FindingId = "f1",
            Message = "SecretManagementUnderSpecified",
            Severity = FindingSeverity.Warning,
            Treatment = FindingTreatment.Promote,
            Classification = FindingClassification.DecisionGradeFinding,
            InsightDensityScore = 72,
            EvidenceRefs = ["doc:manifest.json#services"],
        };
    }

    private static PremiumInsightDensityLlmJudge CreateJudge(
        IAgentCompletionClient completionClient,
        bool enableLlmJudge,
        string? reasoningDeployment,
        bool enableEngineJudge = false,
        int maxJudged = 12,
        bool preferHighNoveltyEngines = false,
        bool preferHighVerificationEngines = false,
        IFindingInsightSignalRepository? insightSignalRepository = null,
        IAppendOnlyFindingVerificationReportRepository? verificationReportRepository = null,
        IScopeContextProvider? scopeContextProvider = null,
        ITenantAiBudgetPolicyResolver? budgetPolicyResolver = null,
        ILlmCostEstimator? costEstimator = null)
    {
        Dictionary<string, string?> configValues = new(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(reasoningDeployment))
        {
            configValues["Llm:Deployments:Reasoning"] = reasoningDeployment;
        }

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues!)
            .Build();

        TieredAgentCompletionRouter router = new(
            new AgentModelTierResolver(
                configuration,
                new FixedValueOptionsMonitor<AgentModelTierOptions>(new AgentModelTierOptions())),
            _ => completionClient);

        return new PremiumInsightDensityLlmJudge(
            router,
            new FixedValueOptionsMonitor<AgentModelTierOptions>(new AgentModelTierOptions()),
            new FixedInsightDensityGateOptionsResolver(
                new InsightDensityGateOptions
                {
                    EnableLlmJudge = enableLlmJudge,
                    EnableLlmJudgeForEngineFindings = enableEngineJudge,
                    MaxJudgedFindingsPerSnapshot = maxJudged,
                    PreferHighNoveltyEngines = preferHighNoveltyEngines,
                    PreferHighVerificationEngines = preferHighVerificationEngines,
                }),
            configuration,
            insightSignalRepository,
            verificationReportRepository,
            scopeContextProvider,
            budgetPolicyResolver,
            costEstimator,
            TimeProvider.System,
            NullLogger<PremiumInsightDensityLlmJudge>.Instance);
    }

    private sealed class FixedInsightDensityGateOptionsResolver(InsightDensityGateOptions options)
        : IInsightDensityGateOptionsResolver
    {
        public InsightDensityGateOptions Resolve(CancellationToken cancellationToken = default) => options;
    }

    private sealed class ThrowingThenSuccessCompletionClient : IAgentCompletionClient
    {
        private readonly string _throwFindingId;

        public ThrowingThenSuccessCompletionClient(string throwFindingId)
        {
            _throwFindingId = throwFindingId;
        }

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("throw-success", "throw-success");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            if (userPrompt.Contains(_throwFindingId, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Simulated judge failure.");
            }

            return Task.FromResult("""
                                   {
                                     "findingId": "engine-ok",
                                     "insightDensityScore": 88,
                                     "whyThisIsNotGeneric": "Names concrete gap.",
                                     "principalArchitectValue": "Blocks rollout.",
                                     "decisionConsequence": "Defer release.",
                                     "demoteToChecklist": false,
                                     "evidenceRefs": ["payments-api-node"]
                                   }
                                   """);
        }
    }

    private sealed class JudgedFindingIdsCompletionClient : IAgentCompletionClient
    {
        public int CallCount
        {
            get;
            private set;
        }

        public HashSet<string> JudgedFindingIds { get; } = new(StringComparer.Ordinal);

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("judged-ids", "judged-ids");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            CallCount++;

            const string marker = "\"findingId\": \"";
            int start = userPrompt.IndexOf(marker, StringComparison.Ordinal);

            if (start >= 0)
            {
                start += marker.Length;
                int end = userPrompt.IndexOf('"', start);

                if (end > start)
                {
                    JudgedFindingIds.Add(userPrompt[start..end]);
                }
            }

            return Task.FromResult("{}");
        }
    }

    private sealed class CountingCompletionClient : IAgentCompletionClient
    {
        public int CallCount
        {
            get;
            private set;
        }

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("counting", "counting");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            CallCount++;

            return Task.FromResult("{}");
        }
    }

    private sealed class FixedScopeContextProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() => scope;
    }

    private sealed class StubNoveltyRateRepository : IFindingInsightSignalRepository
    {
        public Dictionary<string, double> Rates { get; } = new(StringComparer.OrdinalIgnoreCase);

        public Task<FindingInsightSignalInsertResult> TryInsertAsync(
            FindingInsightSignalSubmission submission,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<FindingInsightSignalKind>> ListKindsForUserAsync(
            Guid tenantId,
            Guid runId,
            string findingId,
            string userId,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<EngineInsightNoveltyRateRow>> ListNoveltyRatesAsync(
            ScopeContext scope,
            DateTime fromUtc,
            DateTime toUtcExclusive,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<EngineInsightNoveltyRateRow> rows = Rates
                .Select(static pair => new EngineInsightNoveltyRateRow
                {
                    EngineType = pair.Key,
                    DecisionGradeCount = 10,
                    DidNotThinkOfThatCount = (int)(pair.Value * 10),
                    Rate = pair.Value,
                })
                .ToList();

            return Task.FromResult(rows);
        }
    }

    private sealed class TenantScopedNoveltyRateRepository : IFindingInsightSignalRepository
    {
        private readonly Dictionary<Guid, Dictionary<string, double>> _ratesByTenant = [];

        public void SetRates(Guid tenantId, string engineType, double rate)
        {
            if (!_ratesByTenant.TryGetValue(tenantId, out Dictionary<string, double>? rates))
            {
                rates = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
                _ratesByTenant[tenantId] = rates;
            }

            rates[engineType] = rate;
        }

        public Task<FindingInsightSignalInsertResult> TryInsertAsync(
            FindingInsightSignalSubmission submission,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<FindingInsightSignalKind>> ListKindsForUserAsync(
            Guid tenantId,
            Guid runId,
            string findingId,
            string userId,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<EngineInsightNoveltyRateRow>> ListNoveltyRatesAsync(
            ScopeContext scope,
            DateTime fromUtc,
            DateTime toUtcExclusive,
            CancellationToken cancellationToken = default)
        {
            if (!_ratesByTenant.TryGetValue(scope.TenantId, out Dictionary<string, double>? rates))
            {
                return Task.FromResult<IReadOnlyList<EngineInsightNoveltyRateRow>>([]);
            }

            IReadOnlyList<EngineInsightNoveltyRateRow> rows = rates
                .Select(static pair => new EngineInsightNoveltyRateRow
                {
                    EngineType = pair.Key,
                    DecisionGradeCount = 10,
                    DidNotThinkOfThatCount = (int)(pair.Value * 10),
                    Rate = pair.Value,
                })
                .ToList();

            return Task.FromResult(rows);
        }
    }

    private sealed class ThrowingNoveltyRateRepository : IFindingInsightSignalRepository
    {
        public Task<FindingInsightSignalInsertResult> TryInsertAsync(
            FindingInsightSignalSubmission submission,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<FindingInsightSignalKind>> ListKindsForUserAsync(
            Guid tenantId,
            Guid runId,
            string findingId,
            string userId,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<EngineInsightNoveltyRateRow>> ListNoveltyRatesAsync(
            ScopeContext scope,
            DateTime fromUtc,
            DateTime toUtcExclusive,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Simulated novelty lookup failure.");
    }
}
