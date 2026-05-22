using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;
[Trait("Category", "Unit")]

public sealed class HostedAzureExtractorConfigurationServiceTests
{
    [Fact]
    public async Task ConfigureAsync_persists_without_client_secret_fields()
    {
        InMemoryTenantHostedExtractorConfigurationRepository repository = new();
        HostedAzureExtractorConfigurationService service = new(repository);

        Guid tenantId = Guid.NewGuid();
        const string customerTenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
        const string customerAppId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
        const string subscriptionId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

        TenantHostedExtractorConfigurationRecord record = await service.ConfigureAsync(
            tenantId,
            "actor@test",
            new HostedAzureExtractorConfigureRequest
            {
                CustomerTenantId = customerTenantId,
                CustomerAppId = customerAppId,
                SubscriptionId = subscriptionId,
                IncludeCost = true
            },
            CancellationToken.None);

        Assert.Equal(customerTenantId, record.CustomerTenantId);
        Assert.Equal(customerAppId, record.CustomerAppId);
        Assert.Equal(subscriptionId.ToLowerInvariant(), record.SubscriptionId);

        TenantHostedExtractorConfigurationRecord? loaded = await repository.TryGetAsync(
            tenantId,
            subscriptionId,
            CancellationToken.None);

        Assert.NotNull(loaded);
        Assert.True(loaded.IncludeCost);
    }

    [Fact]
    public async Task ConfigureAsync_rejects_non_guid_app_id()
    {
        HostedAzureExtractorConfigurationService service =
            new(new InMemoryTenantHostedExtractorConfigurationRepository());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ConfigureAsync(
                Guid.NewGuid(),
                "actor@test",
                new HostedAzureExtractorConfigureRequest
                {
                    CustomerTenantId = Guid.NewGuid().ToString(),
                    CustomerAppId = "not-a-guid",
                    SubscriptionId = Guid.NewGuid().ToString(),
                    IncludeCost = false
                },
                CancellationToken.None));
    }
}
