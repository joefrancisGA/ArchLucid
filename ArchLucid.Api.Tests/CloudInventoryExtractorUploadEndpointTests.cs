using System.Net.Http.Headers;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP ingest for schema-versioned AWS/GCP inventory ZIPs.</summary>
[Trait("Category", "Slow")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class CloudInventoryExtractorUploadEndpointTests(GreenfieldSqlApiFactory fixture)
    : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableTheory]
    [InlineData("aws")]
    [InlineData("gcp")]
    public async Task Upload_missingManifest_returns400(string providerRoute)
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        CloudProvider provider = providerRoute == "aws" ? CloudProvider.Aws : CloudProvider.Gcp;

        using MultipartFormDataContent form =
            UploadForm(CloudInventoryExtractorTestZipBuilder.BuildValidZip(provider, includeManifest: false));

        using HttpResponseMessage response =
            await client.PostAsync($"/v1/extractor/{providerRoute}/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Upload_validAws_returns202_andPersistedRow()
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(CloudInventoryExtractorTestZipBuilder.BuildValidZip(CloudProvider.Aws, includeManifest: true));

        using HttpResponseMessage response = await client.PostAsync("/v1/extractor/aws/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using System.Text.Json.JsonDocument doc =
            System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Guid packageId = doc.RootElement.GetProperty("packageId").GetGuid();

        await using SqlConnection conn = new(fixture.SqlConnectionString);

        await conn.OpenAsync();

        await using SqlCommand cmd = conn.CreateCommand();

        cmd.CommandText =
            "SELECT COUNT(1) FROM dbo.CloudInventoryExtractorPackages WHERE PackageId = @PackageId AND CloudProvider = 2";

        cmd.Parameters.AddWithValue("@PackageId", packageId);

        int count = Convert.ToInt32(await cmd.ExecuteScalarAsync(), System.Globalization.CultureInfo.InvariantCulture);

        count.Should().Be(1);
    }

    [SkippableFact]
    public async Task Upload_validGcp_returns202_andPersistedRow()
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using MultipartFormDataContent form =
            UploadForm(CloudInventoryExtractorTestZipBuilder.BuildValidZip(CloudProvider.Gcp, includeManifest: true));

        using HttpResponseMessage response = await client.PostAsync("/v1/extractor/gcp/upload", form);

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using System.Text.Json.JsonDocument doc =
            System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Guid packageId = doc.RootElement.GetProperty("packageId").GetGuid();

        await using SqlConnection conn = new(fixture.SqlConnectionString);

        await conn.OpenAsync();

        await using SqlCommand cmd = conn.CreateCommand();

        cmd.CommandText =
            "SELECT COUNT(1) FROM dbo.CloudInventoryExtractorPackages WHERE PackageId = @PackageId AND CloudProvider = 3";

        cmd.Parameters.AddWithValue("@PackageId", packageId);

        int count = Convert.ToInt32(await cmd.ExecuteScalarAsync(), System.Globalization.CultureInfo.InvariantCulture);

        count.Should().Be(1);
    }

    private static MultipartFormDataContent UploadForm(byte[] zipBytes)
    {
        MultipartFormDataContent form = new();

        ByteArrayContent fileContent = new(zipBytes);

        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/zip");

        form.Add(fileContent, "file", "inventory-package.zip");

        return form;
    }
}
