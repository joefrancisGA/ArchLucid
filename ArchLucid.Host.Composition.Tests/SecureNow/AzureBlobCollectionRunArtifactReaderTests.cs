using System.Reflection;

using ArchLucid.Application.SecureNow;
using ArchLucid.Host.Composition.SecureNow;

using Azure;
using Azure.Storage.Blobs;

using FluentAssertions;

using Microsoft.Extensions.Options;

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
}
