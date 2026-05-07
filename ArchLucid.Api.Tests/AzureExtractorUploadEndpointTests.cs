using System.IO.Compression;
using System.Net.Http.Headers;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP ingest for schema-versioned Azure extractor ZIPs (<c>POST /v1/azure-extractor/upload</c>).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class AzureExtractorUploadEndpointTests : IClassFixture<GreenfieldSqlApiFactory>
{
    private readonly GreenfieldSqlApiFactory _fixture;

    public AzureExtractorUploadEndpointTests(GreenfieldSqlApiFactory fixture)
    {
        _fixture = fixture;
    }

    [SkippableFact]

    public async Task Upload_withoutExecuteAuthority_returns403()
    {

        await using ReaderRoleArchLucidApiFactory readerFactory = new();

        using HttpClient client = readerFactory.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(BuildValidZip(includeManifest: false, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);

    }

    [SkippableFact]

    public async Task Upload_missingManifest_returns422()
    {

        using HttpClient client = _fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(BuildValidZip(includeManifest: false, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.UnprocessableEntity);

    }

    [SkippableFact]

    public async Task Upload_unknownSchema_returns422()
    {

        using HttpClient client = _fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form = UploadForm(
            BuildValidZip(includeManifest: true, schemaVersionOverride: 99));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.UnprocessableEntity);

    }

    [SkippableFact]

    public async Task Upload_valid_returns202_andPersistedRow()
    {

        using HttpClient client = _fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(BuildValidZip(includeManifest: true, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using System.Text.Json.JsonDocument doc =
            System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Guid packageId = doc.RootElement.GetProperty("packageId").GetGuid();

        await AssertPackageStoredAsync(packageId);

    }

    private static MultipartFormDataContent UploadForm(byte[] zipBody)
    {

        ByteArrayContent content = new(zipBody);

        content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");

        MultipartFormDataContent form = new();

        form.Add(content, name: "file", fileName: "azure-package.zip");

        return form;

    }

    private async Task AssertPackageStoredAsync(Guid packageId)
    {
        await using SqlConnection conn = new(_fixture.SqlConnectionString);

        await conn.OpenAsync();

        await using SqlCommand cmd = conn.CreateCommand();

        cmd.CommandText = """

            SELECT COUNT(1)

            FROM dbo.AzureExtractorPackages

            WHERE PackageId = @id

            """;

        _ = cmd.Parameters.AddWithValue("@id", packageId);

        object? scalar = await cmd.ExecuteScalarAsync();

        scalar.Should().Be(1);

    }

    private static byte[] BuildValidZip(bool includeManifest, int? schemaVersionOverride)
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))

        {

            if (includeManifest)

            {

                ZipArchiveEntry m = zip.CreateEntry("manifest.json");

                using StreamWriter sw = new(m.Open());

                int schemaVersion = schemaVersionOverride ?? 1;

                sw.Write(

                    $$"""

                    {"schemaVersion":{{schemaVersion}},"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-05-06T12:00:00Z",

                    "subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",

                    "scope":"/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",

                    "switchesUsed":[],"azModuleVersion":"0.0.0-test"}

                    """);

            }

            else

            {

                ZipArchiveEntry other = zip.CreateEntry("readme.txt");

                using StreamWriter ow = new(other.Open());

                ow.WriteLine("no manifest");

            }

        }

        return ms.ToArray();

    }

}
