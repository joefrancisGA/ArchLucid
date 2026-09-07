using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Retrieval;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class PremiumInsightFindingGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_in_real_mode_with_valid_refs_appends_finding()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-node",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payments-db",
                },
            ],
        };

        List<Finding> engineFindings =
        [
            new()
            {
                FindingType = "DeclarationPremiseConflictFinding",
                Category = "Security",
                EngineType = "declaration-premise-conflict",
                Severity = FindingSeverity.Warning,
                Title = "HTTPS mismatch on payments-db",
                Rationale = "Declaration disables HTTPS while baseline requires transport security.",
                Trace = new ExplainabilityTrace
                {
                    Notes = ["evidence:graph-node:sql-node"],
                },
            },
        ];

        const string completionJson = """
                                      {
                                        "findings": [
                                          {
                                            "title": "Payments DB transport conflict remains exploitable",
                                            "rationale": "Declaration and baseline disagree on HTTPS for payments-db.",
                                            "severity": "Warning",
                                            "category": "Security",
                                            "evidenceRefs": ["graph-node:sql-node"]
                                          }
                                        ]
                                      }
                                      """;

        PremiumInsightFindingGenerator generator = CreateGenerator(
            new StubAgentCompletionClient(completionJson),
            executionMode: DevAgentExecutionModeHeaderNames.Real,
            enableInsightGenerator: true);

        IReadOnlyList<Finding> generated = await generator.GenerateAsync(
            engineFindings,
            graph,
            analysisContext: null,
            CancellationToken.None);

        Finding finding = generated.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("insight-generator");
        finding.FindingType.Should().Be(InsightDensityFindingSourceClassifier.InsightGeneratorFindingType);
        finding.RelatedNodeIds.Should().ContainSingle().Which.Should().Be("sql-node");
        finding.Trace.Notes.Should().Contain("evidence:graph-node:sql-node");
    }

    [Fact]
    public async Task GenerateAsync_drops_proposals_with_unlisted_evidence_refs()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-node",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payments-db",
                },
            ],
        };

        const string completionJson = """
                                      {
                                        "findings": [
                                          {
                                            "title": "Invented evidence",
                                            "rationale": "Should be dropped.",
                                            "severity": "Warning",
                                            "category": "Security",
                                            "evidenceRefs": ["doc:made-up.json#section"]
                                          }
                                        ]
                                      }
                                      """;

        PremiumInsightFindingGenerator generator = CreateGenerator(
            new StubAgentCompletionClient(completionJson),
            executionMode: DevAgentExecutionModeHeaderNames.Real,
            enableInsightGenerator: true);

        IReadOnlyList<Finding> generated = await generator.GenerateAsync(
            [],
            graph,
            analysisContext: null,
            CancellationToken.None);

        generated.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateAsync_when_community_summarization_disabled_omits_community_prompt_lines()
    {
        GraphSnapshot graph = CreatePaymentsGraph();
        CapturingCompletionClient capturingClient = new("""{"findings":[]}""");

        PremiumInsightFindingGenerator generator = CreateGenerator(
            capturingClient,
            executionMode: DevAgentExecutionModeHeaderNames.Real,
            enableInsightGenerator: true,
            enableCommunitySummarization: false);

        await generator.GenerateAsync([], graph, analysisContext: null, CancellationToken.None);

        capturingClient.LastUserPrompt.Should().NotBeNull();
        capturingClient.LastUserPrompt.Should().NotContain("Community summaries");
        capturingClient.LastUserPrompt.Should().NotContain("community:");
    }

    [Fact]
    public async Task GenerateAsync_when_community_summarization_enabled_keeps_allowlisted_community_refs()
    {
        GraphSnapshot graph = CreatePaymentsGraph();
        const string completionJson = """
                                      {
                                        "findings": [
                                          {
                                            "title": "PCI community egress risk",
                                            "rationale": "Community summary cites public Function hostname.",
                                            "severity": "Warning",
                                            "category": "Security",
                                            "evidenceRefs": ["community:community-0"]
                                          },
                                          {
                                            "title": "Invented community",
                                            "rationale": "Should be dropped.",
                                            "severity": "Warning",
                                            "category": "Security",
                                            "evidenceRefs": ["community:other"]
                                          }
                                        ]
                                      }
                                      """;

        CapturingCompletionClient capturingClient = new(completionJson);
        StubCommunitySummaryLookup lookup = new(
        [
            new InsightGeneratorCommunitySummary
            {
                CommunityId = "community-0",
                Summary = "PCI payment community egresses through a public Function hostname.",
            },
        ]);

        PremiumInsightFindingGenerator generator = CreateGenerator(
            capturingClient,
            executionMode: DevAgentExecutionModeHeaderNames.Real,
            enableInsightGenerator: true,
            enableCommunitySummarization: true,
            communitySummaryLookup: lookup);

        IReadOnlyList<Finding> generated = await generator.GenerateAsync(
            [],
            graph,
            analysisContext: null,
            CancellationToken.None);

        Finding finding = generated.Should().ContainSingle().Subject;
        finding.Title.Should().Be("PCI community egress risk");
        finding.Trace.Notes.Should().Contain("evidence:community:community-0");

        capturingClient.LastUserPrompt.Should().Contain("community:community-0");
        capturingClient.LastUserPrompt.Should().Contain("PCI payment community egresses through a public Function hostname.");
    }

    [Fact]
    public async Task GenerateAsync_in_simulator_mode_is_no_op()
    {
        CountingCompletionClient countingClient = new();
        PremiumInsightFindingGenerator generator = CreateGenerator(
            countingClient,
            executionMode: DevAgentExecutionModeHeaderNames.Simulator,
            enableInsightGenerator: true);

        IReadOnlyList<Finding> generated = await generator.GenerateAsync(
            [],
            new GraphSnapshot
            {
                Nodes =
                [
                    new GraphNode
                    {
                        NodeId = "n1",
                        NodeType = GraphNodeTypes.TopologyResource,
                        Label = "app",
                    },
                ],
            },
            analysisContext: null,
            CancellationToken.None);

        generated.Should().BeEmpty();
        countingClient.CompletionCount.Should().Be(0);
    }

    [Fact]
    public void InsightGeneratorFindingParser_parses_valid_json()
    {
        const string json = """
                              {
                                "findings": [
                                  {
                                    "title": "Title",
                                    "rationale": "Because",
                                    "severity": "Warning",
                                    "category": "Security",
                                    "evidenceRefs": ["graph-node:n1"]
                                  }
                                ]
                              }
                              """;

        IReadOnlyList<InsightGeneratorProposal> proposals = InsightGeneratorFindingParser.TryParse(json, maxFindings: 8);

        proposals.Should().ContainSingle();
        proposals[0].EvidenceRefs.Should().ContainSingle().Which.Should().Be("graph-node:n1");
    }

    private static GraphSnapshot CreatePaymentsGraph()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-node",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payments-db",
                },
            ],
        };
    }

    private static PremiumInsightFindingGenerator CreateGenerator(
        IAgentCompletionClient completionClient,
        string executionMode,
        bool enableInsightGenerator,
        bool enableCommunitySummarization = false,
        IGraphCommunitySummaryLookup? communitySummaryLookup = null)
    {
        StubAgentTierCompletionRouter router = new(completionClient);
        StubExecutionModeAccessor modeAccessor = new(executionMode);
        StubGateOptionsResolver optionsResolver = new(enableInsightGenerator);
        IGraphCommunitySummaryLookup lookup = communitySummaryLookup ?? new StubCommunitySummaryLookup([]);

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Llm:Deployments:Reasoning"] = "reasoning-deploy" })
            .Build();

        AgentModelTierOptions tierOptions = new() { PremiumDeploymentName = "reasoning-deploy" };
        AdvancedRetrievalOptions retrievalOptions = new()
        {
            Enabled = true,
            EnableCommunitySummarization = enableCommunitySummarization,
        };

        return new PremiumInsightFindingGenerator(
            router,
            new StubTierOptionsMonitor(tierOptions),
            optionsResolver,
            modeAccessor,
            lookup,
            new StubAdvancedRetrievalOptionsMonitor(retrievalOptions),
            configuration,
            NullLogger<PremiumInsightFindingGenerator>.Instance);
    }

    private sealed class StubTierOptionsMonitor(AgentModelTierOptions value) : IOptionsMonitor<AgentModelTierOptions>
    {
        public AgentModelTierOptions CurrentValue => value;

        public AgentModelTierOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<AgentModelTierOptions, string?> listener) => null;
    }

    private sealed class StubAgentTierCompletionRouter(IAgentCompletionClient client) : IAgentTierCompletionRouter
    {
        public IAgentCompletionClient DefaultCompletionClient => client;

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
            AgentType agentType,
            LlmModelTier? taskTierOverride) => (client, LlmModelTier.Premium);

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgentTypeName(
            string agentTypeName,
            LlmModelTier? taskTierOverride = null) => (client, LlmModelTier.Premium);
    }

    private sealed class StubExecutionModeAccessor(string mode) : IEffectiveAgentExecutionModeAccessor
    {
        public string GetEffectiveMode() => mode;
    }

    private sealed class StubGateOptionsResolver(bool enableInsightGenerator) : IInsightDensityGateOptionsResolver
    {
        public InsightDensityGateOptions Resolve(CancellationToken cancellationToken = default) => new()
        {
            EnableInsightGenerator = enableInsightGenerator,
            MaxGeneratedInsightFindingsPerSnapshot = 8,
        };
    }

    private sealed class StubAdvancedRetrievalOptionsMonitor(AdvancedRetrievalOptions value)
        : IOptionsMonitor<AdvancedRetrievalOptions>
    {
        public AdvancedRetrievalOptions CurrentValue => value;

        public AdvancedRetrievalOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<AdvancedRetrievalOptions, string?> listener) => null;
    }

    private sealed class StubCommunitySummaryLookup(IReadOnlyList<InsightGeneratorCommunitySummary> summaries)
        : IGraphCommunitySummaryLookup
    {
        public Task<IReadOnlyList<InsightGeneratorCommunitySummary>> GetSummariesAsync(
            GraphSnapshot graphSnapshot,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(summaries);
        }
    }

    private sealed class CapturingCompletionClient(string json) : IAgentCompletionClient
    {
        public string? LastUserPrompt
        {
            get;
            private set;
        }

        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("capturing", "capturing");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            LastUserPrompt = userPrompt;
            return Task.FromResult(json);
        }
    }

    private sealed class CountingCompletionClient : IAgentCompletionClient
    {
        public int CompletionCount
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
            CompletionCount++;
            return Task.FromResult("""{"findings":[]}""");
        }
    }
}
