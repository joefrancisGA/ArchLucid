using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;

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
    public async Task ApplyToFindingsAsync_respects_per_snapshot_cap()
    {
        List<Finding> findings = Enumerable.Range(0, 30)
            .Select(index => CreatePromotedEngineFinding($"engine-f{index}", FindingSeverity.Warning, 40 + index))
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
        Finding successFinding = CreatePromotedEngineFinding("engine-ok", FindingSeverity.Error, 30);
        Finding throwFinding = CreatePromotedEngineFinding("engine-bad", FindingSeverity.Error, 20);

        PremiumInsightDensityLlmJudge judge = CreateJudge(
            new ThrowingThenSuccessCompletionClient(throwFinding.FindingId),
            enableLlmJudge: true,
            enableEngineJudge: true,
            reasoningDeployment: "reasoning-deploy");

        await judge.ApplyToFindingsAsync([successFinding, throwFinding], CancellationToken.None);

        successFinding.DecisionConsequence.Should().NotBeNullOrWhiteSpace();
        throwFinding.DecisionConsequence.Should().BeNull();
    }

    private static Finding CreatePromotedEngineFinding(
        string findingId = "engine-f1",
        FindingSeverity severity = FindingSeverity.Warning,
        int insightDensityScore = 55)
    {
        return new Finding
        {
            FindingId = findingId,
            EngineType = "topology",
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
        int maxJudged = 12)
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
                }),
            configuration,
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
}
