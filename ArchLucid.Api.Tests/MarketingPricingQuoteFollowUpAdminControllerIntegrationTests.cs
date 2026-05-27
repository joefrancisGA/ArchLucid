using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Admin;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class MarketingPricingQuoteFollowUpAdminControllerIntegrationTests(GreenfieldSqlApiFactory fixture)
    : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableFact]
    public async Task Acknowledge_then_close_removes_row_from_aging()
    {
        using HttpClient client = fixture.CreateClient();

        using HttpResponseMessage post = await client.PostAsJsonAsync(
            "/v1/marketing/pricing/quote-request",
            new
            {
                workEmail = "followup-test@example.com",
                companyName = "Follow Up Co",
                tierInterest = "Team",
                message = "Need pricing"
            });

        post.StatusCode.Should().Be(HttpStatusCode.NoContent);

        Guid requestId = await ReadLatestRequestIdAsync("followup-test@example.com");

        using HttpResponseMessage acknowledge = await client.PostAsJsonAsync(
            $"/v1/admin/marketing/pricing-quote-requests/{requestId}/acknowledge",
            new MarketingPricingQuoteAcknowledgeRequest { AssignedOwner = "sales@archlucid.net" });

        acknowledge.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using HttpResponseMessage agingAfterAck = await client.GetAsync("/v1/admin/marketing/pricing-quote-aging");
        agingAfterAck.StatusCode.Should().Be(HttpStatusCode.OK);

        MarketingPricingQuoteAgingResponse? afterAck =
            await agingAfterAck.Content.ReadFromJsonAsync<MarketingPricingQuoteAgingResponse>();

        afterAck.Should().NotBeNull();
        afterAck!.Rows.Should().NotContain(row => row.Id == requestId);

        await using (SqlConnection connection = new(fixture.SqlConnectionString))
        {
            await connection.OpenAsync();

            const string reopenSql = """
                                     UPDATE dbo.MarketingPricingQuoteRequests
                                     SET FirstResponseUtc = NULL
                                     WHERE Id = @Id;
                                     """;

            await using SqlCommand command = new(reopenSql, connection);
            command.Parameters.AddWithValue("@Id", requestId);
            await command.ExecuteNonQueryAsync();
        }

        using HttpResponseMessage agingReopened = await client.GetAsync("/v1/admin/marketing/pricing-quote-aging");
        MarketingPricingQuoteAgingResponse? reopenedBody =
            await agingReopened.Content.ReadFromJsonAsync<MarketingPricingQuoteAgingResponse>();

        reopenedBody.Should().NotBeNull();
        reopenedBody!.Rows.Should().Contain(row => row.Id == requestId);

        using HttpResponseMessage close = await client.PostAsync(
            $"/v1/admin/marketing/pricing-quote-requests/{requestId}/close",
            null);

        close.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using HttpResponseMessage agingAfterClose = await client.GetAsync("/v1/admin/marketing/pricing-quote-aging");
        MarketingPricingQuoteAgingResponse? closedBody =
            await agingAfterClose.Content.ReadFromJsonAsync<MarketingPricingQuoteAgingResponse>();

        closedBody.Should().NotBeNull();
        closedBody!.Rows.Should().NotContain(row => row.Id == requestId);
    }

    private async Task<Guid> ReadLatestRequestIdAsync(string workEmail)
    {
        await using SqlConnection connection = new(fixture.SqlConnectionString);
        await connection.OpenAsync();

        const string sql = """
                           SELECT TOP (1) Id
                           FROM dbo.MarketingPricingQuoteRequests
                           WHERE WorkEmail = @WorkEmail
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlCommand command = new(sql, connection);
        command.Parameters.AddWithValue("@WorkEmail", workEmail);

        object? scalar = await command.ExecuteScalarAsync();
        scalar.Should().NotBeNull();

        return (Guid)scalar!;
    }
}
