using System.Net;
using System.Text;

using ArchLucid.Integrations.AzureDevOps.Tests.Support;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Integrations.AzureDevOps.Tests;

/// <summary>
///     RC26 package-coverage batch: exercises the <see cref="AzureDevOpsCommitStatusPublisher" /> POST path, its
///     non-success and transport-failure handling, and the skip paths' log branches.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AzureDevOpsPackageCoverageBatchRc26Tests
{
    private const int PullRequestId = 42;

    private static readonly Guid RepositoryId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task CommitStatusPublisher_posts_succeeded_status_with_basic_auth_and_operator_deep_link()
    {
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        using StubHttpMessageHandler handler = new();
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();

        // Padded organization/PAT plus a trailing slash on the status URL exercise the trimming paths.
        AzureDevOpsCommitStatusPublisher sut = Publisher(
            handler,
            logger,
            OptionsFor(statusTargetUrl: "https://ops.example/"));

        await sut.PublishCommitOutcomeAsync(runId, succeeded: true, CancellationToken.None);

        handler.Requests.Should().HaveCount(1);

        CapturedHttpRequest sent = handler.Requests[0];
        sent.Method.Should().Be(HttpMethod.Post);
        sent.RequestUri!.AbsoluteUri.Should().Be(
            "https://dev.azure.com/contoso/Fabrikam%20Team/_apis/git/repositories/"
            + $"{RepositoryId:D}/pullrequests/{PullRequestId}/statuses?api-version=7.1");
        sent.AuthorizationScheme.Should().Be("Basic");
        sent.AuthorizationParameter.Should().Be(Convert.ToBase64String(Encoding.ASCII.GetBytes(":pat-token")));
        sent.Body.Should().Contain("succeeded").And.Contain($"https://ops.example/runs/{runId:D}");
    }

    [Fact]
    public async Task CommitStatusPublisher_posts_failed_state_and_omits_deep_link_when_status_target_url_blank()
    {
        using StubHttpMessageHandler handler = new();
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();
        AzureDevOpsCommitStatusPublisher sut = Publisher(handler, logger, OptionsFor(statusTargetUrl: "   "));

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: false, CancellationToken.None);

        handler.Requests.Should().HaveCount(1);
        handler.Requests[0].Body.Should().Contain("failed").And.NotContain("/runs/");
    }

    [Fact]
    public async Task CommitStatusPublisher_truncates_long_error_body_in_warning()
    {
        string errorBody = new string('x', 600) + "TAIL";
        using StubHttpMessageHandler handler = new(HttpStatusCode.BadRequest, errorBody);
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();
        AzureDevOpsCommitStatusPublisher sut = Publisher(handler, logger, OptionsFor());

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: true, CancellationToken.None);

        RecordedLogEntry warning = logger.Entries.Single(e => e.Level == LogLevel.Warning);
        warning.Message.Should().Contain("400").And.Contain(new string('x', 512));

        // Only the first 512 characters of the response body are logged.
        warning.Message.Should().NotContain("TAIL");
    }

    [Fact]
    public async Task CommitStatusPublisher_logs_short_error_body_without_truncation()
    {
        using StubHttpMessageHandler handler = new(HttpStatusCode.InternalServerError, "boom");
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();
        AzureDevOpsCommitStatusPublisher sut = Publisher(handler, logger, OptionsFor());

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: false, CancellationToken.None);

        RecordedLogEntry warning = logger.Entries.Single(e => e.Level == LogLevel.Warning);
        warning.Message.Should().Contain("500").And.Contain("boom");
    }

    [Fact]
    public async Task CommitStatusPublisher_swallows_transport_failure_when_not_cancelled()
    {
        using StubHttpMessageHandler handler = new(
            throwOnSend: new HttpRequestException("synthetic transport failure"));
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();
        AzureDevOpsCommitStatusPublisher sut = Publisher(handler, logger, OptionsFor());

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: true, CancellationToken.None);

        handler.Requests.Should().HaveCount(1);

        RecordedLogEntry warning = logger.Entries.Single(e => e.Level == LogLevel.Warning);
        warning.Exception.Should().BeOfType<HttpRequestException>();
    }

    [Fact]
    public async Task CommitStatusPublisher_rethrows_when_cancellation_requested()
    {
        using StubHttpMessageHandler handler = new(throwOnSend: new HttpRequestException("ignored"));
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();
        AzureDevOpsCommitStatusPublisher sut = Publisher(handler, logger, OptionsFor());
        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        // The exception filter only swallows failures while cancellation has not been requested.
        await FluentActions
            .Awaiting(() => sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: true, cts.Token))
            .Should()
            .ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task CommitStatusPublisher_logs_debug_when_repository_or_pull_request_not_configured()
    {
        using StubHttpMessageHandler handler = new();
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();
        AzureDevOpsCommitStatusPublisher sut = Publisher(
            handler,
            logger,
            OptionsFor(repositoryId: Guid.Empty, pullRequestId: 0));

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: true, CancellationToken.None);

        handler.Requests.Should().BeEmpty();
        logger.Entries
            .Should()
            .ContainSingle(e => e.Level == LogLevel.Debug && e.Message.Contains("RepositoryId or PullRequestId"));
    }

    [Fact]
    public async Task CommitStatusPublisher_logs_debug_when_organization_project_or_pat_missing()
    {
        using StubHttpMessageHandler handler = new();
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();
        AzureDevOpsCommitStatusPublisher sut = Publisher(handler, logger, OptionsFor(personalAccessToken: "   "));

        await sut.PublishCommitOutcomeAsync(Guid.NewGuid(), succeeded: true, CancellationToken.None);

        handler.Requests.Should().BeEmpty();
        logger.Entries
            .Should()
            .ContainSingle(e => e.Level == LogLevel.Debug && e.Message.Contains("organization, project, or PAT"));
    }

    [Fact]
    public void CommitStatusPublisher_constructor_rejects_null_dependencies()
    {
        Mock<IHttpClientFactory> factory = new();
        IOptions<AzureDevOpsIntegrationOptions> options = OptionsFor();
        RecordingLogger<AzureDevOpsCommitStatusPublisher> logger = new();

        FluentActions
            .Invoking(() => new AzureDevOpsCommitStatusPublisher(null!, options, logger))
            .Should()
            .Throw<ArgumentNullException>();

        FluentActions
            .Invoking(() => new AzureDevOpsCommitStatusPublisher(factory.Object, null!, logger))
            .Should()
            .Throw<ArgumentNullException>();

        FluentActions
            .Invoking(() => new AzureDevOpsCommitStatusPublisher(factory.Object, options, null!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    private static AzureDevOpsCommitStatusPublisher Publisher(
        HttpMessageHandler handler,
        ILogger<AzureDevOpsCommitStatusPublisher> logger,
        IOptions<AzureDevOpsIntegrationOptions> options)
    {
        // The handler outlives the client here, so the test's using block owns disposal.
        HttpClient client = new(handler, disposeHandler: false);
        Mock<IHttpClientFactory> factory = new();
        factory
            .Setup(f => f.CreateClient(AzureDevOpsCommitStatusPublisher.HttpClientName))
            .Returns(client);

        return new AzureDevOpsCommitStatusPublisher(factory.Object, options, logger);
    }

    private static IOptions<AzureDevOpsIntegrationOptions> OptionsFor(
        string statusTargetUrl = "",
        Guid? repositoryId = null,
        int pullRequestId = PullRequestId,
        string organization = "  contoso  ",
        string project = "Fabrikam Team",
        string personalAccessToken = "  pat-token  ")
    {
        return Options.Create(new AzureDevOpsIntegrationOptions
        {
            Enabled = true,
            Organization = organization,
            Project = project,
            PersonalAccessToken = personalAccessToken,
            RepositoryId = repositoryId ?? RepositoryId,
            PullRequestId = pullRequestId,
            StatusTargetUrl = statusTargetUrl,
        });
    }
}
