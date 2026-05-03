using System.Data;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Models.Billing;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;

using Stripe;
using Stripe.Checkout;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>
///     End-to-end billing conversion: self-service registration, admin JWT checkout, provider webhook, SQL + audit
///     assertions. Stripe checkout avoids outbound Stripe HTTP via <see cref="StripeCheckoutNoNetworkBillingProvider" />;
///     the Stripe signature + activation path still exercises production <c>StripeBillingProvider</c> code in-process.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class StripeCheckoutEndToEndTests
{
    private static readonly JsonSerializerOptions ResponseJson = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static readonly JsonSerializerOptions MarketplaceWebhookJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [SkippableFact]
    public async Task Stripe_register_checkout_webhook_activates_subscription_and_converts_tenant()
    {
        await using StripeCheckoutEndToEndWebAppFactory fixture = new();
        await RunStripeFlowAsync(fixture);
    }

    [SkippableFact]
    public async Task Marketplace_register_checkout_subscribe_webhook_activates_subscription_and_converts_tenant()
    {
        await using MarketplaceCheckoutEndToEndWebAppFactory fixture = new();
        await RunMarketplaceSubscribeFlowAsync(fixture);
    }

    private static async Task RunStripeFlowAsync(StripeCheckoutEndToEndWebAppFactory fixture)
    {
        string connectionString = fixture.SqlConnectionString;
        using HttpClient client = fixture.CreateClient();

        string organizationName = "Stripe E2E " + Guid.NewGuid().ToString("N");
        string adminEmail = $"stripe-e2e-{Guid.NewGuid():N}@example.com";

        (
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            string providerSessionId) =
            await RegisterAndCheckoutAsync(fixture, client, organizationName, adminEmail, checkoutTierLabel: "Pro");

        Session session = new()
        {
            Id = providerSessionId,
            SubscriptionId = "sub_e2e_" + Guid.NewGuid().ToString("N"),
            Metadata = new Dictionary<string, string>
            {
                ["tenant_id"] = tenantId.ToString("D"),
                ["workspace_id"] = workspaceId.ToString("D"),
                ["project_id"] = projectId.ToString("D"),
                ["tier"] = "Pro",
                ["seats"] = "2",
                ["workspaces"] = "1"
            }
        };

        Event stripeEvent = new()
        {
            Id = "evt_e2e_" + Guid.NewGuid().ToString("N"),
            Type = "checkout.session.completed",
            ApiVersion = StripeCheckoutE2EWebhookTestSigning.StripeNetWebhookApiVersion,
            Data = new EventData { Object = session }
        };

        string json = stripeEvent.ToJson();
        string signature = StripeCheckoutE2EWebhookTestSigning.BuildStripeV1Signature(
            StripeCheckoutE2EWebhookTestSigning.WebhookSigningSecret,
            json);

        using HttpRequestMessage webhook = new(HttpMethod.Post, "/v1/billing/webhooks/stripe");
        webhook.Content = new StringContent(json, Encoding.UTF8, "application/json");
        webhook.Headers.TryAddWithoutValidation("Stripe-Signature", signature);

        using HttpResponseMessage webhookResponse = await client.SendAsync(webhook);

        webhookResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        await AssertSqlPaidStandardAsync(connectionString, tenantId);

        IReadOnlyList<string> auditTypes = await ReadAuditEventTypesDescendingAsync(connectionString, tenantId);

        auditTypes.Should().Contain(AuditEventTypes.BillingCheckoutInitiated);
        auditTypes.Should().Contain(AuditEventTypes.BillingCheckoutCompleted);
        auditTypes.Should().Contain(AuditEventTypes.TenantTrialConverted);
    }

    private static async Task RunMarketplaceSubscribeFlowAsync(MarketplaceCheckoutEndToEndWebAppFactory fixture)
    {
        string connectionString = fixture.SqlConnectionString;
        using HttpClient client = fixture.CreateClient();

        string organizationName = "Marketplace E2E " + Guid.NewGuid().ToString("N");
        string adminEmail = $"mkt-e2e-{Guid.NewGuid():N}@example.com";

        (
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            _) =
            await RegisterAndCheckoutAsync(fixture, client, organizationName, adminEmail, checkoutTierLabel: "Team");

        string subscriptionId = "sub_mkt_e2e_" + Guid.NewGuid().ToString("N");
        string body = JsonSerializer.Serialize(
            new
            {
                action = "Subscribe",
                subscriptionId,
                workspaceId = workspaceId.ToString("D"),
                projectId = projectId.ToString("D"),
                purchaser = new
                {
                    tenantId = tenantId.ToString("D")
                }
            },
            MarketplaceWebhookJson);

        using HttpRequestMessage webhook = new(HttpMethod.Post, "/v1/billing/webhooks/marketplace");
        webhook.Content = new StringContent(body, Encoding.UTF8, "application/json");
        webhook.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-bearer");

        using HttpResponseMessage webhookResponse = await client.SendAsync(webhook);

        webhookResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        await AssertSqlPaidStandardAsync(connectionString, tenantId);

        IReadOnlyList<string> auditTypes = await ReadAuditEventTypesDescendingAsync(connectionString, tenantId);

        auditTypes.Should().Contain(AuditEventTypes.BillingCheckoutInitiated);
        auditTypes.Should().Contain(AuditEventTypes.BillingCheckoutCompleted);
        auditTypes.Should().Contain(AuditEventTypes.TenantTrialConverted);
    }

    /// <returns>Tenant scope ids and hosted-checkout provider session id.</returns>
    private static async Task<(Guid TenantId, Guid WorkspaceId, Guid ProjectId, string ProviderSessionId)>
        RegisterAndCheckoutAsync(
            BillingCheckoutEndToEndSqlJwtFactoryBase fixture,
            HttpClient client,
            string organizationName,
            string adminEmail,
            string checkoutTierLabel)
    {
        using HttpResponseMessage registered = await client.PostAsync(
            "/v1/register",
            RegisterJsonContent(organizationName, adminEmail));

        registered.StatusCode.Should().Be(HttpStatusCode.Created);

        using JsonDocument regDoc = await JsonDocument.ParseAsync(await registered.Content.ReadAsStreamAsync());
        Guid tenantId = regDoc.RootElement.GetProperty("tenantId").GetGuid();
        Guid workspaceId = regDoc.RootElement.GetProperty("defaultWorkspaceId").GetGuid();
        Guid projectId = regDoc.RootElement.GetProperty("defaultProjectId").GetGuid();

        string token = await MintAdminJwtAsync(fixture, adminEmail, tenantId, workspaceId, projectId);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using HttpResponseMessage checkout = await client.PostAsJsonAsync(
            "/v1/tenant/billing/checkout",
            new BillingCheckoutPostRequest
            {
                TargetTier = checkoutTierLabel,
                Seats = 2,
                Workspaces = 1,
                BillingEmail = adminEmail,
                ReturnUrl = "https://app.example.test/billing/return",
                CancelUrl = "https://app.example.test/billing/cancel"
            },
            ResponseJson);

        checkout.StatusCode.Should().Be(HttpStatusCode.OK);

        BillingCheckoutResponseDto? dto =
            await checkout.Content.ReadFromJsonAsync<BillingCheckoutResponseDto>(ResponseJson);

        dto.Should().NotBeNull();
        dto.ProviderSessionId.Should().NotBeNullOrWhiteSpace();
        dto.CheckoutUrl.Should().NotBeNullOrWhiteSpace();

        return (tenantId, workspaceId, projectId, dto.ProviderSessionId);
    }

    private static StringContent RegisterJsonContent(string organizationName, string adminEmail)
    {
        Dictionary<string, string?> payload = new()
        {
            ["organizationName"] = organizationName,
            ["adminEmail"] = adminEmail,
            ["adminDisplayName"] = "E2E Admin"
        };

        string json = JsonSerializer.Serialize(payload);

        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    private static Task<string> MintAdminJwtAsync(
        BillingCheckoutEndToEndSqlJwtFactoryBase fixture,
        string adminEmail,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        try
        {
            using IServiceScope scope = fixture.Services.CreateScope();
            ILocalTrialJwtIssuer issuer = scope.ServiceProvider.GetRequiredService<ILocalTrialJwtIssuer>();

            return Task.FromResult(issuer.IssueAccessToken(
                Guid.NewGuid(),
                adminEmail,
                ArchLucidRoles.Admin,
                tenantId,
                workspaceId,
                projectId));
        }
        catch (Exception exception)
        {
            return Task.FromException<string>(exception);
        }
    }

    private static async Task AssertSqlPaidStandardAsync(string connectionString, Guid tenantId)
    {
        await using SqlConnection connection = new(connectionString);

        await connection.OpenAsync();

        await using (SqlCommand sub = connection.CreateCommand())
        {
            sub.CommandText =
                """
                SELECT Status, Tier, Provider
                FROM dbo.BillingSubscriptions
                WHERE TenantId = @TenantId;
                """;

            sub.Parameters.Add("@TenantId", SqlDbType.UniqueIdentifier).Value = tenantId;

            await using SqlDataReader reader = await sub.ExecuteReaderAsync();

            bool row = await reader.ReadAsync();
            row.Should().BeTrue();
            reader.GetString(0).Should().Be("Active");
            reader.GetString(1).Should().Be(nameof(TenantTier.Standard));
        }

        await using (SqlCommand tenant = connection.CreateCommand())
        {
            tenant.CommandText = "SELECT Tier FROM dbo.Tenants WHERE Id = @Id;";
            tenant.Parameters.Add("@Id", SqlDbType.UniqueIdentifier).Value = tenantId;

            object? tier = await tenant.ExecuteScalarAsync();

            tier.Should().Be(nameof(TenantTier.Standard));
        }
    }

    private static async Task<IReadOnlyList<string>> ReadAuditEventTypesDescendingAsync(
        string connectionString,
        Guid tenantId,
        int take = 64)
    {
        List<string> types = [];

        await using SqlConnection connection = new(connectionString);

        await connection.OpenAsync();

        await using SqlCommand command = connection.CreateCommand();

        command.CommandText =
            """
            SELECT TOP (@Take) EventType
            FROM dbo.AuditEvents
            WHERE TenantId = @TenantId
            ORDER BY OccurredUtc DESC;
            """;

        command.Parameters.Add("@TenantId", SqlDbType.UniqueIdentifier).Value = tenantId;
        command.Parameters.Add("@Take", SqlDbType.Int).Value = take;

        await using SqlDataReader reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            types.Add(reader.GetString(0));
        }

        return types;
    }
}
