using System.IO;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Comparison;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Xunit;

namespace ArchLucid.Integrations.AzureDevOps.Tests;
[Trait("Category", "Unit")]

public sealed class AzureDevOpsPullRequestDecoratorTests
{
    private static readonly JsonSerializerOptions CompareBodyJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [Fact]
    public async Task PostManifestDeltaAsync_sends_status_and_thread_with_basic_auth()
    {
        List<HttpRequestMessage> captured = [];
        using HttpMessageHandler stub = new CapturingHandler(captured);
        using HttpClient httpClient = new(stub, false);

        AzureDevOpsIntegrationOptions opt = new()
        {
            Organization = "contoso",
            Project = "Fabrikam",
            PersonalAccessToken = "pat-test-token"
        };

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(opt),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        Guid repoId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        AzureDevOpsPullRequestTarget target = new(repoId, 42);

        AzureDevOpsManifestDeltaRequest request = new(
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            null,
            []);

        await sut.PostManifestDeltaAsync(request, target, CancellationToken.None);

        Assert.Equal(2, captured.Count);

        HttpRequestMessage statusReq = captured[0];
        Assert.NotNull(statusReq.Headers.Authorization);
        Assert.Equal("Basic", statusReq.Headers.Authorization.Scheme);
        Assert.Equal(HttpMethod.Post, statusReq.Method);
        Assert.Contains("/pullrequests/42/statuses", statusReq.RequestUri?.ToString(), StringComparison.Ordinal);

        HttpRequestMessage threadReq = captured[1];
        Assert.NotNull(threadReq.Headers.Authorization);
        Assert.Equal("Basic", threadReq.Headers.Authorization.Scheme);
        Assert.Equal(HttpMethod.Post, threadReq.Method);
        Assert.Contains("/pullrequests/42/threads", threadReq.RequestUri?.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task PostManifestDeltaAsync_skips_when_pat_missing()
    {
        List<HttpRequestMessage> captured = [];
        using HttpMessageHandler stub = new CapturingHandler(captured);
        using HttpClient httpClient = new(stub, false);

        AzureDevOpsIntegrationOptions opt = new()
        {
            Organization = "o",
            Project = "p",
            PersonalAccessToken = ""
        };

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(opt),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        AzureDevOpsManifestDeltaRequest request = new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            []);

        await sut.PostManifestDeltaAsync(request, new AzureDevOpsPullRequestTarget(Guid.NewGuid(), 1),
            CancellationToken.None);

        Assert.Empty(captured);
    }

    [Fact]
    public async Task PostManifestDeltaAsync_thread_contains_compare_markdown_and_operator_run_link_when_compare_ok()
    {
        Guid baseRun = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid targetRun = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        ComparisonResult compareBody = new()
        {
            BaseRunId = baseRun,
            TargetRunId = targetRun,
            TotalDeltaCount = 3,
            SummaryHighlights = ["decisions tightened"]
        };

        string compareJson = JsonSerializer.Serialize(compareBody, CompareBodyJsonOptions);

        using RoutingHandler stub = new(compareJson);
        using HttpClient httpClient = new(stub, false);

        AzureDevOpsIntegrationOptions opt = new()
        {
            Organization = "contoso",
            Project = "Fabrikam",
            PersonalAccessToken = "pat-test-token",
            ArchLucidApiBaseUrl = "https://api.test",
            ArchLucidApiKey = "test-key",
            StatusTargetUrl = "https://ops.example"
        };

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(opt),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        AzureDevOpsManifestDeltaRequest request = new(
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            targetRun,
            tenantId,
            workspaceId,
            projectId,
            baseRun,
            [new AuthorityRunCompletedFindingLink("f1", "https://ops.example/x", "High")]);

        await sut.PostManifestDeltaAsync(
            request,
            new AzureDevOpsPullRequestTarget(Guid.Parse("11111111-1111-1111-1111-111111111112"), 7),
            CancellationToken.None);

        Assert.Equal(3, stub.CallCount);
        Assert.NotNull(stub.CompareUri);
        Assert.EndsWith("/v1/compare", stub.CompareUri!.AbsolutePath, StringComparison.Ordinal);
        Assert.Contains($"baseRunId={baseRun:D}", stub.CompareUri.Query, StringComparison.Ordinal);
        Assert.Contains($"targetRunId={targetRun:D}", stub.CompareUri.Query, StringComparison.Ordinal);
        Assert.Equal("test-key", stub.CompareApiKey);

        Assert.NotNull(stub.ThreadJson);
        using JsonDocument doc = JsonDocument.Parse(stub.ThreadJson!);
        string content = doc.RootElement.GetProperty("comments")[0].GetProperty("content").GetString() ?? "";

        Assert.Contains("decisions tightened", content, StringComparison.Ordinal);
        Assert.Contains($"https://ops.example/runs/{targetRun:D}", content, StringComparison.Ordinal);
    }

    [Fact]
    public async Task PostManifestDeltaAsync_skips_compare_when_previous_run_id_null()
    {
        using RecordingOkHandler stub = new();
        using HttpClient httpClient = new(stub);

        AzureDevOpsIntegrationOptions opt = IntegrationOptions();

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(opt),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        await sut.PostManifestDeltaAsync(
            Request(previousRunId: null),
            new AzureDevOpsPullRequestTarget(Guid.Parse("11111111-1111-1111-1111-111111111113"), 1),
            CancellationToken.None);

        Assert.Equal(2, stub.AbsoluteUrls.Count);
        Assert.DoesNotContain(stub.AbsoluteUrls, u => u.Contains("/v1/compare", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostManifestDeltaAsync_skips_compare_when_previous_run_id_empty()
    {
        using RecordingOkHandler stub = new();
        using HttpClient httpClient = new(stub);

        AzureDevOpsIntegrationOptions opt = IntegrationOptions();

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(opt),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        await sut.PostManifestDeltaAsync(
            Request(previousRunId: Guid.Empty),
            new AzureDevOpsPullRequestTarget(Guid.Parse("11111111-1111-1111-1111-111111111114"), 2),
            CancellationToken.None);

        Assert.Equal(2, stub.AbsoluteUrls.Count);
        Assert.DoesNotContain(stub.AbsoluteUrls, u => u.Contains("/v1/compare", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostManifestDeltaAsync_skips_compare_when_arch_lucid_api_not_configured()
    {
        using RecordingOkHandler stub = new();
        using HttpClient httpClient = new(stub);

        AzureDevOpsIntegrationOptions opt = IntegrationOptions(withArchLucidCompare: false);

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(opt),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        Guid previousRun = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        await sut.PostManifestDeltaAsync(
            Request(previousRun),
            new AzureDevOpsPullRequestTarget(Guid.Parse("11111111-1111-1111-1111-111111111115"), 3),
            CancellationToken.None);

        Assert.Equal(2, stub.AbsoluteUrls.Count);
        Assert.DoesNotContain(stub.AbsoluteUrls, u => u.Contains("/v1/compare", StringComparison.Ordinal));
    }

    [Fact]
    public async Task PostManifestDeltaAsync_fallbacks_when_compare_returns_null_literal_json()
    {
        Guid baseRun = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        using RoutingHandler stub = new("null", HttpStatusCode.OK);
        using HttpClient httpClient = new(stub);

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(
                IntegrationOptions(withArchLucidCompare: true, statusTargetUrl: "https://ops.example/")),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        await sut.PostManifestDeltaAsync(
            Request(baseRun,
                [
                    new AuthorityRunCompletedFindingLink("x", "https://example.com/find", "High")
                ]),
            new AzureDevOpsPullRequestTarget(Guid.Parse("44444444-4444-4444-4444-444444444444"), 9),
            CancellationToken.None);

        Assert.NotNull(stub.CompareUri);

        Assert.NotNull(stub.ThreadJson);

        Assert.Contains(
            "## ArchLucid — run completed",
            stub.ThreadJson!,
            StringComparison.Ordinal);

        Assert.Contains("High", stub.ThreadJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task PostManifestDeltaAsync_fallbacks_when_compare_returns_not_found()
    {
        Guid baseRun = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab");

        using RoutingHandler stub = new(string.Empty, HttpStatusCode.NotFound);
        using HttpClient httpClient = new(stub);

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(
                IntegrationOptions(withArchLucidCompare: true)),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        await sut.PostManifestDeltaAsync(
            Request(baseRun,
                []),
            new AzureDevOpsPullRequestTarget(Guid.Parse("55555555-5555-5555-5555-555555555555"), 10),
            CancellationToken.None);

        Assert.NotNull(stub.CompareUri);

        Assert.NotNull(stub.ThreadJson);

        Assert.Contains(
            "## ArchLucid — run completed",
            stub.ThreadJson!,
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task PostManifestDeltaAsync_fallbacks_when_compare_returns_non_success()
    {
        Guid baseRun = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac");

        using RoutingHandler stub = new(
            "{\"message\":\"boom\"}",
            HttpStatusCode.BadRequest);
        using HttpClient httpClient = new(stub);

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(
                IntegrationOptions(withArchLucidCompare: true)),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        await sut.PostManifestDeltaAsync(Request(baseRun, []),
            new AzureDevOpsPullRequestTarget(Guid.Parse("66666666-6666-6666-6666-666666666666"), 11),
            CancellationToken.None);

        Assert.Contains(
            "## ArchLucid — run completed",
            stub.ThreadJson!,
            StringComparison.Ordinal);
    }

    [Fact]
    public async Task PostManifestDeltaAsync_fallbacks_when_compare_request_throws()
    {
        using ThrowOnCompareHttpHandler stub = new();
        using HttpClient httpClient = new(stub);

        Guid baseRun = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad");

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(
                IntegrationOptions(withArchLucidCompare: true, statusTargetUrl: "https://status.example")),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        await sut.PostManifestDeltaAsync(
            Request(baseRun, []),
            new AzureDevOpsPullRequestTarget(Guid.Parse("77777777-7777-7777-7777-777777777777"), 12),
            CancellationToken.None);

        Assert.Equal(3, stub.CallCount);
        Assert.NotNull(stub.ThreadJsonBody);

        Assert.Contains(
            "## ArchLucid — run completed",
            stub.ThreadJsonBody!,
            StringComparison.Ordinal);

        Assert.Contains("https://status.example/runs/", stub.ThreadJsonBody, StringComparison.Ordinal);
    }

    [Fact]
    public async Task PostManifestDeltaAsync_percent_encodes_organization_and_project_in_dev_azure_urls()
    {
        using RecordingOkHandler stub = new();
        using HttpClient httpClient = new(stub);

        string orgEncoded = Uri.EscapeDataString("Org With Space");
        string projectEncoded = Uri.EscapeDataString("Proj With Space");

        AzureDevOpsIntegrationOptions opt = new()
        {
            Organization = "Org With Space",
            Project = "Proj With Space",
            PersonalAccessToken = "pat-test-token",
            ArchLucidApiBaseUrl = "https://cluster.example",
            ArchLucidApiKey = "key",
            StatusTargetUrl = "https://ops.example"
        };

        AzureDevOpsPullRequestDecorator sut = new(
            httpClient,
            Options.Create(opt),
            NullLogger<AzureDevOpsPullRequestDecorator>.Instance);

        await sut.PostManifestDeltaAsync(Request(previousRunId: null, findings: []),
            new AzureDevOpsPullRequestTarget(Guid.Parse("88888888-8888-8888-8888-888888888888"), 13),
            CancellationToken.None);

        Guid repoId = Guid.Parse("88888888-8888-8888-8888-888888888888");

        string expectedSegment =
            $"https://dev.azure.com/{orgEncoded}/{projectEncoded}/_apis/git/repositories/{repoId:D}/pullrequests/13";

        Assert.True(
            stub.AbsoluteUrls.All(u =>
                string.IsNullOrEmpty(u)
                || u.StartsWith($"https://dev.azure.com/{orgEncoded}/{projectEncoded}/", StringComparison.Ordinal)),
            $"Expected escaped org/project segments. URLs: [{string.Join(", ", stub.AbsoluteUrls)}]");

        Assert.Contains($"{expectedSegment}/statuses", stub.AbsoluteUrls[0], StringComparison.Ordinal);
        Assert.Contains($"{expectedSegment}/threads", stub.AbsoluteUrls[1], StringComparison.Ordinal);
    }

    private static AzureDevOpsIntegrationOptions IntegrationOptions(
        bool withArchLucidCompare = true,
        string? statusTargetUrl = null)
    {
        return new AzureDevOpsIntegrationOptions
        {
            Organization = "contoso",
            Project = "Fabrikam",
            PersonalAccessToken = "pat-token",
            ArchLucidApiBaseUrl = withArchLucidCompare ? "https://cluster.example" : "",
            ArchLucidApiKey = withArchLucidCompare ? "api-key" : "",
            StatusTargetUrl = statusTargetUrl ?? ""
        };
    }

    private static AzureDevOpsManifestDeltaRequest Request(
        Guid? previousRunId = null,
        IReadOnlyList<AuthorityRunCompletedFindingLink>? findings = null)
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        return new AzureDevOpsManifestDeltaRequest(
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            runId,
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Guid.Parse("55555555-5555-5555-5555-555555555555"),
            previousRunId,
            findings ?? []);
    }

    private sealed class RecordingOkHandler : HttpMessageHandler
    {
        internal List<string> AbsoluteUrls { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            AbsoluteUrls.Add(request.RequestUri?.AbsoluteUri ?? string.Empty);

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }

    private sealed class ThrowOnCompareHttpHandler : HttpMessageHandler
    {
        internal int CallCount { get; private set; }

        internal string? ThreadJsonBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            CallCount++;
            string url = request.RequestUri?.AbsoluteUri ?? string.Empty;

            if (url.Contains("/v1/compare", StringComparison.Ordinal))
                throw new IOException("Synthetic compare transport failure.");

            if (url.Contains("/threads", StringComparison.Ordinal) && request.Content is not null)

                ThreadJsonBody = await request.Content.ReadAsStringAsync(cancellationToken);

            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }

    private sealed class RoutingHandler(string compareJson,
        HttpStatusCode compareResponseStatusCode = HttpStatusCode.OK) : HttpMessageHandler
    {
        internal int CallCount
        {
            get;
            private set;
        }

        internal Uri? CompareUri
        {
            get;
            private set;
        }

        internal string? CompareApiKey
        {
            get;
            private set;
        }

        internal string? ThreadJson
        {
            get;
            private set;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            CallCount++;
            string url = request.RequestUri?.AbsoluteUri ?? string.Empty;

            if (url.Contains("/v1/compare", StringComparison.Ordinal))
            {
                CompareUri = request.RequestUri;
                CompareApiKey = request.Headers.TryGetValues("X-Api-Key", out IEnumerable<string>? keys)
                    ? keys.First()
                    : null;

                HttpResponseMessage compareResponseMessage = new(compareResponseStatusCode);

                if (compareResponseStatusCode != HttpStatusCode.NotFound)
                {
                    compareResponseMessage.Content =
                        new StringContent(compareJson, Encoding.UTF8, "application/json");
                }

                return compareResponseMessage;
            }

            if (url.Contains("/threads", StringComparison.Ordinal) && request.Content is not null)

                ThreadJson = await request.Content.ReadAsStringAsync(cancellationToken);

            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        private readonly List<HttpRequestMessage> _captured;

        internal CapturingHandler(List<HttpRequestMessage> captured)
        {
            _captured = captured;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            HttpRequestMessage snapshot = new(request.Method, request.RequestUri)
            {
                Version = request.Version
            };

            if (request.Headers.Authorization is not null)

                snapshot.Headers.Authorization = new AuthenticationHeaderValue(
                    request.Headers.Authorization.Scheme,
                    request.Headers.Authorization.Parameter);

            _captured.Add(snapshot);

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }
}
