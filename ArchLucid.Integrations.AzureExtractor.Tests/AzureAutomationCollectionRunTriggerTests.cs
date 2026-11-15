using System.Net;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;
using ArchLucid.Persistence.AzureExtractor;

using Azure.Core;

using Microsoft.Extensions.Options;

using Moq;
using Moq.Protected;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

public sealed class AzureAutomationCollectionRunTriggerTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task TriggerAsync_selects_requested_subscription_or_defaults_to_latest(bool requestOlderSubscription)
    {
        const string olderSubscription = "11111111-aaaa-4444-8888-111111111111";
        const string newerSubscription = "22222222-bbbb-4444-8888-222222222222";
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        InMemoryTenantHostedExtractorConfigurationRepository repository = new();
        TenantHostedExtractorConfigurationRecord older = new()
        {
            TenantId = scope.TenantId,
            SubscriptionId = olderSubscription,
            CustomerTenantId = "older-tenant",
            CustomerAppId = "older-app",
            UpdatedUtc = DateTime.UnixEpoch,
        };
        TenantHostedExtractorConfigurationRecord newer = new()
        {
            TenantId = scope.TenantId,
            SubscriptionId = newerSubscription,
            CustomerTenantId = "newer-tenant",
            CustomerAppId = "newer-app",
            UpdatedUtc = DateTime.UnixEpoch.AddDays(1),
        };
        await repository.UpsertAsync(older, CancellationToken.None);
        await repository.UpsertAsync(newer, CancellationToken.None);
        TenantHostedExtractorConfigurationRecord expected = requestOlderSubscription ? older : newer;

        Mock<TokenCredential> credential = new();
        credential.Setup(x => x.GetTokenAsync(It.IsAny<TokenRequestContext>(), It.IsAny<CancellationToken>()))
            .Returns(ValueTask.FromResult(new AccessToken("test-token", DateTimeOffset.MaxValue)));
        Mock<IHostedAzureExtractorCredentialFactory> credentials = new();
        credentials.Setup(x => x.CreateCredential(expected.CustomerTenantId, expected.CustomerAppId))
            .Returns(credential.Object);
        Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
        options.SetupGet(x => x.CurrentValue).Returns(new HostedAzureExtractorOptions
        {
            Enabled = true,
            AutomationSubscriptionId = "automation-subscription",
            AutomationResourceGroupName = "resource-group",
            AutomationAccountName = "account",
            AutomationRunbookName = "runbook",
        });
        Mock<HttpMessageHandler> handler = new();
        handler.Protected().Setup<Task<HttpResponseMessage>>(
                "SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .Returns(async (HttpRequestMessage request, CancellationToken ct) =>
            {
                using JsonDocument body = JsonDocument.Parse(await request.Content!.ReadAsStringAsync(ct));
                Assert.Equal(expected.SubscriptionId,
                    body.RootElement.GetProperty("properties").GetProperty("parameters")
                        .GetProperty("subscriptionIds").GetString());
                return new HttpResponseMessage(HttpStatusCode.Accepted);
            });
        using HttpClient client = new(handler.Object);
        AzureAutomationCollectionRunTrigger trigger = new(client, credentials.Object, repository, options.Object);

        await trigger.TriggerAsync(scope, new CollectionRunTriggerRequest
        {
            RunId = Guid.NewGuid(),
            SubscriptionIds = requestOlderSubscription ? [$" {olderSubscription.ToUpperInvariant()} "] : [],
        });

        credentials.Verify(x => x.CreateCredential(expected.CustomerTenantId, expected.CustomerAppId), Times.Once);
        handler.Protected().Verify("SendAsync", Times.Once(),
            ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>());
    }
}
