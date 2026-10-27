using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class WorkloadConditionedRequirementExpectationResolverTests
{
    [Fact]
    public void ResolveExpectedThemes_WhenIdentityScope_AddsIdentityAccessTheme()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = "identity|sso"
                    }
                }
            ]
        };

        IReadOnlyList<string> themes = WorkloadConditionedRequirementExpectationResolver.ResolveExpectedThemes(graph);

        themes.Should().Contain("identity-access");
    }

    [Fact]
    public void ResolveExpectedThemes_WhenTopologyHintMentionsSubprocessors_DoesNotAddIdentityAccessFromSsoSubstring()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.TopologyHints] =
                            "Call out subprocessors: Azure OpenAI, AI Search, and any third-party eval tools as architecture dependencies only"
                    }
                }
            ]
        };

        IReadOnlyList<string> themes = WorkloadConditionedRequirementExpectationResolver.ResolveExpectedThemes(graph);

        themes.Should().NotContain("identity-access");
    }

    [Fact]
    public void ResolveRequirementTheme_WhenTextMentionsSubprocessors_DoesNotReturnIdentityAccessFromSsoSubstring()
    {
        GraphNode requirement = new()
        {
            NodeId = "req-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "REQ-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = "Call out subprocessors: Azure OpenAI and AI Search in the diligence packet"
            }
        };

        WorkloadConditionedRequirementExpectationResolver.ResolveRequirementTheme(requirement)
            .Should()
            .NotBe("identity-access");
    }

    [Fact]
    public void ResolveExpectedThemes_WhenConstraintMentionsNonNetworkSandbox_DoesNotAddNetworkIsolationTheme()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] =
                            "Azure Functions serverless queue event processing",
                        [ContextGraphPropertyKeys.Constraints] =
                            "non-network sandbox integrations only"
                    }
                }
            ]
        };

        IReadOnlyList<string> themes = WorkloadConditionedRequirementExpectationResolver.ResolveExpectedThemes(graph);

        themes.Should().NotContain("network-isolation");
    }

    [Fact]
    public void ResolveExpectedThemes_WhenConstraintSaysDoNotRequirePrivateEndpoint_DoesNotAddNetworkIsolationTheme()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] =
                            "Azure Functions serverless queue event processing",
                        [ContextGraphPropertyKeys.Constraints] =
                            "Do not require private endpoint connectivity for sandbox integrations"
                    }
                }
            ]
        };

        IReadOnlyList<string> themes = WorkloadConditionedRequirementExpectationResolver.ResolveExpectedThemes(graph);

        themes.Should().NotContain("network-isolation");
    }

    [Fact]
    public void ResolveExpectedThemes_WhenConstraintSaysNoPrivateLinkRequired_DoesNotAddNetworkIsolationTheme()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] =
                            "Azure Functions serverless queue event processing",
                        [ContextGraphPropertyKeys.Constraints] =
                            "No private link required for this integration workload"
                    }
                }
            ]
        };

        IReadOnlyList<string> themes = WorkloadConditionedRequirementExpectationResolver.ResolveExpectedThemes(graph);

        themes.Should().NotContain("network-isolation");
    }

    [Fact]
    public void ResolveExpectedThemes_WhenConstraintSaysNoVpnRequired_DoesNotAddNetworkIsolationTheme()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] =
                            "Azure Functions serverless queue event processing",
                        [ContextGraphPropertyKeys.Constraints] = "No VPN required for dev sandboxes"
                    }
                }
            ]
        };

        IReadOnlyList<string> themes = WorkloadConditionedRequirementExpectationResolver.ResolveExpectedThemes(graph);

        themes.Should().NotContain("network-isolation");
    }

    [Fact]
    public void ResolveRequirementTheme_WhenTextMentionsEncryption_ReturnsDataProtection()
    {
        GraphNode requirement = new()
        {
            NodeId = "req-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "REQ-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["text"] = "Encrypt customer data at rest"
            }
        };

        WorkloadConditionedRequirementExpectationResolver.ResolveRequirementTheme(requirement)
            .Should().Be("data-protection");
    }
}
