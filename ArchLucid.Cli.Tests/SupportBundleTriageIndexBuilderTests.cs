using ArchLucid.Cli.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SupportBundleTriageIndexBuilderTests
{
    [Fact]
    public void ToMarkdown_includes_scope_and_health_without_secrets()
    {
        SupportBundleTriageIndexDocument index = new()
        {
            GeneratedUtc = "2026-05-27T12:00:00Z",
            ApiBaseUrlRedacted = "http://stub.local",
            Scope = new SupportBundleTriageScopeSection
            {
                TenantId = "tenant-1",
                WorkspaceId = "workspace-1",
                ProjectId = "default"
            },
            Health = new SupportBundleTriageHealthSection
            {
                LiveHttpStatus = 200,
                ReadyHttpStatus = 200,
                CombinedHttpStatus = 200
            },
            ConfigModeSummary = "DevelopmentBypass",
            HostVersionSummary = "1.0-test",
            RecentAuditEventIds = ["evt-1"],
            ArtifactIds = ["art-1"],
            Notes = ["Identifiers only"]
        };

        string md = SupportBundleTriageIndexBuilder.ToMarkdown(index);

        md.Should().Contain("tenant-1");
        md.Should().Contain("evt-1");
        md.Should().Contain("art-1");
        md.Should().NotContain("Bearer ");
    }

    [Fact]
    public async Task BuildAsync_without_run_id_still_emits_health_and_config()
    {
        using HttpMessageHandler handler = new StubApiHandler();
        using HttpClient http = new(handler);
        http.BaseAddress = new Uri("http://stub.local");
        ArchLucidApiClient client = new(http);

        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/tmp" },
            new SupportBundleBuildSection { ApiVersionJson = """{"informationalVersion":"1.0-test"}""" },
            new SupportBundleHealthSection
            {
                Live = new SupportBundleHealthProbe { HttpStatus = 200 },
                Ready = new SupportBundleHealthProbe { HttpStatus = 200 },
                Combined = new SupportBundleHealthProbe { HttpStatus = 200 }
            },
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary { HostAuthModeSummary = "DevelopmentBypass", ApiBaseUrlRedacted = "http://stub.local" },
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            new SupportBundleLogsSection());

        SupportBundleTriageIndexDocument index =
            await SupportBundleTriageIndexBuilder.BuildAsync(client, payload, runId: null, CancellationToken.None);

        index.Run.Should().BeNull();
        index.Health.ReadyHttpStatus.Should().Be(200);
        index.ConfigModeSummary.Should().Be("DevelopmentBypass");
        index.Schema.Should().Be("archlucid.support-bundle-triage-index.v1");
    }

    private sealed class StubApiHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;
            string json = """{"status":"Healthy"}""";

            if (path.Contains("/v1/audit", StringComparison.Ordinal))
                json = """{"items":[{"eventId":"audit-evt-1","eventType":"RunCreated","occurredUtc":"2026-01-01T00:00:00Z"}]}""";

            HttpResponseMessage response = new(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
            };

            return Task.FromResult(response);
        }
    }
}
