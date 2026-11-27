using System.Net;
using System.Net.Http.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GreenfieldCommitReadinessTests
{
    private const string RunId = "2b76fb9c13474d78a222ced83220dc76";

    [Fact]
    public async Task Already_committed_run_still_posts_finalize()
    {
        using CommittedRunHandler handler = new(HttpStatusCode.OK);
        using HttpClient client = new(handler, disposeHandler: false) { BaseAddress = new Uri("http://localhost") };
        using CancellationTokenSource testBudget = new(TimeSpan.FromSeconds(5));

        await ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync(
            client, RunId, testBudget.Token, maxAttempts: 1);

        handler.FinalizeAttempts.Should().Be(1);
    }

    [Fact]
    public async Task Already_committed_status_does_not_hide_a_finalize_conflict()
    {
        using CommittedRunHandler handler = new(HttpStatusCode.Conflict);
        using HttpClient client = new(handler, disposeHandler: false) { BaseAddress = new Uri("http://localhost") };
        using CancellationTokenSource testBudget = new(TimeSpan.FromSeconds(5));

        GreenfieldCommitRetryBudgetExhaustedException failure =
            await Assert.ThrowsAsync<GreenfieldCommitRetryBudgetExhaustedException>(() =>
                ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync(
                    client, RunId, testBudget.Token, maxAttempts: 1));

        failure.Message.Should().Contain("committed manifest is missing artifact inventory rows");
        handler.FinalizeAttempts.Should().Be(1);
    }

    private sealed class CommittedRunHandler(HttpStatusCode finalizeStatus) : HttpMessageHandler
    {
        public int FinalizeAttempts { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.Method == HttpMethod.Get)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = JsonContent.Create(new { run = new { status = "Committed", currentManifestVersion = "1" } }),
                });
            }

            request.Method.Should().Be(HttpMethod.Post);
            request.RequestUri!.AbsolutePath.Should().Be(IntegrationTestRunLifecycleSupport.FinalizeReviewRelativeUrl(RunId));
            FinalizeAttempts++;
            return Task.FromResult(new HttpResponseMessage(finalizeStatus)
            {
                Content = JsonContent.Create(new { detail = "committed manifest is missing artifact inventory rows" }),
            });
        }
    }
}
