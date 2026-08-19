using System.Net;
using System.Net.Http.Headers;
using System.Text;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>POST /v1/architecture/import</c> (CSV dry-run → golden manifest JSON).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ArchitectureDefinitionImportEndpointTests
{
    [SkippableFact]
    public async Task Post_import_with_operator_role_returns_200_and_manifest_json()
    {
        await using OperatorRoleArchLucidApiFactory operatorFactory = new();

        WebApplicationFactory<Program> scoped = operatorFactory.WithWebHostBuilder(_ => { });

        using HttpClient client = scoped.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        const string csv =
            """
            ComponentName,Type,Description
            Public API,Azure App Service API,REST edge
            Catalog DB,Azure SQL,document metadata
            """;

        using MultipartFormDataContent form = BuildCsvForm(csv, systemName: "acro");

        using HttpResponseMessage response = await client.PostAsync("/v1/architecture/import", form);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string body = await response.Content.ReadAsStringAsync();

        body.Should().Contain("\"runId\"");
        body.Should().Contain("\"systemName\":\"acro\"");
        body.Should().Contain("\"manifestVersion\":\"dry-run-csv-import\"");
        body.Should().Contain("\"services\"");
        body.Should().Contain("\"datastores\"");
        body.Should().Contain("Public API");
        body.Should().Contain("Catalog DB");
    }

    [SkippableFact]
    public async Task Post_import_with_reader_role_returns_403()
    {
        await using ReaderRoleArchLucidApiFactory readerFactory = new();

        using HttpClient client = readerFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        const string csv =
            """
            ComponentName,Type,Description
            x,Api,y
            """;

        using MultipartFormDataContent form = BuildCsvForm(csv, systemName: null);

        using HttpResponseMessage response = await client.PostAsync("/v1/architecture/import", form);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Post_import_invalid_csv_returns_422()
    {
        await using OperatorRoleArchLucidApiFactory operatorFactory = new();

        using HttpClient client = operatorFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        const string csv = "only-one-column\nv";

        using MultipartFormDataContent form = BuildCsvForm(csv, systemName: null);

        using HttpResponseMessage response = await client.PostAsync("/v1/architecture/import", form);

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    private static MultipartFormDataContent BuildCsvForm(string csv, string? systemName)
    {
        MultipartFormDataContent form = new();

        if (systemName is not null)
            form.Add(new StringContent(systemName), "systemName");

        ByteArrayContent fileContent = new(Encoding.UTF8.GetBytes(csv));

        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

        form.Add(fileContent, name: "file", fileName: "arch.csv");

        return form;
    }
}
