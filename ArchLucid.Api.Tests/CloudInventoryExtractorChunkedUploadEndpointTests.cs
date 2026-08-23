using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Common;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>Chunk-staged AWS/GCP inventory ingest (<c>upload-sessions</c> + octet-stream chunks + <c>complete</c>).</summary>
[Trait("Category", "Slow")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class CloudInventoryExtractorChunkedUploadEndpointTests(GreenfieldSqlApiFactoryWithLocalArtifactBlob fixture)
    : IClassFixture<GreenfieldSqlApiFactoryWithLocalArtifactBlob>
{
    [Theory]
    [InlineData(CloudProvider.Aws, "aws-inventory-package.zip")]
    [InlineData(CloudProvider.Gcp, "gcp-inventory-package.zip")]
    public async Task Chunked_valid_returns202_andPersistedRow(CloudProvider provider, string fileName)
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        byte[] zip = CloudInventoryExtractorTestZipBuilder.BuildValidZip(provider, includeManifest: true);

        string providerSegment = provider == CloudProvider.Aws ? "aws" : "gcp";

        string startJson = JsonSerializer.Serialize(
            new { fileName, totalChunks = 2, totalBytes = zip.LongLength });

        using HttpResponseMessage start = await client.PostAsync(
            $"/v1/extractor/{providerSegment}/upload-sessions",
            new StringContent(startJson, Encoding.UTF8, "application/json"));

        start.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        using JsonDocument startDoc = JsonDocument.Parse(await start.Content.ReadAsStringAsync());

        Guid sessionId = startDoc.RootElement.GetProperty("sessionId").GetGuid();

        int mid = zip.Length / 2;

        await PutChunkAsync(client, providerSegment, sessionId, 0, zip.AsSpan(0, mid).ToArray());

        await PutChunkAsync(client, providerSegment, sessionId, 1, zip.AsSpan(mid).ToArray());

        using HttpResponseMessage complete = await client.PostAsync(
            $"/v1/extractor/{providerSegment}/upload-sessions/{sessionId:D}/complete",
            content: null);

        complete.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using JsonDocument doneDoc = JsonDocument.Parse(await complete.Content.ReadAsStringAsync());

        Guid packageId = doneDoc.RootElement.GetProperty("packageId").GetGuid();

        await AssertPackageStoredAsync(fixture.SqlConnectionString, provider, packageId);
    }

    private static async Task PutChunkAsync(
        HttpClient client,
        string providerSegment,
        Guid sessionId,
        int index,
        byte[] body)
    {
        using ByteArrayContent content = new(body);

        content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

        using HttpResponseMessage put = await client.PutAsync(
            $"/v1/extractor/{providerSegment}/upload-sessions/{sessionId:D}/chunks/{index}",
            content);

        put.StatusCode.Should().Be(System.Net.HttpStatusCode.NoContent);
    }

    private static async Task AssertPackageStoredAsync(
        string sqlConnectionString,
        CloudProvider provider,
        Guid packageId)
    {
        await using SqlConnection conn = new(sqlConnectionString);

        await conn.OpenAsync();

        await using SqlCommand cmd = conn.CreateCommand();

        cmd.CommandText = """

            SELECT COUNT(1)

            FROM dbo.CloudInventoryExtractorPackages

            WHERE PackageId = @id AND CloudProvider = @provider

            """;

        _ = cmd.Parameters.AddWithValue("@id", packageId);
        _ = cmd.Parameters.AddWithValue("@provider", (int)provider);

        object? scalar = await cmd.ExecuteScalarAsync();

        scalar.Should().Be(1);
    }
}
