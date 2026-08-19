using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Contracts.Operator;
using ArchLucid.Core.Authorization;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>JWT + in-memory storage: operator saved views CRUD for audit/graph surfaces.</summary>
[Trait("Category", "Integration")]
public sealed class OperatorSavedViewsIntegrationTests(JwtLocalSigningWebAppFactory factory) : IClassFixture<JwtLocalSigningWebAppFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public async Task Post_get_delete_saved_view_roundtrip_for_audit_surface()
    {
        string token = factory.MintLocalBearerJwt(
            "ExecuteUser",
            [ArchLucidRoles.Operator]);

        HttpClient client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        CreateOperatorSavedViewRequest create = new()
        {
            Surface = OperatorSavedViewSurfaces.Audit,
            Name = "Finalize events",
            Payload = new OperatorSavedViewPayload
            {
                Filters = JsonSerializer.SerializeToElement(new { eventType = "FinalizeRun", runId = "" }),
                Sort = "occurredUtc:desc",
                ColumnVisibility = JsonSerializer.SerializeToElement(new { showAdvancedFilters = true })
            }
        };

        HttpResponseMessage postRes = await client.PostAsJsonAsync(
            new Uri("/v1/operator/saved-views", UriKind.Relative),
            create,
            JsonOptions);

        string postBody = await postRes.Content.ReadAsStringAsync();
        postRes.StatusCode.Should().Be(HttpStatusCode.Created, "response body: {0}", postBody);
        OperatorSavedViewResponse? created =
            await postRes.Content.ReadFromJsonAsync<OperatorSavedViewResponse>(JsonOptions);

        created.Should().NotBeNull();
        created!.Name.Should().Be("Finalize events");
        created.Surface.Should().Be(OperatorSavedViewSurfaces.Audit);

        HttpResponseMessage listRes = await client.GetAsync(
            new Uri("/v1/operator/saved-views?surface=audit", UriKind.Relative));

        listRes.StatusCode.Should().Be(HttpStatusCode.OK);
        OperatorSavedViewListResponse? listed =
            await listRes.Content.ReadFromJsonAsync<OperatorSavedViewListResponse>(JsonOptions);

        listed.Should().NotBeNull();
        listed!.Views.Should().ContainSingle(view => view.Id == created.Id);

        HttpResponseMessage deleteRes = await client.DeleteAsync(
            new Uri($"/v1/operator/saved-views/{created.Id}", UriKind.Relative));

        deleteRes.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
