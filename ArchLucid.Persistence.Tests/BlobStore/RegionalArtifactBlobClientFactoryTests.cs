using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.BlobStore;

using Azure.Storage.Blobs;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.BlobStore;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RegionalArtifactBlobClientFactoryTests
{
    private static StubArtifactLargePayloadOptionsMonitor Monitor(ArtifactLargePayloadOptions value) =>
        new(value);

    private static ArtifactLargePayloadOptions AzureBlobBaseline(string primaryUri)
    {
        return new ArtifactLargePayloadOptions { BlobProvider = "AzureBlob", AzureBlobServiceUri = primaryUri, };
    }

    [Fact]
    public void Resolve_Default_region_uses_AzureBlobServiceUri()
    {
        const string primary = "https://defaultacct.blob.core.windows.net";

        ArtifactLargePayloadOptions snapshot = AzureBlobBaseline(primary);
        RegionalArtifactBlobClientFactory sut = new(Monitor(snapshot), new StaticBearerTokenCredential());

        BlobServiceClient resolved = sut.Resolve(TenantDataRegions.Default);

        resolved.Uri.AbsoluteUri.TrimEnd('/').Should().Be(primary.TrimEnd('/'));
    }

    [Fact]
    public void Resolve_Normalizes_region_key_into_regional_dictionary_lookup()
    {
        const string primary = "https://defaultacct.blob.core.windows.net/";
        Uri east = new Uri("https://eastacct.blob.core.windows.net");

        ArtifactLargePayloadOptions snapshot = AzureBlobBaseline(primary);
        snapshot.AzureBlobServiceUriByRegion = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["EASTUS"] = east.AbsoluteUri.TrimEnd('/') + "/", // exercise key normalization alongside value whitespace
        };

        RegionalArtifactBlobClientFactory sut = new(Monitor(snapshot), new StaticBearerTokenCredential());

        BlobServiceClient resolved = sut.Resolve(" eastus ");

        resolved.Uri.GetLeftPart(UriPartial.Authority).Should().Be(east.GetLeftPart(UriPartial.Authority));
    }

    [Fact]
    public void Resolve_requires_AzureBlobServiceUri_when_default_region_requested()
    {
        ArtifactLargePayloadOptions snapshot =
            new() { BlobProvider = "AzureBlob", AzureBlobServiceUri = "   ", AzureBlobServiceUriByRegion = [] };

        RegionalArtifactBlobClientFactory sut = new(Monitor(snapshot), new StaticBearerTokenCredential());

        Action act = () => sut.Resolve(TenantDataRegions.Default);

        act.Should().Throw<InvalidOperationException>().WithMessage("*AzureBlobServiceUri*");
    }

    [Fact]
    public void Resolve_requires_regional_dictionary_when_DataRegion_requests_non_default()
    {
        const string primary = "https://defaultacct.blob.core.windows.net";

        ArtifactLargePayloadOptions snapshot =
            AzureBlobBaseline(primary); // AzureBlobServiceUriByRegion intentionally null.

        RegionalArtifactBlobClientFactory sut = new(Monitor(snapshot), new StaticBearerTokenCredential());

        Action act = () => sut.Resolve("westus2");

        act.Should().Throw<InvalidOperationException>().WithMessage("*AzureBlobServiceUriByRegion*");
    }

    [Fact]
    public void Resolve_requires_named_regional_binding_key()
    {
        ArtifactLargePayloadOptions snapshot = AzureBlobBaseline("https://defaultacct.blob.core.windows.net/");
        snapshot.AzureBlobServiceUriByRegion = new Dictionary<string, string> { ["eastus"] = "https://other.blob.core.windows.net", };

        RegionalArtifactBlobClientFactory sut = new(Monitor(snapshot), new StaticBearerTokenCredential());

        Action act = () => sut.Resolve("uksouth");

        act.Should().Throw<InvalidOperationException>().WithMessage("*uksouth*");
    }

    [Fact]
    public void Resolve_rejects_local_blob_provider()
    {
        ArtifactLargePayloadOptions snapshot =
            new() { BlobProvider = "None", AzureBlobServiceUri = "https://acct.blob.core.windows.net", };

        RegionalArtifactBlobClientFactory sut = new(Monitor(snapshot), new StaticBearerTokenCredential());

        Action act = () => sut.Resolve(TenantDataRegions.Default);

        act.Should().Throw<InvalidOperationException>().WithMessage("*AzureBlob*");
    }
}
