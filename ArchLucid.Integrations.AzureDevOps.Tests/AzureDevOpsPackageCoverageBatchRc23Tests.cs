using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Integrations.AzureDevOps;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Integrations.AzureDevOps.Tests;

[Trait("Category", "Unit")]
public sealed class AzureDevOpsPackageCoverageBatchRc23Tests
{
    [Fact]
    public void PullRequestDecoratorFactory_create_returns_decorator_using_named_http_client()
    {
        Mock<IHttpClientFactory> factory = new();
        factory
            .Setup(f => f.CreateClient(AzureDevOpsPullRequestDecorator.HttpClientName))
            .Returns(new HttpClient());
        AzureDevOpsPullRequestDecoratorFactory sut = new(
            factory.Object,
            Options.Create(new AzureDevOpsIntegrationOptions { Enabled = true }),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        IAzureDevOpsPullRequestDecorator decorator = sut.Create();

        decorator.Should().NotBeNull();
        factory.Verify(f => f.CreateClient(AzureDevOpsPullRequestDecorator.HttpClientName), Times.Once);
    }

    [Fact]
    public async Task CommitStatusPublisher_skips_when_repository_or_pull_request_not_configured()
    {
        Mock<IHttpClientFactory> factory = new();
        AzureDevOpsCommitStatusPublisher sut = new(
            factory.Object,
            Options.Create(new AzureDevOpsIntegrationOptions
            {
                Enabled = true,
                Organization = "org",
                Project = "proj",
                PersonalAccessToken = "pat",
                RepositoryId = Guid.Empty,
                PullRequestId = 0,
            }),
            NullLogger<AzureDevOpsCommitStatusPublisher>.Instance);

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: true, CancellationToken.None);

        factory.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task CommitStatusPublisher_skips_when_organization_project_or_pat_missing()
    {
        Mock<IHttpClientFactory> factory = new();
        AzureDevOpsCommitStatusPublisher sut = new(
            factory.Object,
            Options.Create(new AzureDevOpsIntegrationOptions
            {
                Enabled = true,
                RepositoryId = Guid.NewGuid(),
                PullRequestId = 42,
            }),
            NullLogger<AzureDevOpsCommitStatusPublisher>.Instance);

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: false, CancellationToken.None);

        factory.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public void PullRequestWireFormat_normalizes_blank_status_state_to_succeeded()
    {
        string raw = AzureDevOpsPullRequestWireFormat.SerializeStatusCreate("ok", targetUrl: null, state: "   ");

        raw.Should().Contain("\"state\":\"succeeded\"");
    }
}
