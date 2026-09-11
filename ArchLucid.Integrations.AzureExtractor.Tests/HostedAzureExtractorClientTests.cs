using ArchLucid.Application.AzureExtractor;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Integrations.AzureExtractor;

using Azure.Core;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

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
        armClient
            .Setup(c => c.TryGetSubscriptionDisplayNameAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("Contoso Production");

        Mock<IEntraGroupMembershipGraphReader> graphReader = new();
        Mock<IOptionsMonitor<EntraGroupMembershipGraphOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EntraGroupMembershipGraphOptions());

        armClient
            .Setup(c => c.ListSubscriptionRoleAssignmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionRoleEligibilitySchedulesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListFederatedCredentialsAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<HostedAzureArmResourceRecord>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionPolicyAssignmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListDiagnosticSettingsAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<HostedAzureArmResourceRecord>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionDefenderSummariesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        HostedAzureExtractorClient sut = new(
            credentialFactory.Object,
            armClient.Object,
            graphReader.Object,
            options.Object,
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

        using MemoryStream stream = new(result.ZipBytes);
        (AzureExtractorNormalizedManifest? manifest, string? error) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(stream);

        Assert.Null(error);
        Assert.NotNull(manifest);
        Assert.Equal("Contoso Production", manifest!.SubscriptionName);
    }

    [Fact]
    public async Task CollectZipAsync_fans_out_management_group_scope()
    {
        Mock<IHostedAzureExtractorCredentialFactory> credentialFactory = new();
        credentialFactory
            .Setup(f => f.CreateCredential(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(new StubTokenCredential());

        const string subOne = "11111111-1111-1111-1111-111111111111";
        const string subTwo = "22222222-2222-2222-2222-222222222222";

        IReadOnlyList<HostedAzureArmResourceRecord> subOneResources =
        [
            new HostedAzureArmResourceRecord(
                ResourceType: "Microsoft.Storage/storageAccounts",
                ResourceId: $"/subscriptions/{subOne}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                Name: "sa1",
                Location: "eastus",
                Sku: null,
                Tags: null,
                Properties: new Dictionary<string, object?> { ["provisioningState"] = "Succeeded" }),
        ];

        IReadOnlyList<HostedAzureArmResourceRecord> subTwoResources =
        [
            new HostedAzureArmResourceRecord(
                ResourceType: "Microsoft.Storage/storageAccounts",
                ResourceId: $"/subscriptions/{subTwo}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa2",
                Name: "sa2",
                Location: "westus",
                Sku: null,
                Tags: null,
                Properties: new Dictionary<string, object?> { ["provisioningState"] = "Succeeded" }),
        ];

        Mock<IHostedAzureArmReadClient> armClient = new();
        armClient
            .Setup(c => c.ListManagementGroupSubscriptionIdsAsync(
                It.IsAny<string>(),
                "corp",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([subOne, subTwo]);
        armClient
            .Setup(c => c.ListManagementGroupRoleAssignmentsAsync(
                It.IsAny<string>(),
                "corp",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new HostedAzureArmRoleAssignmentRecord(
                    "/providers/Microsoft.Management/managementGroups/corp",
                    "33333333-3333-3333-3333-333333333333",
                    "User",
                    "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"),
            ]);
        armClient
            .Setup(c => c.ListManagementGroupRoleEligibilitySchedulesAsync(
                It.IsAny<string>(),
                "corp",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        armClient
            .Setup(c => c.ListManagementGroupPolicyAssignmentsAsync(
                It.IsAny<string>(),
                "corp",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        armClient
            .Setup(c => c.ListSubscriptionPolicyAssignmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        armClient
            .Setup(c => c.ListDiagnosticSettingsAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<HostedAzureArmResourceRecord>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        armClient
            .Setup(c => c.ListSubscriptionDefenderSummariesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        armClient
            .Setup(c => c.ListSubscriptionResourcesAsync(
                It.IsAny<string>(),
                subOne,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(subOneResources);
        armClient
            .Setup(c => c.ListSubscriptionResourcesAsync(
                It.IsAny<string>(),
                subTwo,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(subTwoResources);
        armClient
            .Setup(c => c.ListSubscriptionRoleAssignmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        armClient
            .Setup(c => c.ListSubscriptionRoleEligibilitySchedulesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        armClient
            .Setup(c => c.ListFederatedCredentialsAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<HostedAzureArmResourceRecord>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IEntraGroupMembershipGraphReader> graphReader = new();
        Mock<IOptionsMonitor<EntraGroupMembershipGraphOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EntraGroupMembershipGraphOptions());

        HostedAzureExtractorClient sut = new(
            credentialFactory.Object,
            armClient.Object,
            graphReader.Object,
            options.Object,
            NullLogger<HostedAzureExtractorClient>.Instance);

        HostedAzureExtractorCollectionResult result = await sut.CollectZipAsync(
            new HostedAzureExtractorCollectionRequest
            {
                CustomerTenantId = "44444444-4444-4444-4444-444444444444",
                CustomerAppId = "55555555-5555-5555-5555-555555555555",
                ManagementGroupId = "corp",
                IncludeCost = false,
            },
            CancellationToken.None);

        Assert.Equal(2, result.ResourceCount);
        Assert.Contains("archlucid-hosted-azure-mg-corp-", result.OriginalFileName, StringComparison.Ordinal);

        using MemoryStream stream = new(result.ZipBytes);
        (AzureExtractorNormalizedManifest? manifest, string? error) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(stream);

        Assert.Null(error);
        Assert.NotNull(manifest);
        Assert.Equal(string.Empty, manifest!.SubscriptionId);
        Assert.Equal("/providers/Microsoft.Management/managementGroups/corp", manifest.ScopeDescriptor);
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
