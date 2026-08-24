using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Integrations.GcpExtractor;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class HostedGcpExtractorClientTests
{
    [Fact]
    public async Task CollectZipAsync_rejects_service_account_project_mismatch()
    {
        Mock<IGcpSubjectTokenProvider> tokenProvider = new();
        GcpWorkloadIdentityCredentialFactory credentialFactory = new(tokenProvider.Object);
        HostedGcpExtractorClient client = new(credentialFactory, NullLogger<HostedGcpExtractorClient>.Instance);

        HostedGcpExtractorCollectionRequest request = new()
        {
            ProjectId = "my-gcp-project",
            WorkloadIdentityPoolProvider = "projects/my-pool/locations/global/workloadIdentityPools/pool/providers/provider",
            ServiceAccountEmail = "readonly@other-gcp-project.iam.gserviceaccount.com"
        };

        Func<Task> act = () => client.CollectZipAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*does not match service account project*");

        tokenProvider.Verify(
            p => p.GetSubjectTokenAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
