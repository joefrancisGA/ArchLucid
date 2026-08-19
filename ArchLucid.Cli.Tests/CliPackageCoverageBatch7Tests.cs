using System.Net;
using System.Text;

using ArchLucid.Cli;
using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch7Tests
{
    [Fact]
    public async Task ComplianceReportAuditLiveSampleFetcher_handles_auth_forbidden_and_success_paths()
    {
        StubHttpMessageHandler handler = new();
        handler.Enqueue(new HttpResponseMessage(HttpStatusCode.Forbidden));
        handler.Enqueue(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                """
                {
                  "items": [
                    { "eventType": "RunStarted", "occurredUtc": "2026-07-01T00:00:00Z" },
                    { "eventType": "RunCompleted", "occurredUtc": "2026-07-01T01:00:00Z" }
                  ]
                }
                """,
                Encoding.UTF8,
                "application/json"),
        });
        handler.Enqueue(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("""{ "items": [] }""", Encoding.UTF8, "application/json"),
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("https://api.example/") };

        ComplianceReportAuditLiveSample forbidden =
            await ComplianceReportAuditLiveSampleFetcher.TryFetchAsync(http, CancellationToken.None);
        forbidden.ApiReached.Should().BeFalse();
        forbidden.ErrorNote.Should().Contain("403");

        ComplianceReportAuditLiveSample withEvents =
            await ComplianceReportAuditLiveSampleFetcher.TryFetchAsync(http, CancellationToken.None);
        withEvents.ApiReached.Should().BeTrue();
        withEvents.EventsInPage.Should().Be(2);
        withEvents.EventTypeCounts.Should().ContainKey("RunStarted").WhoseValue.Should().Be(1);

        ComplianceReportAuditLiveSample empty =
            await ComplianceReportAuditLiveSampleFetcher.TryFetchAsync(http, CancellationToken.None);
        empty.ApiReached.Should().BeTrue();
        empty.EventsInPage.Should().Be(0);
    }

    [Fact]
    public async Task DataConsistencyCommand_reports_usage_errors_without_http()
    {
        int help = await DataConsistencyCommand.RunAsync(["--help"]);
        help.Should().Be(CliExitCode.UsageError);

        int unknown = await DataConsistencyCommand.RunAsync(["bogus"]);
        unknown.Should().Be(CliExitCode.UsageError);

        int missingTarget = await DataConsistencyCommand.RunAsync(["remediate"]);
        missingTarget.Should().Be(CliExitCode.UsageError);

        int unknownTarget = await DataConsistencyCommand.RunAsync(["remediate", "unknown-target"]);
        unknownTarget.Should().Be(CliExitCode.UsageError);
    }

    [Fact]
    public void ComplianceReportRepositoryRootResolver_finds_soc2_template_from_repo_root()
    {
        string? repoRoot = ResolveRepositoryRootFromTestContext();
        repoRoot.Should().NotBeNull();

        bool ok = ComplianceReportRepositoryRootResolver.TryResolve(
            explicitRoot: null,
            searchFromDirectory: repoRoot!,
            out string? resolved);

        ok.Should().BeTrue();
        resolved.Should().NotBeNull();
        File.Exists(Path.Combine(resolved!, ComplianceReportRepositoryRootResolver.Soc2TemplateRelativePath)).Should().BeTrue();

        ComplianceReportRepositoryRootResolver.TryResolve(
            explicitRoot: Path.Combine(repoRoot!, "missing"),
            searchFromDirectory: repoRoot,
            out _).Should().BeFalse();
    }

    [Fact]
    public async Task AuthTokenClaimsDiagnosticClient_reports_missing_api_key()
    {
        string? previous = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", null, EnvironmentVariableTarget.Process);

            AuthTokenClaimsDiagnosticOutcome outcome = await AuthTokenClaimsDiagnosticClient
                .DiagnoseAsync("https://api.example", "token");

            outcome.IsMissingApiKey.Should().BeTrue();
            outcome.ErrorDetail.Should().Contain("ARCHLUCID_API_KEY");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", previous, EnvironmentVariableTarget.Process);
        }
    }

    [Fact]
    public void CliJson_writes_success_and_failure_lines()
    {
        StringWriter writer = new();

        CliJson.WriteFailureLine(writer, CliExitCode.OperationFailed, "boom", "detail");
        CliJson.WriteSuccessLine(writer, new { ok = true, value = 1 });

        string output = writer.ToString();
        output.Should().Contain("\"ok\":false");
        output.Should().Contain("\"ok\":true");
        output.Should().Contain("detail");
    }

    private static string? ResolveRepositoryRootFromTestContext()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        for (int ascent = 0; ascent < 12 && directory is not null; ascent++)
        {
            string candidate = Path.Combine(directory.FullName, ComplianceReportRepositoryRootResolver.Soc2TemplateRelativePath);

            if (File.Exists(candidate))
                return directory.FullName;

            directory = directory.Parent;
        }

        return null;
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new();

        internal void Enqueue(HttpResponseMessage response)
        {
            _responses.Enqueue(response);
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (_responses.Count == 0)
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));

            return Task.FromResult(_responses.Dequeue());
        }
    }
}
