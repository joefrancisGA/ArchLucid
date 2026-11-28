using ArchLucid.Api.Controllers.Demo;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Persistence.Caching;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DemoCommitPagePreviewControllerTests
{
    [Theory]
    [InlineData("{etag}", StatusCodes.Status304NotModified)]
    [InlineData("W/{etag}", StatusCodes.Status304NotModified)]
    [InlineData("\"older\", {etag}", StatusCodes.Status304NotModified)]
    [InlineData("*", StatusCodes.Status304NotModified)]
    [InlineData("\"older\", W/\"old\"", StatusCodes.Status200OK)]
    public async Task GetPreview_negotiates_if_none_match_and_preserves_shared_cache_headers(
        string header,
        int expectedStatus)
    {
        DemoCommitPagePreviewResponse payload = new()
        {
            Run = new DemoPreviewRun
            {
                RunId = "fixture-run", ProjectId = "default", CreatedUtc = DateTime.UnixEpoch,
            },
            Manifest = new DemoPreviewManifestSummary
            {
                ManifestId = "fixture-manifest",
                RunId = "fixture-run",
                CreatedUtc = DateTime.UnixEpoch,
                ManifestHash = "fixture-hash",
                RuleSetId = "fixture-rules",
                RuleSetVersion = "v1",
                Status = "ok",
                OperatorSummary = "fixture",
            },
            AuthorityChain = new DemoPreviewAuthorityChain(),
            Artifacts = [],
            PipelineTimeline = [],
            RunExplanation = new RunExplanationSummary
            {
                Explanation = new ExplanationResult { Summary = "fixture" },
                ThemeSummaries = [],
                OverallAssessment = "fixture",
                RiskPosture = "Low",
            },
        };
        Mock<IDemoCommitPagePreviewClient> preview = new();
        preview.Setup(client => client.GetLatestCommittedDemoCommitPageAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(payload);
        Mock<IOptionsMonitor<DemoOptions>> options = new();
        options.SetupGet(monitor => monitor.CurrentValue).Returns(new DemoOptions());
        DemoCommitPagePreviewController controller = new(preview.Object, new DirectCache(), options.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        IActionResult first = await controller.GetDemoCommitPagePreview();
        FileContentResult firstBody = first.Should().BeOfType<FileContentResult>().Subject;
        firstBody.FileContents.Should().NotBeEmpty();
        string etag = controller.Response.Headers.ETag.ToString();
        etag.Should().NotBeNullOrWhiteSpace();

        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.Request.Headers.IfNoneMatch = header.Replace("{etag}", etag, StringComparison.Ordinal);

        IActionResult result = await controller.GetPublicDemoSampleRun();

        if (expectedStatus == StatusCodes.Status304NotModified)
            result.Should().BeOfType<StatusCodeResult>().Which.StatusCode.Should().Be(expectedStatus);
        else
            result.Should().BeOfType<FileContentResult>().Which.FileContents.Should().Equal(firstBody.FileContents);

        controller.Response.Headers.ETag.ToString().Should().Be(etag);
        controller.Response.Headers.CacheControl.ToString().Should()
            .Be("public, max-age=300, s-maxage=300, stale-while-revalidate=60");
    }

    private sealed class DirectCache : IHotPathReadCache
    {
        public Task<T?> GetOrCreateAsync<T>(
            string key,
            Func<CancellationToken, Task<T?>> factory,
            CancellationToken ct,
            int? absoluteExpirationSecondsOverride = null)
            where T : class =>
            factory(ct);

        public Task RemoveAsync(string key, CancellationToken ct) => Task.CompletedTask;
    }
}
