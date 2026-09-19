using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

public sealed class AzureInventorySnapshotSubscriptionIdentityTests
{
    [Fact]
    public void Resolve_prefers_header_subscription_name_then_manifest_then_sibling()
    {
        (string? subscriptionId, string? subscriptionName) = AzureInventorySnapshotSubscriptionIdentity.Resolve(
            headerSubscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
            headerSubscriptionName: null,
            manifestSubscriptionId: null,
            manifestSubscriptionName: "Manifest Prod",
            siblingSubscriptionName: "Sibling Prod");

        subscriptionId.Should().Be("8aa56f3b-18bc-43ca-ad45-bad9e811d33b");
        subscriptionName.Should().Be("Manifest Prod");
    }

    [Fact]
    public void Resolve_falls_back_to_manifest_subscription_id_when_header_is_missing()
    {
        (string? subscriptionId, string? subscriptionName) = AzureInventorySnapshotSubscriptionIdentity.Resolve(
            headerSubscriptionId: null,
            headerSubscriptionName: null,
            manifestSubscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
            manifestSubscriptionName: "Contoso Production",
            siblingSubscriptionName: null);

        subscriptionId.Should().Be("8aa56f3b-18bc-43ca-ad45-bad9e811d33b");
        subscriptionName.Should().Be("Contoso Production");
    }

    [Fact]
    public void Resolve_uses_sibling_name_when_header_and_manifest_names_are_missing()
    {
        (string? subscriptionId, string? subscriptionName) = AzureInventorySnapshotSubscriptionIdentity.Resolve(
            headerSubscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
            headerSubscriptionName: null,
            manifestSubscriptionId: null,
            manifestSubscriptionName: null,
            siblingSubscriptionName: "Contoso Production");

        subscriptionId.Should().Be("8aa56f3b-18bc-43ca-ad45-bad9e811d33b");
        subscriptionName.Should().Be("Contoso Production");
    }

    [Fact]
    public void Resolve_ignores_guid_like_names()
    {
        (string? subscriptionId, string? subscriptionName) = AzureInventorySnapshotSubscriptionIdentity.Resolve(
            headerSubscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
            headerSubscriptionName: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
            manifestSubscriptionId: null,
            manifestSubscriptionName: "8aa56f3b18bc43caad45bad9e811d33b",
            siblingSubscriptionName: null);

        subscriptionId.Should().Be("8aa56f3b-18bc-43ca-ad45-bad9e811d33b");
        subscriptionName.Should().BeNull();
    }
}
