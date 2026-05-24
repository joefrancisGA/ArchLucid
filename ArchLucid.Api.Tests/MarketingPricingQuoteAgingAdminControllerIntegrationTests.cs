using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Admin;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class MarketingPricingQuoteAgingAdminControllerIntegrationTests(GreenfieldSqlApiFactory fixture)
    : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableFact]
    public async Task GetAging_after_quote_request_includes_row_with_ok_status()
    {
        using HttpClient client = fixture.CreateClient();

        using HttpResponseMessage post = await client.PostAsJsonAsync(
            "/v1/marketing/pricing/quote-request",
            new
            {
                workEmail = "aging-test@example.com",
                companyName = "Aging Test Co",
                tierInterest = "Professional",
                message = "Please send pricing"
            });

        post.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using HttpResponseMessage get = await client.GetAsync("/v1/admin/marketing/pricing-quote-aging");
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        MarketingPricingQuoteAgingResponse? body =
            await get.Content.ReadFromJsonAsync<MarketingPricingQuoteAgingResponse>();

        body.Should().NotBeNull();
        body!.Rows.Should().ContainSingle(row =>
            row.WorkEmail == "aging-test@example.com"
            && row.BreachStatus == "ok");
    }

    [SkippableFact]
    public async Task GetAging_surfaces_breach_for_synthetic_stale_row()
    {
        using HttpClient client = fixture.CreateClient();

        Guid requestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        await using (SqlConnection connection = new(fixture.SqlConnectionString))
        {
            await connection.OpenAsync();

            const string insertSql = """
                                     INSERT INTO dbo.MarketingPricingQuoteRequests
                                         (Id, CreatedUtc, WorkEmail, CompanyName, TierInterest, Message)
                                     VALUES
                                         (@Id, DATEADD(HOUR, -30, SYSUTCDATETIME()), @WorkEmail, @CompanyName, @TierInterest, @Message);
                                     """;

            await using SqlCommand command = new(insertSql, connection);
            command.Parameters.AddWithValue("@Id", requestId);
            command.Parameters.AddWithValue("@WorkEmail", "stale@example.com");
            command.Parameters.AddWithValue("@CompanyName", "Stale Co");
            command.Parameters.AddWithValue("@TierInterest", "Enterprise");
            command.Parameters.AddWithValue("@Message", "Synthetic stale row");

            await command.ExecuteNonQueryAsync();
        }

        using HttpResponseMessage get = await client.GetAsync("/v1/admin/marketing/pricing-quote-aging");
        get.StatusCode.Should().Be(HttpStatusCode.OK);

        MarketingPricingQuoteAgingResponse? body =
            await get.Content.ReadFromJsonAsync<MarketingPricingQuoteAgingResponse>();

        body.Should().NotBeNull();
        body!.BreachCount.Should().BeGreaterOrEqualTo(1);
        body.Rows.Should().Contain(row =>
            row.Id == requestId
            && row.BreachStatus == "breach at 24h"
            && row.AgeHours >= 24);
    }
}
