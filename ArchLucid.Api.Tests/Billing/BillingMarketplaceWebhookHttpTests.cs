using System.Data;
using System.Net;
using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>HTTP-level tests for <c>/v1/billing/webhooks/marketplace</c> (SQL-backed ledger + stub JWT verifier).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class BillingMarketplaceWebhookHttpTests
{
    [Fact]
    public async Task ChangePlan_ga_disabled_returns_202_and_does_not_mutate_tier()
    {
        BillingMarketplaceWebhookDeferredApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Guid tenantId = Guid.NewGuid();

        await SeedTenantWithActiveBillingAsync(factory.SqlConnectionString, tenantId);

        string body =
            "{\"action\":\"ChangePlan\",\"subscriptionId\":\"sub-202-test\",\"planId\":\"contoso-enterprise\",\"quantity\":5,\"purchaser\":{\"tenantId\":\""
            + tenantId.ToString("D", System.Globalization.CultureInfo.InvariantCulture)
            + "\"}}";

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/billing/webhooks/marketplace")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-bearer");

        HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Accepted);

        string tier = await ReadBillingTierAsync(factory.SqlConnectionString, tenantId);

        tier.Should().Be("Standard");
    }

    [Fact]
    public async Task ChangePlan_ga_enabled_updates_tier_via_sp_Billing_ChangePlan()
    {
        BillingMarketplaceWebhookGaOnApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Guid tenantId = Guid.NewGuid();

        await SeedTenantWithActiveBillingAsync(factory.SqlConnectionString, tenantId);

        string body =
            "{\"action\":\"ChangePlan\",\"subscriptionId\":\"sub-200-test\",\"planId\":\"contoso-enterprise\",\"purchaser\":{\"tenantId\":\""
            + tenantId.ToString("D", System.Globalization.CultureInfo.InvariantCulture)
            + "\"}}";

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/billing/webhooks/marketplace")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-bearer");

        HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string tier = await ReadBillingTierAsync(factory.SqlConnectionString, tenantId);

        tier.Should().Be("Enterprise");
    }

    [Fact]
    public async Task ChangeQuantity_ga_enabled_updates_seats_via_sp_Billing_ChangeQuantity()
    {
        BillingMarketplaceWebhookGaOnApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        Guid tenantId = Guid.NewGuid();

        await SeedTenantWithActiveBillingAsync(factory.SqlConnectionString, tenantId);

        string body =
            "{\"action\":\"ChangeQuantity\",\"subscriptionId\":\"sub-qty\",\"quantity\":42,\"purchaser\":{\"tenantId\":\""
            + tenantId.ToString("D", System.Globalization.CultureInfo.InvariantCulture)
            + "\"}}";

        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/billing/webhooks/marketplace")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", "test-bearer");

        HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        int seats = await ReadBillingSeatsAsync(factory.SqlConnectionString, tenantId);

        seats.Should().Be(42);
    }

    private static async Task SeedTenantWithActiveBillingAsync(string connectionString, Guid tenantId)
    {
        string slug = "mkt_" + tenantId.ToString("N")[..16];

        await using SqlConnection connection = new(connectionString);

        await connection.OpenAsync();

        await using (SqlCommand insertTenant = connection.CreateCommand())
        {
            insertTenant.CommandText =
                """
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier)
                VALUES (@Id, N'Marketplace Webhook Test', @Slug, N'Standard');
                """;

            insertTenant.Parameters.Add("@Id", SqlDbType.UniqueIdentifier).Value = tenantId;
            insertTenant.Parameters.Add("@Slug", SqlDbType.NVarChar, 100).Value = slug;

            await insertTenant.ExecuteNonQueryAsync();
        }

        await using (SqlCommand insertBilling = connection.CreateCommand())
        {
            insertBilling.CommandText =
                """
                INSERT INTO dbo.BillingSubscriptions (
                    TenantId, WorkspaceId, ProjectId, Provider, ProviderSubscriptionId, Tier,
                    SeatsPurchased, WorkspacesPurchased, Status, ActivatedUtc, CanceledUtc, RawWebhookJson, CreatedUtc, UpdatedUtc)
                VALUES (
                    @TenantId, @WorkspaceId, @ProjectId, N'AzureMarketplace', N'sub-seed', N'Standard',
                    2, 1, N'Active', SYSUTCDATETIME(), NULL, NULL, SYSUTCDATETIME(), SYSUTCDATETIME());
                """;

            insertBilling.Parameters.Add("@TenantId", SqlDbType.UniqueIdentifier).Value = tenantId;
            insertBilling.Parameters.Add("@WorkspaceId", SqlDbType.UniqueIdentifier).Value = ScopeIds.DefaultWorkspace;
            insertBilling.Parameters.Add("@ProjectId", SqlDbType.UniqueIdentifier).Value = ScopeIds.DefaultProject;

            await insertBilling.ExecuteNonQueryAsync();
        }
    }

    private static async Task<string> ReadBillingTierAsync(string connectionString, Guid tenantId)
    {
        await using SqlConnection connection = new(connectionString);

        await connection.OpenAsync();

        await using SqlCommand command = connection.CreateCommand();

        command.CommandText = "SELECT Tier FROM dbo.BillingSubscriptions WHERE TenantId = @TenantId;";
        command.Parameters.Add("@TenantId", SqlDbType.UniqueIdentifier).Value = tenantId;

        object? scalar = await command.ExecuteScalarAsync();

        return scalar is string s ? s : string.Empty;
    }

    private static async Task<int> ReadBillingSeatsAsync(string connectionString, Guid tenantId)
    {
        await using SqlConnection connection = new(connectionString);

        await connection.OpenAsync();

        await using SqlCommand command = connection.CreateCommand();

        command.CommandText = "SELECT SeatsPurchased FROM dbo.BillingSubscriptions WHERE TenantId = @TenantId;";
        command.Parameters.Add("@TenantId", SqlDbType.UniqueIdentifier).Value = tenantId;

        object? scalar = await command.ExecuteScalarAsync();

        return scalar is int i ? i : Convert.ToInt32(scalar, System.Globalization.CultureInfo.InvariantCulture);
    }
}
