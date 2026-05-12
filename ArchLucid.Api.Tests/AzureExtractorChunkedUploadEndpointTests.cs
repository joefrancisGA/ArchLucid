using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>Chunk-staged ingest (<c>upload-sessions</c> + octet-stream chunks + <c>complete</c>).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class AzureExtractorChunkedUploadEndpointTests(GreenfieldSqlApiFactoryWithLocalArtifactBlob fixture)
    : IClassFixture<GreenfieldSqlApiFactoryWithLocalArtifactBlob>
{
    [SkippableFact]

    public async Task Chunked_valid_returns202_andPersistedRow()
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        byte[] zip = BuildValidZip(includeManifest: true, schemaVersionOverride: null);

        string startJson = JsonSerializer.Serialize(
            new { fileName = "azure-package.zip", totalChunks = 2, totalBytes = zip.LongLength });

        using HttpResponseMessage start =
            await client.PostAsync("/v1/azure-extractor/upload-sessions", new StringContent(startJson, Encoding.UTF8, "application/json"));

        start.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        using JsonDocument startDoc = JsonDocument.Parse(await start.Content.ReadAsStringAsync());

        Guid sessionId = startDoc.RootElement.GetProperty("sessionId").GetGuid();

        int mid = zip.Length / 2;

        await PutChunkAsync(client, sessionId, 0, zip.AsSpan(0, mid).ToArray());

        await PutChunkAsync(client, sessionId, 1, zip.AsSpan(mid).ToArray());

        using HttpResponseMessage complete =
            await client.PostAsync($"/v1/azure-extractor/upload-sessions/{sessionId:D}/complete", content: null);

        complete.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using JsonDocument doneDoc = JsonDocument.Parse(await complete.Content.ReadAsStringAsync());

        Guid packageId = doneDoc.RootElement.GetProperty("packageId").GetGuid();

        await AssertPackageStoredAsync(fixture.SqlConnectionString, packageId);
    }

    private static async Task PutChunkAsync(HttpClient client, Guid sessionId, int index, byte[] body)
    {
        using ByteArrayContent content = new(body);

        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

        using HttpResponseMessage put =
            await client.PutAsync($"/v1/azure-extractor/upload-sessions/{sessionId:D}/chunks/{index}", content);

        put.StatusCode.Should().Be(System.Net.HttpStatusCode.NoContent);
    }

    private static async Task AssertPackageStoredAsync(string sqlConnectionString, Guid packageId)
    {
        await using SqlConnection conn = new(sqlConnectionString);

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
