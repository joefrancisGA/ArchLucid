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
        string? reasoningDeployment)
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
            new FixedValueOptionsMonitor<InsightDensityGateOptions>(
                new InsightDensityGateOptions { EnableLlmJudge = enableLlmJudge }),
            new FixedValueOptionsMonitor<AgentModelTierOptions>(new AgentModelTierOptions()),
            configuration,
            NullLogger<PremiumInsightDensityLlmJudge>.Instance);
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
