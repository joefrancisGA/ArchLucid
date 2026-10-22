using ArchLucid.AgentSimulator.Scenarios;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AgentSimulator;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EnterpriseRagScenarioProviderTests
{
    private readonly EnterpriseRagScenarioProvider _sut = new();

    [Fact]
    public void CanHandle_true_when_description_mentions_rag()
    {
        ArchitectureRequest request = new()
        {
            SystemName = "Claims",
            Description = "Enterprise RAG over policy documents.",
            RequiredCapabilities = [],
        };

        _sut.CanHandle(request).Should().BeTrue();
        _sut.GetScenarioName(request).Should().Be(EnterpriseRagScenarioProvider.ScenarioName);
    }

    [Fact]
    public void CanHandle_true_when_system_name_contains_rag()
    {
        ArchitectureRequest request = new()
        {
            SystemName = "EnterpriseRagPortal",
            Description = "Internal search portal.",
            RequiredCapabilities = [],
        };

        _sut.CanHandle(request).Should().BeTrue();
    }

    [Fact]
    public void CanHandle_true_when_required_capability_mentions_search()
    {
        ArchitectureRequest request = new()
        {
            SystemName = "Docs",
            Description = "Document assistant.",
            RequiredCapabilities = ["Azure AI Search index"],
        };

        _sut.CanHandle(request).Should().BeTrue();
    }

    [Fact]
    public void CanHandle_false_for_unrelated_request()
    {
        ArchitectureRequest request = new()
        {
            SystemName = "Billing",
            Description = "Payment processing.",
            RequiredCapabilities = ["Service Bus"],
        };

        _sut.CanHandle(request).Should().BeFalse();
        _sut.GetScenarioName(request).Should().BeEmpty();
    }
}
