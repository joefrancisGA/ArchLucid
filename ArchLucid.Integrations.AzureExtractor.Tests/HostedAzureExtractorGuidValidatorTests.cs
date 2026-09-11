using ArchLucid.Contracts.Abstractions.Integrations;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureExtractorGuidValidatorTests
{
    private static readonly Guid ValidGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public void RequireAzureGuid_accepts_canonical_guid()
    {
        HostedAzureExtractorGuidValidator.RequireAzureGuid(
            nameof(HostedAzureExtractorCollectionRequest.SubscriptionId),
            ValidGuid.ToString("D"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-a-guid")]
    [InlineData("../../tenants")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public void RequireAzureGuid_rejects_invalid_values(string value)
    {
        ArgumentException ex = Assert.Throws<ArgumentException>(() =>
            HostedAzureExtractorGuidValidator.RequireAzureGuid("subscriptionId", value));

        Assert.Equal("subscriptionId", ex.ParamName);
    }

    [Fact]
    public void RequireCollectionRequestGuids_validates_all_scope_fields()
    {
        HostedAzureExtractorCollectionRequest request = new()
        {
            CustomerTenantId = ValidGuid.ToString("D"),
            CustomerAppId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString("D"),
            SubscriptionId = Guid.Parse("33333333-3333-3333-3333-333333333333").ToString("D"),
            IncludeCost = false,
        };

        HostedAzureExtractorGuidValidator.RequireCollectionRequestGuids(request);
    }

    [Fact]
    public void RequireCollectionRequestGuids_rejects_malformed_subscription_id()
    {
        HostedAzureExtractorCollectionRequest request = new()
        {
            CustomerTenantId = ValidGuid.ToString("D"),
            CustomerAppId = ValidGuid.ToString("D"),
            SubscriptionId = "bad-subscription",
            IncludeCost = false,
        };

        ArgumentException ex = Assert.Throws<ArgumentException>(() =>
            HostedAzureExtractorGuidValidator.RequireCollectionRequestGuids(request));

        Assert.Equal("SubscriptionId", ex.ParamName);
    }

    [Fact]
    public void RequireCollectionRequestGuids_accepts_management_group_scope()
    {
        HostedAzureExtractorCollectionRequest request = new()
        {
            CustomerTenantId = ValidGuid.ToString("D"),
            CustomerAppId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString("D"),
            ManagementGroupId = "corp-prod",
            IncludeCost = false,
        };

        HostedAzureExtractorGuidValidator.RequireCollectionRequestGuids(request);
    }

    [Fact]
    public void RequireCollectionRequestGuids_rejects_both_scope_identifiers()
    {
        HostedAzureExtractorCollectionRequest request = new()
        {
            CustomerTenantId = ValidGuid.ToString("D"),
            CustomerAppId = ValidGuid.ToString("D"),
            SubscriptionId = ValidGuid.ToString("D"),
            ManagementGroupId = "corp",
            IncludeCost = false,
        };

        Assert.Throws<ArgumentException>(() =>
            HostedAzureExtractorGuidValidator.RequireCollectionRequestGuids(request));
    }

    [Theory]
    [InlineData("../corp")]
    [InlineData("corp/prod")]
    public void RequireManagementGroupId_rejects_unsafe_values(string value)
    {
        ArgumentException ex = Assert.Throws<ArgumentException>(() =>
            HostedAzureExtractorGuidValidator.RequireManagementGroupId("managementGroupId", value));

        Assert.Equal("managementGroupId", ex.ParamName);
    }
}
