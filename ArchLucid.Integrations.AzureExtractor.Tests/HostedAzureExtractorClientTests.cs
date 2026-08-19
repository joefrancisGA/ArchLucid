using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Integrations.AzureExtractor;

using Azure.Core;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureExtractorClientTests
{
    [Fact]
    public async Task CollectZipAsync_builds_zip_from_arm_resources()
    {
        Mock<IHostedAzureExtractorCredentialFactory> credentialFactory = new();
        credentialFactory
            .Setup(f => f.CreateCredential(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(new StubTokenCredential());

        IReadOnlyList<HostedAzureArmResourceRecord> resources =
        [
            new HostedAzureArmResourceRecord(
                ResourceType: "Microsoft.Storage/storageAccounts",
                ResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                Name: "sa1",
                Location: "eastus",
                Sku: null,
                Tags: null,
                Properties: new Dictionary<string, object?> { ["provisioningState"] = "Succeeded" }),
        ];

        Mock<IHostedAzureArmReadClient> armClient = new();
        armClient
            .Setup(c => c.ListSubscriptionResourcesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(resources);

        HostedAzureExtractorClient sut = new(
            credentialFactory.Object,
            armClient.Object,
            NullLogger<HostedAzureExtractorClient>.Instance);

        HostedAzureExtractorCollectionRequest request = new()
        {
            CustomerTenantId = "22222222-2222-2222-2222-222222222222",
            CustomerAppId = "33333333-3333-3333-3333-333333333333",
            SubscriptionId = "11111111-1111-1111-1111-111111111111",
            IncludeCost = true,
        };

        HostedAzureExtractorCollectionResult result = await sut.CollectZipAsync(request, CancellationToken.None);

        Assert.Equal(1, result.ResourceCount);
        Assert.NotEmpty(result.ZipBytes);
        Assert.Contains("11111111-1111-1111-1111-111111111111", result.OriginalFileName);
    }

    private sealed class StubTokenCredential : TokenCredential
    {
        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken) =>
            new("token", DateTimeOffset.UtcNow.AddHours(1));

        public override ValueTask<AccessToken> GetTokenAsync(
            TokenRequestContext requestContext,
            CancellationToken cancellationToken) =>
            new(GetToken(requestContext, cancellationToken));
    }
}
