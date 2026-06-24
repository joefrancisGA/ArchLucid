using System.Net.Http.Headers;
using System.Text;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP ingest for schema-versioned Azure extractor ZIPs (<c>POST /v1/azure-extractor/upload</c>).</summary>
[Trait("Category", "Slow")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class AzureExtractorUploadEndpointTests(GreenfieldSqlApiFactory fixture) : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableFact]

    public async Task Upload_withoutExecuteAuthority_returns403()
    {

        await using ReaderRoleArchLucidApiFactory readerFactory = new();

        using HttpClient client = readerFactory.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(AzureExtractorTestZipBuilder.BuildValidZip(includeManifest: false, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);

    }

    [SkippableFact]

    public async Task Upload_missingManifest_returns400()
    {

        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(AzureExtractorTestZipBuilder.BuildValidZip(includeManifest: false, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

    }

    [SkippableFact]

    public async Task Upload_unknownSchema_returns400()
    {

        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form = UploadForm(
            AzureExtractorTestZipBuilder.BuildValidZip(includeManifest: true, schemaVersionOverride: 99));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

    }

    [SkippableFact]

    public async Task Upload_malformedManifestJson_returns400_before_persist()
    {

        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form = UploadForm(AzureExtractorTestZipBuilder.BuildZipWithMalformedManifest());

        await using SqlConnection conn = new(fixture.SqlConnectionString);

        await conn.OpenAsync();

        await using SqlCommand cmd = conn.CreateCommand();

        cmd.CommandText = "SELECT COUNT(1) FROM dbo.AzureExtractorPackages";

        int packageCountBefore = Convert.ToInt32(await cmd.ExecuteScalarAsync(), System.Globalization.CultureInfo.InvariantCulture);

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

        int packageCountAfter = Convert.ToInt32(await cmd.ExecuteScalarAsync(), System.Globalization.CultureInfo.InvariantCulture);

        packageCountAfter.Should().Be(packageCountBefore);

    }

    [SkippableFact]

    public async Task Upload_valid_returns202_andPersistedRow()
    {

        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(AzureExtractorTestZipBuilder.BuildValidZip(includeManifest: true, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using System.Text.Json.JsonDocument doc =
            System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Guid packageId = doc.RootElement.GetProperty("packageId").GetGuid();

        await AssertPackageStoredAsync(packageId);

    }

    [SkippableFact]

    public async Task Upload_CorruptedZipFile_Returns400BadRequest()
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        byte[] garbage = new byte[] { 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08 };

        using MultipartFormDataContent form = UploadForm(garbage);

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    [SkippableFact]

    public async Task DownloadPackage_after_upload_returns_zip_and_audit_event()
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        byte[] zipBytes = AzureExtractorTestZipBuilder.BuildValidZip(includeManifest: true, schemaVersionOverride: null);

        using MultipartFormDataContent form = UploadForm(zipBytes);

        using HttpResponseMessage upload = await client.PostAsync("/v1/azure-extractor/upload", form);

        upload.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using System.Text.Json.JsonDocument uploadDoc =
            System.Text.Json.JsonDocument.Parse(await upload.Content.ReadAsStringAsync());

        Guid packageId = uploadDoc.RootElement.GetProperty("packageId").GetGuid();

        using HttpResponseMessage download =
            await client.GetAsync($"/v1/azure-extractor/packages/{packageId:D}");

        download.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        download.Content.Headers.ContentType?.MediaType.Should().Be("application/zip");

        byte[] downloaded = await download.Content.ReadAsByteArrayAsync();

        downloaded.Should().Equal(zipBytes);

        await using SqlConnection conn = new(fixture.SqlConnectionString);

        await conn.OpenAsync();

        await using SqlCommand cmd = conn.CreateCommand();

        cmd.CommandText = """

            SELECT COUNT(1)

            FROM dbo.AuditEvents

            WHERE EventType = @eventType

              AND JSON_VALUE(DataJson, '$.packageId') = @packageId

            """;

        _ = cmd.Parameters.AddWithValue("@eventType", "Export.AzureExtractorPackageDownloaded");
        _ = cmd.Parameters.AddWithValue("@packageId", packageId.ToString("D"));

        object? scalar = await cmd.ExecuteScalarAsync();

        scalar.Should().Be(1);
    }

    [SkippableFact]

    public async Task Chunked_begin_when_staging_disabled_returns503()
    {
        await using GreenfieldSqlApiFactoryWithoutChunkStaging factory = new();
        using HttpClient client = factory.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.PostAsync(
            "/v1/azure-extractor/upload-sessions",
            new StringContent(
                "{\"fileName\":\"azure-package.zip\",\"totalChunks\":2,\"totalBytes\":100}",
                Encoding.UTF8,
                "application/json"));

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.ServiceUnavailable);

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
        await using SqlConnection conn = new(fixture.SqlConnectionString);

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

}
