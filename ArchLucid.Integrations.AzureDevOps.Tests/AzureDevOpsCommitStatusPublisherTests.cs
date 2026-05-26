using ArchLucid.Integrations.AzureDevOps;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Integrations.AzureDevOps.Tests;

[Trait("Category", "Unit")]
public sealed class AzureDevOpsCommitStatusPublisherTests
{
    [Fact]
    public async Task PublishCommitOutcomeAsync_when_disabled_does_not_call_http()
    {
        Mock<IHttpClientFactory> factory = new();
        AzureDevOpsCommitStatusPublisher sut = new(
            factory.Object,
            Options.Create(new AzureDevOpsIntegrationOptions { Enabled = false }),
            NullLogger<AzureDevOpsCommitStatusPublisher>.Instance);

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: true, CancellationToken.None);

        factory.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }
}
