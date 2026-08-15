using ArchLucid.Core.Agents;

namespace ArchLucid.Application.Tests.Agents;

public sealed class AgentModelCatalogOfferabilityTests
{
    [Fact]
    public void ExternalSubprocessor_without_disclosure_is_not_registry_visible()
    {
        AgentModelCatalogRow row = BuildRow(
            AgentModelDataBoundaryKind.ExternalSubprocessor,
            externalSubprocessorDisclosureComplete: false);

        Assert.False(AgentModelCatalogOfferability.IsRegistryVisible(row));
    }

    [Fact]
    public void ExternalSubprocessor_with_disclosure_is_registry_visible()
    {
        AgentModelCatalogRow row = BuildRow(
            AgentModelDataBoundaryKind.ExternalSubprocessor,
            externalSubprocessorDisclosureComplete: true);

        Assert.True(AgentModelCatalogOfferability.IsRegistryVisible(row));
    }

    [Fact]
    public void EnsureOfferable_throws_for_undisclosed_external_subprocessor()
    {
        AgentModelCatalogRow row = BuildRow(
            AgentModelDataBoundaryKind.ExternalSubprocessor,
            externalSubprocessorDisclosureComplete: false);

        Assert.Throws<InvalidOperationException>(() => AgentModelCatalogOfferability.EnsureOfferable(row));
    }

    private static AgentModelCatalogRow BuildRow(
        AgentModelDataBoundaryKind boundary,
        bool externalSubprocessorDisclosureComplete) =>
        new()
        {
            AliasId = "test-alias",
            ProviderConnectionKind = "test",
            CapabilityTags = ["structured-output"],
            ApprovedTaskTypes = ["Primary"],
            DataBoundary = boundary,
            ExternalSubprocessorDisclosureComplete = externalSubprocessorDisclosureComplete,
            LifecycleStatus = AgentModelCatalogLifecycleStatus.Available
        };
}
