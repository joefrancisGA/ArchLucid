using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Workspace baseline artifact presence (<c>GET /v1/tenant/workspace-baseline-artifacts</c>).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class WorkspaceBaselineArtifactsEndpointTests(GreenfieldSqlApiFactory fixture) : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableFact]
    public async Task Get_beforeUpload_returnsFalse_afterUpload_returnsTrue()
    {
        using HttpClient client = fixture.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage before = await client.GetAsync("/v1/tenant/workspace-baseline-artifacts");

        before.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        using JsonDocument beforeDoc = JsonDocument.Parse(await before.Content.ReadAsStringAsync());

        beforeDoc.RootElement.GetProperty("hasBaselineArtifacts").GetBoolean().Should().BeFalse();

        using MultipartFormDataContent form = UploadForm(BuildValidZip());

        using HttpResponseMessage upload = await client.PostAsync("/v1/azure-extractor/upload", form);

        upload.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);

        using HttpResponseMessage after = await client.GetAsync("/v1/tenant/workspace-baseline-artifacts");

        after.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

        using JsonDocument afterDoc = JsonDocument.Parse(await after.Content.ReadAsStringAsync());

        afterDoc.RootElement.GetProperty("hasBaselineArtifacts").GetBoolean().Should().BeTrue();
    }

    [SkippableFact]
    public async Task Get_withReadAuthority_returns200()
    {
        await using GreenfieldSqlReaderRoleApiFactory readerFactory = new();

        using HttpClient client = readerFactory.CreateClient();

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        using HttpResponseMessage response = await client.GetAsync("/v1/tenant/workspace-baseline-artifacts");

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    private static MultipartFormDataContent UploadForm(byte[] zipBody)
    {
        ByteArrayContent content = new(zipBody);

        content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");

        MultipartFormDataContent form = new();

        form.Add(content, name: "file", fileName: "azure-package.zip");

        return form;
    }

    private static byte[] BuildValidZip()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

            using (StreamWriter sw = new(manifest.Open()))
            {
                sw.Write(
                    """

                    {"schemaVersion":1,"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-05-06T12:00:00Z",
                    "subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                    "scope":"/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                    "switchesUsed":[],"azModuleVersion":"0.0.0-test"}

                    """);
            }

            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using (StreamWriter rw = new(resources.Open()))
            {
                rw.Write("[]");
            }
        }

        return ms.ToArray();
    }
}
