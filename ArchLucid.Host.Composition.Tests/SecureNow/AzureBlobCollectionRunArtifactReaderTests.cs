using System.Globalization;
using System.Reflection;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.SecureNow;
using ArchLucid.Host.Composition.SecureNow;

using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class AzureBlobCollectionRunArtifactReaderTests
{
    [Fact]
    public void ManifestPrefix_null_bound_prefix_falls_back_to_default_without_null_reference()
    {
        AzureBlobCollectionRunArtifactReader reader = CreateReader(prefix: null);

        string prefix = InvokeManifestPrefix(reader);

        prefix.Should().Be("runs/");
    }

    [Fact]
    public void Container_null_bound_container_name_falls_back_to_default_without_argument_null()
    {
        AzureBlobCollectionRunArtifactReader reader = CreateReader(containerName: null);

        BlobContainerClient container = InvokeContainer(reader);

        container.Name.Should().Be("securenow-collection");
    }

    [Fact]
    public async Task ReadArtifactAsync_returns_null_when_manifest_package_path_is_missing()
    {
        AzureBlobCollectionRunArtifactReader reader = CreateReader();
        CollectionRunManifest manifest = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            ZipPath = null,
        };

        CollectionRunArtifact? artifact = await reader.ReadArtifactAsync(manifest, CancellationToken.None);

        artifact.Should().BeNull();
    }

    [Theory]
    [InlineData(3, true)]
    [InlineData(4, false)]
    [InlineData(AzureExtractorUploadLimits.MaxZipBytes + 1, false)]
    public async Task ReadArtifactAsync_checks_package_length_before_buffering(long contentLength, bool expected)
    {
        byte[] bytes = [1, 2, 3];
        using MemoryStream content = new(bytes);
        Mock<Stream> body = new();
        body.Setup(stream => stream.ReadAsync(It.IsAny<Memory<byte>>(), It.IsAny<CancellationToken>()))
            .Returns((Memory<byte> buffer, CancellationToken token) => content.ReadAsync(buffer, token));
        BlobDownloadStreamingResult download = BlobsModelFactory.BlobDownloadStreamingResult(
            content: body.Object,
            details: BlobsModelFactory.BlobDownloadDetails(contentLength: contentLength));
        Mock<BlobClient> package = new();
        package.Setup(client => client.DownloadStreamingAsync(null, CancellationToken.None))
            .ReturnsAsync(Response.FromValue(download, Mock.Of<Response>()));
        Mock<BlobContainerClient> container = new();
        container.Setup(client => client.GetBlobClient("runs/package.zip")).Returns(package.Object);
        Mock<BlobServiceClient> service = new();
        service.Setup(client => client.GetBlobContainerClient("securenow-collection")).Returns(container.Object);
        AzureBlobCollectionRunArtifactReader reader = new(service.Object, Options.Create(
            new CollectionRunStorageOptions { ContainerName = "securenow-collection" }));
        CollectionRunManifest manifest = new()
        {
            RunId = Guid.NewGuid(),
            StartedUtc = DateTime.UtcNow,
            ZipPath = "runs/package.zip",
        };

        CollectionRunArtifact? artifact = await reader.ReadArtifactAsync(manifest);

        if (expected)
            artifact!.ZipBytes.Should().Equal(bytes);
        else
            artifact.Should().BeNull();

        if (contentLength > AzureExtractorUploadLimits.MaxZipBytes)
            body.Verify(stream => stream.ReadAsync(It.IsAny<Memory<byte>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public void ParseManifestContent_parses_numeric_schemaVersion()
    {
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        CollectionRunManifest? manifest = AzureBlobCollectionRunArtifactReader.ParseManifestContent(
            BinaryData.FromString(
                $$"""
                  {"runId":"{{runId}}","startedUtc":"2026-01-01T12:00:00Z","schemaVersion":1,"status":"Succeeded"}
                  """));

        manifest.Should().NotBeNull();
        manifest!.SchemaVersion.Should().Be(1);
    }

    [Theory]
    [InlineData("2026-01-01T12:00:00", "2026-01-01T12:15:00")]
    [InlineData("2026-01-01T12:00:00Z", "2026-01-01T12:15:00Z")]
    [InlineData("2026-01-01T07:00:00-05:00", "2026-01-01T07:15:00-05:00")]
    public void ParseManifestContent_treats_manifest_timestamps_as_utc_under_a_non_gregorian_culture(
        string startedUtc,
        string finishedUtc)
    {
        CultureInfo previousCulture = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("ar-SA");
            CollectionRunManifest? manifest = AzureBlobCollectionRunArtifactReader.ParseManifestContent(
                BinaryData.FromString(
                    $$"""
                      {"runId":"11111111-2222-3333-4444-555555555555","startedUtc":"{{startedUtc}}","finishedUtc":"{{finishedUtc}}"}
                      """));

            manifest.Should().NotBeNull();
            manifest!.StartedUtc.Should().Be(new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc));
            manifest.StartedUtc.Kind.Should().Be(DateTimeKind.Utc);
            manifest.FinishedUtc.Should().Be(new DateTime(2026, 1, 1, 12, 15, 0, DateTimeKind.Utc));
            manifest.FinishedUtc!.Value.Kind.Should().Be(DateTimeKind.Utc);
        }
        finally
        {
            CultureInfo.CurrentCulture = previousCulture;
        }
    }

    [Fact]
    public void ParseManifestContent_returns_null_when_json_is_invalid()
    {
        CollectionRunManifest? manifest = AzureBlobCollectionRunArtifactReader.ParseManifestContent(
            BinaryData.FromString("{not-valid-json"));

        manifest.Should().BeNull();
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("null")]
    [InlineData("\"manifest\"")]
    public void ParseManifestContent_skips_valid_json_with_a_non_object_root(string content)
    {
        CollectionRunManifest? manifest = AzureBlobCollectionRunArtifactReader.ParseManifestContent(
            BinaryData.FromString(content));

        manifest.Should().BeNull();
    }

    [Fact]
    public async Task ReadManifestAsync_returns_null_when_manifest_blob_download_fails()
    {
        AzureBlobCollectionRunArtifactReader reader = CreateReader();
        BlobContainerClient container = InvokeContainer(reader);

        CollectionRunManifest? manifest = await InvokeReadManifestAsync(
            reader,
            container,
            "runs/missing/run-manifest.json",
            CancellationToken.None);

        manifest.Should().BeNull();
    }

    private static AzureBlobCollectionRunArtifactReader CreateReader(string? prefix = "runs/", string? containerName = "securenow-collection")
    {
        BlobServiceClient blobServiceClient = new(
            new Uri("https://example.blob.core.windows.net/"),
            new AzureSasCredential("sig"));

        return new AzureBlobCollectionRunArtifactReader(
            blobServiceClient,
            Options.Create(new CollectionRunStorageOptions
            {
                Prefix = prefix!,
                ContainerName = containerName!,
            }));
    }

    private static string InvokeManifestPrefix(AzureBlobCollectionRunArtifactReader reader)
    {
        MethodInfo method = typeof(AzureBlobCollectionRunArtifactReader).GetMethod(
            "ManifestPrefix",
            BindingFlags.Instance | BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("ManifestPrefix not found.");

        return (string)method.Invoke(reader, null)!;
    }

    private static BlobContainerClient InvokeContainer(AzureBlobCollectionRunArtifactReader reader)
    {
        MethodInfo method = typeof(AzureBlobCollectionRunArtifactReader).GetMethod(
            "Container",
            BindingFlags.Instance | BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("Container not found.");

        return (BlobContainerClient)method.Invoke(reader, null)!;
    }

    private static Task<CollectionRunManifest?> InvokeReadManifestAsync(
        AzureBlobCollectionRunArtifactReader reader,
        BlobContainerClient container,
        string blobName,
        CancellationToken cancellationToken)
    {
        MethodInfo method = typeof(AzureBlobCollectionRunArtifactReader).GetMethod(
            "ReadManifestAsync",
            BindingFlags.Static | BindingFlags.NonPublic)
            ?? throw new InvalidOperationException("ReadManifestAsync not found.");

        return (Task<CollectionRunManifest?>)method.Invoke(
            null,
            [container, blobName, cancellationToken])!;
    }
}
