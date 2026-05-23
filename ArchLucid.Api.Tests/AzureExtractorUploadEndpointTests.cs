using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP ingest for schema-versioned Azure extractor ZIPs (<c>POST /v1/azure-extractor/upload</c>).</summary>
[Trait("Category", "Integration")]
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
            UploadForm(BuildValidZip(includeManifest: false, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);

    }

    [SkippableFact]

    public async Task Upload_missingManifest_returns400()
    {

        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(BuildValidZip(includeManifest: false, schemaVersionOverride: null));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

    }

    [SkippableFact]

    public async Task Upload_unknownSchema_returns400()
    {

        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form = UploadForm(
            BuildValidZip(includeManifest: true, schemaVersionOverride: 99));

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

    }

    [SkippableFact]

    public async Task Upload_malformedManifestJson_returns400_before_persist()
    {

        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form = UploadForm(BuildZipWithMalformedManifest());

        using HttpResponseMessage response = await client.PostAsync("/v1/azure-extractor/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);

        await using SqlConnection conn = new(fixture.SqlConnectionString);

        await conn.OpenAsync();

        await using SqlCommand cmd = conn.CreateCommand();

        cmd.CommandText = "SELECT COUNT(1) FROM dbo.AzureExtractorPackages";

        object? scalar = await cmd.ExecuteScalarAsync();

        scalar.Should().Be(0);

    }

    [SkippableFact]

    public async Task Upload_valid_returns202_andPersistedRow()
    {

        using HttpClient client = fixture.CreateClient();

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

        byte[] zipBytes = BuildValidZip(includeManifest: true, schemaVersionOverride: null);

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
        using HttpClient client = fixture.CreateClient();

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

                ZipArchiveEntry resources = zip.CreateEntry("resources.json");

                using StreamWriter rw = new(resources.Open());

                rw.Write("[]");

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

    private static byte[] BuildZipWithMalformedManifest()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))

        {

            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

            using StreamWriter sw = new(manifest.Open());

            sw.Write("{ not-valid-json");

            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using StreamWriter rw = new(resources.Open());

            rw.Write("[]");

        }

        return ms.ToArray();

    }

}
