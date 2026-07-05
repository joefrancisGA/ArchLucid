using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.BlobStore;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Jobs;

[Trait("Category", "Unit")]
public sealed class BackgroundJobQueueAddressTests
{
    [Fact]
    public void ResolveQueueServiceUri_returns_direct_uri_when_configured()
    {
        BackgroundJobsOptions jobs = new()
        {
            QueueServiceUri = "https://acct.queue.core.windows.net/",
        };

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, largePayload: null);

        uri.Should().NotBeNull();
        uri!.AbsoluteUri.Should().Be("https://acct.queue.core.windows.net/");
    }

    [Fact]
    public void ResolveQueueServiceUri_derives_queue_uri_from_blob_uri()
    {
        BackgroundJobsOptions jobs = new();
        ArtifactLargePayloadOptions largePayload = new()
        {
            AzureBlobServiceUri = "https://acct.blob.core.windows.net/",
        };

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, largePayload);

        uri.Should().NotBeNull();
        uri!.AbsoluteUri.Should().Be("https://acct.queue.core.windows.net/");
    }

    [Fact]
    public void ResolveQueueServiceUri_returns_null_when_no_blob_uri_configured()
    {
        BackgroundJobsOptions jobs = new();

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, largePayload: null);

        uri.Should().BeNull();
    }

    [Fact]
    public void ResolveQueueServiceUri_returns_null_when_blob_uri_is_not_azure_blob_host()
    {
        BackgroundJobsOptions jobs = new();
        ArtifactLargePayloadOptions largePayload = new()
        {
            AzureBlobServiceUri = "https://files.example.com/container",
        };

        Uri? uri = BackgroundJobQueueAddress.ResolveQueueServiceUri(jobs, largePayload);

        uri.Should().BeNull();
    }

    [Fact]
    public void ResolveQueueServiceUri_throws_when_jobs_null()
    {
        Action act = () => BackgroundJobQueueAddress.ResolveQueueServiceUri(null!, largePayload: null);

        act.Should().Throw<ArgumentNullException>();
    }
}
