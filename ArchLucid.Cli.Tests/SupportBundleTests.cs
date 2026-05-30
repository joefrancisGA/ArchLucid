using System.Net;
using System.Text;

using ArchLucid.Cli.Support;

using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SupportBundleTests
{
    [Fact]
    public void RedactHttpUrl_strips_user_info()
    {
        SupportBundleRedactor.RedactHttpUrl("https://user:secret@api.example.com:8443/v1")
            .Should()
            .Be("https://api.example.com:8443/v1");
    }

    [Fact]
    public void IsSensitiveEnvironmentVariableName_detects_common_secret_patterns()
    {
        SupportBundleRedactor.IsSensitiveEnvironmentVariableName("ARCHLUCID_API_KEY").Should().BeTrue();
        SupportBundleRedactor.IsSensitiveEnvironmentVariableName("ARCHLUCID_SOME_PASSWORD").Should().BeTrue();
        SupportBundleRedactor.IsSensitiveEnvironmentVariableName("DOTNET_ROOT").Should().BeFalse();
    }

    [Fact]
    public void RedactSensitivePatterns_strips_bearer_api_key_and_connection_secrets()
    {
        const string raw = """
                           {"h":"Authorization: Bearer supersecret","x":"X-Api-Key: abcdef","c":"Server=x;Password=hunter2;AccountKey=akey;"}
                           """;

        string redacted = SupportBundleRedactor.RedactSensitivePatterns(raw);

        redacted.Should().NotContain("supersecret");
        redacted.Should().NotContain("abcdef");
        redacted.Should().NotContain("hunter2");
        redacted.Should().NotContain("akey");
        redacted.Should().Contain("[REDACTED]");
    }

    [Fact]
    public void RedactSensitivePatterns_replaces_email_addresses()
    {
        string redacted = SupportBundleRedactor.RedactSensitivePatterns("op logs: u_1@tenant.example.org done");

        redacted.Should().Be("op logs: [REDACTED_EMAIL] done");
    }

    [Fact]
    public void RedactSensitivePatterns_strips_saml_private_key_markers()
    {
        string raw =
            "-----BEGIN PRIVATE KEY-----" + Environment.NewLine
            + "SYNTHETIC_SUPPORT_BUNDLE_REDACTION_TEST_NOT_A_REAL_PRIVATE_KEY"
            + Environment.NewLine + "-----END PRIVATE KEY-----";

        string redacted = SupportBundleRedactor.RedactSensitivePatterns(raw);

        redacted.Should().NotContain("BEGIN PRIVATE KEY");
        redacted.Should().Contain("[REDACTED_PRIVATE_KEY]");
    }

    [Fact]
    public void RedactSensitivePatterns_strips_jwt_openai_sk_json_keys_and_long_content_fields()
    {
        const string markerJwt = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIiJ9.BADMARKERPAYLOADSIGNATUREZZZZ.BADMARKERSIGTOKENZZZZZ";
        const string markerSk = "sk-proj-ABCDEFGHIJKLMNOPABCDEFGHIJKLMNOPABCDEF";
        const string markerCompact = "{\"apiKey\":\"K_COMPACT_SECRET_LEAK_xx\"}";
        string markerPromptPad = "{\"content\":\"" + "PROMPT_UNIQUE_PAD_" + new string('z', 450) + "\"}";

        string raw =
            $"{markerJwt} bearer {markerSk} {markerCompact}\r\nAuthorization: Bearer shouldalsoredact\r\n{markerPromptPad}";

        string redacted = SupportBundleRedactor.RedactSensitivePatterns(raw);

        redacted.Should().NotContain("BADMARKERPAYLOADSIGNATUREZZZZ");
        redacted.Should().NotContain(markerSk);
        redacted.Should().NotContain("K_COMPACT_SECRET_LEAK_xx");
        redacted.Should().NotContain("PROMPT_UNIQUE_PAD_");
        redacted.Should().Contain("[REDACTED_JWT]");
        redacted.Should().Contain("[REDACTED_API_KEY]");
        redacted.Should().Contain("[REDACTED_LONG_STRING]");
    }

    [Fact]
    public async Task CollectAsync_with_mock_http_produces_all_sections()
    {
        using HttpMessageHandler handler = new StubApiHandler();
        using HttpClient http = new(handler);
        http.BaseAddress = new Uri("http://stub.local");
        ArchLucidApiClient client = new(http);

        ArchLucidProjectScaffolder.ArchLucidCliConfig config = new()
        {
            ProjectName = "p",
            SchemaVersion = "1.0",
            ApiUrl = "http://stub.local",
            Inputs = new ArchLucidProjectScaffolder.InputsSection { Brief = "inputs/brief.md" },
            Outputs = new ArchLucidProjectScaffolder.OutputsSection { LocalCacheDir = "outputs" },
            Plugins = new ArchLucidProjectScaffolder.PluginsSection { LockFile = "plugins/x.json" },
            Infra = new ArchLucidProjectScaffolder.InfraSection
            {
                Terraform = new ArchLucidProjectScaffolder.TerraformSection
                {
                    Enabled = false,
                    Path = "infra/terraform"
                }
            }
        };

        string cwd = Path.Combine(Path.GetTempPath(),
            "ArchLucidSupportBundleTests." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            Directory.CreateDirectory(cwd);
            Directory.CreateDirectory(Path.Combine(cwd, "outputs"));
            await File.WriteAllTextAsync(Path.Combine(cwd, "outputs", "x.txt"), "hello");

            SupportBundlePayload payload =
                await SupportBundleCollector.CollectAsync(client, cwd, config, CancellationToken.None);

            payload.Build.Cli.InformationalVersion.Should().NotBeNullOrWhiteSpace();
            payload.Build.ApiVersionJson.Should().Contain("informationalVersion");
            payload.Health.Ready.HttpStatus.Should().Be(200);
            payload.ApiContract.MicrosoftOpenApiV1.HttpStatus.Should().Be(200);
            payload.ApiContract.MicrosoftOpenApiV1.BodyPreview.Should().Contain("openapi");
            payload.Health.Live.HttpStatus.Should().Be(200);
            payload.Health.Ready.HttpStatus.Should().Be(200);
            payload.References.ApiEndpoints.Should().NotBeEmpty();
            SupportBundleCollector.SerializeIndented(payload).Should().NotContain("Bearer ");
            payload.Manifest.TriageReadOrder[0].File.Should().Be(SupportBundleArchiveWriter.TriageIndexJsonFileName);
            payload.Manifest.TriageReadOrder[1].File.Should().Be(SupportBundleLayout.DiagnosticsSummaryFileName);
            payload.Manifest.TriageReadOrder[2].File.Should().Be(SupportBundleLayout.NextStepsFileName);
            payload.Manifest.TriageReadOrder[3].File.Should().Be(SupportBundleArchiveWriter.HealthFileName);
            payload.ConfigSummary.HasArchlucidJson.Should().BeTrue();
            payload.Workspace.FileCount.Should().Be(1);
            payload.References.Documentation.Should()
                .Contain(d => d.StartsWith(SupportBundleDocLinks.PilotRescuePlaybookRelativePath, StringComparison.Ordinal));
            payload.Health.AttemptedHealthRelativePaths.Should()
                .Equal("/health/live", "/health/ready", "/health/diagnostics");
            payload.References.CorrelationTraceGuidance.Should().HaveCount(SupportBundleCorrelationTraceCatalog.GuidanceBullets.Count);
            payload.References.CorrelationTraceGuidance.Should()
                .Contain(s => s.Contains("X-Correlation-ID", StringComparison.OrdinalIgnoreCase));
            payload.ConfigSummary.StorageProviderSummary.Should().NotBeNullOrWhiteSpace();
            payload.ConfigSummary.HostAuthModeSummary.Should().NotBeNullOrWhiteSpace();
            payload.ConfigSummary.ValidateConfigAlerts.Should()
                .Contain(a => a.Severity == "Warning"
                              && string.Equals(a.Category, "Bootstrap", StringComparison.Ordinal)
                              && a.Check.Contains("appsettings", StringComparison.OrdinalIgnoreCase));
        }
        finally
        {
            if (Directory.Exists(cwd))

                Directory.Delete(cwd, true);
        }
    }

    [Fact]
    public void WriteDirectory_creates_expected_files()
    {
        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/tmp" },
            new SupportBundleBuildSection(),
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary(),
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            new SupportBundleLogsSection());

        string dir = Path.Combine(Path.GetTempPath(), "bundleWrt." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            SupportBundleArchiveWriter.WriteDirectory(payload, dir);

            File.Exists(Path.Combine(dir, SupportBundleArchiveWriter.ManifestFileName)).Should().BeTrue();
            File.Exists(Path.Combine(dir, SupportBundleArchiveWriter.ReadmeFileName)).Should().BeTrue();
            File.Exists(Path.Combine(dir, SupportBundleLayout.NextStepsFileName)).Should().BeTrue();
            File.Exists(Path.Combine(dir, SupportBundleArchiveWriter.RedactionManifestFileName)).Should().BeTrue();
            File.Exists(Path.Combine(dir, SupportBundleLayout.DiagnosticsSummaryFileName)).Should().BeTrue();
            File.Exists(Path.Combine(dir, SupportBundleArchiveWriter.HealthFileName)).Should().BeTrue();
            File.Exists(Path.Combine(dir, SupportBundleArchiveWriter.ApiContractFileName)).Should().BeTrue();
            File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.ManifestFileName)).Should()
                .Contain("bundleFormatVersion");
            File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.ManifestFileName)).Should()
                .Contain("includedFilesLexOrder");
            File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.ManifestFileName)).Should()
                .Contain("redactionPassAppliedToSerializedSections");
            File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.ManifestFileName)).Should()
                .Contain("redactionManifestPath");
            File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.ReadmeFileName)).Should()
                .Contain("next-steps.json");
        }
        finally
        {
            if (Directory.Exists(dir))

                Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void WriteDirectoryWithRedaction_writes_triage_index_files_when_provided()
    {
        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/tmp" },
            new SupportBundleBuildSection(),
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary { HostAuthModeSummary = "DevelopmentBypass" },
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            new SupportBundleLogsSection());

        SupportBundleTriageIndexDocument triageIndex = new()
        {
            GeneratedUtc = "2026-01-01T00:00:00Z",
            ConfigModeSummary = "DevelopmentBypass",
            RedactionManifestStatus = "PASS",
            StructuralExecutionModeLabel = "Simulator",
            RecentAuditEventIds = ["audit-1"]
        };

        string dir = Path.Combine(Path.GetTempPath(), "bundleTriage." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            SupportBundleArchiveWriter.WriteDirectoryWithRedaction(payload, dir, triageIndex);

            File.Exists(Path.Combine(dir, SupportBundleArchiveWriter.TriageIndexJsonFileName)).Should().BeTrue();
            File.Exists(Path.Combine(dir, SupportBundleArchiveWriter.TriageIndexMarkdownFileName)).Should().BeTrue();
            File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.TriageIndexJsonFileName)).Should().Contain("audit-1");
            File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.TriageIndexMarkdownFileName))
                .Should()
                .Contain("Redaction manifest: PASS")
                .And.Contain("Structural execution mode: Simulator");
        }
        finally
        {
            if (Directory.Exists(dir))

                Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void WriteDirectoryWithRedaction_manifest_records_pattern_rules_and_redacts_bearer_in_log_excerpt()
    {
        SupportBundleLogsSection logs = new()
        {
            LocalLogExcerpt = "Authorization: Bearer supersecret\r\nok"
        };

        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/tmp" },
            new SupportBundleBuildSection(),
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary(),
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            logs);

        string dir = Path.Combine(Path.GetTempPath(), "bundleRedact." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            SupportBundleArchiveWriter.WriteDirectoryWithRedaction(payload, dir);

            string manifest = File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.ManifestFileName));
            string redactionManifest = File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.RedactionManifestFileName));

            manifest.Should().Contain("\"redactionPassAppliedToSerializedSections\": true");
            manifest.Should().Contain("strip-authorization-bearer-secret");
            manifest.Should().Contain("mask-jwt-like-tokens");
            manifest.Should().Contain("mask-json-escaped-jwt-strings");
            manifest.Should().Contain("includedFilesLexOrder");
            manifest.Should().Contain("redaction-manifest.json");
            redactionManifest.Should().Contain("\"status\": \"PASS\"");
            redactionManifest.Should().Contain("NOT_RECORDED_BY_DESIGN_PATTERN_REDACTION_APPLIED");
            redactionManifest.Should().Contain("raw API key values");
            redactionManifest.Should().Contain("Pattern redaction is a defense-in-depth support control");
            redactionManifest.Should().Contain(SupportBundleArchiveWriter.LogsFileName);
            redactionManifest.Should().NotContain("supersecret");

            string diagnostics = File.ReadAllText(Path.Combine(dir, SupportBundleLayout.DiagnosticsSummaryFileName));

            diagnostics.Should().Contain("automated log diagnostics");
            diagnostics.Should().NotContain("supersecret");

            string logJson = File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.LogsFileName));

            logJson.Should().NotContain("supersecret");
            logJson.Should().Contain("[REDACTED]");
        }
        finally
        {
            if (Directory.Exists(dir))

                Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void WriteDirectoryWithRedaction_no_file_text_contains_obvious_secret_markers()
    {
        const string csMarker = "Server=tcp:evil.example.com,1433;Password=UNIQUE_CS_PASSWORD_MARKER_42;";
        const string jwtMarker =
            "eyJhbGciOiJub25lIiwidHlwIjoiSldUIiJ9.UNIQUEJWTBODYMARKER999ZZ.UNIQUEJWTSIGZZZZZZZZ";
        const string skMarker = "sk-proj-UNIQUESKPROJMARKER123456789012345678901234";
        string promptPad = "{\"systemPrompt\":\"" + "UNIQUE_SYSTEM_PROMPT_" + new string('y', 420) + "\"}";

        SupportBundleLogsSection logs = new()
        {
            LocalLogExcerpt =
                $"probe {jwtMarker} key {skMarker} {csMarker}\r\nAuthorization: Bearer UNIQUE_BEARER_MARK\r\n{promptPad}"
        };

        SupportBundleBuildSection build = new()
        {
            ApiVersionJson = "{\"token\":\"" + jwtMarker + "\"}"
        };

        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/tmp" },
            build,
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary(),
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            logs);

        string dir = Path.Combine(Path.GetTempPath(), "bundleSecretShape." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            SupportBundleArchiveWriter.WriteDirectoryWithRedaction(payload, dir);

            string combined = string.Join('\n', Directory.GetFiles(dir, "*", SearchOption.TopDirectoryOnly)
                .Select(File.ReadAllText));

            combined.Should().NotContain("UNIQUE_CS_PASSWORD_MARKER_42");
            combined.Should().NotContain("UNIQUEJWTBODYMARKER999ZZ");
            combined.Should().NotContain("UNIQUESKPROJMARKER");
            combined.Should().NotContain("UNIQUE_BEARER_MARK");
            combined.Should().NotContain("UNIQUE_SYSTEM_PROMPT_");
        }
        finally
        {
            if (Directory.Exists(dir))

                Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void Incident_drill_bundle_surfaces_correlation_run_subsystem_and_redaction_pass()
    {
        const string correlationId = "corr-incident-drill-001";
        const string runId = "run-incident-drill-001";

        SupportBundleLogsSection logs = new()
        {
            LocalLogExcerpt =
                $"x-correlation-id: {correlationId}\r\nGET /v1/pilots/runs/{runId}/pilot-run-deltas failed HTTP 502"
        };

        SupportBundleHealthSection health = new()
        {
            Live = new SupportBundleHealthProbe { HttpStatus = 503 },
            Ready = new SupportBundleHealthProbe { HttpStatus = 503 },
            Combined = new SupportBundleHealthProbe { HttpStatus = 503 }
        };

        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/tmp" },
            new SupportBundleBuildSection(),
            health,
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary { HostAuthModeSummary = "ApiKey", ApiBaseUrlRedacted = "http://stub.local" },
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            logs);

        SupportBundleTriageIndexDocument triageIndex = new()
        {
            GeneratedUtc = "2026-05-30T00:00:00Z",
            ApiBaseUrlRedacted = "http://stub.local",
            Run = new SupportBundleTriageRunSection
            {
                RunId = runId,
                RequestId = "REQ-INCIDENT-001",
                Status = "ExecutionCompleted"
            },
            Health = new SupportBundleTriageHealthSection
            {
                LiveHttpStatus = 503,
                ReadyHttpStatus = 503,
                CombinedHttpStatus = 503
            },
            ConfigModeSummary = "ApiKey",
            RedactionManifestStatus = "PASS",
            LatestFailedGateHint = "/health/ready returned HTTP 503",
            Notes = ["Proof disposition WARN — sponsor handoff requires review before external send."]
        };

        string dir = Path.Combine(Path.GetTempPath(), "bundleIncident." + Guid.NewGuid().ToString("N")[..8]);

        try
        {
            SupportBundleArchiveWriter.WriteDirectoryWithRedaction(payload, dir, triageIndex);

            string triageMarkdown = File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.TriageIndexMarkdownFileName));
            string redactionManifest = File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.RedactionManifestFileName));
            string logsJson = File.ReadAllText(Path.Combine(dir, SupportBundleArchiveWriter.LogsFileName));

            triageMarkdown.Should().Contain(runId);
            triageMarkdown.Should().Contain("HTTP 503");
            triageMarkdown.Should().Contain("Proof disposition WARN");
            logsJson.Should().Contain(correlationId);
            redactionManifest.Should().Contain("\"status\": \"PASS\"");
            redactionManifest.Should().Contain("fileIntegrity");
        }
        finally
        {
            if (Directory.Exists(dir))
                Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void WriteZip_contains_json_entries()
    {
        SupportBundlePayload payload = new(
            new SupportBundleManifest { CreatedUtc = "2026-01-01T00:00:00Z", CliWorkingDirectory = "/x" },
            new SupportBundleBuildSection(),
            new SupportBundleHealthSection(),
            new SupportBundleApiContractSection(),
            new SupportBundleConfigSummary(),
            new SupportBundleEnvironmentSection(),
            new SupportBundleWorkspaceSection(),
            new SupportBundleReferencesSection(),
            new SupportBundleLogsSection());

        string dir = Path.Combine(Path.GetTempPath(), "bundleZip." + Guid.NewGuid().ToString("N")[..8]);
        string zip = dir + ".zip";

        try
        {
            SupportBundleArchiveWriter.WriteDirectory(payload, dir);
            SupportBundleArchiveWriter.WriteZip(dir, zip);

            File.Exists(zip).Should().BeTrue();
        }
        finally
        {
            if (File.Exists(zip))

                File.Delete(zip);


            if (Directory.Exists(dir))

                Directory.Delete(dir, true);
        }
    }

    private sealed class StubApiHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;
            string json;

            if (string.Equals(path, "/version", StringComparison.Ordinal))
                json = """{"application":"ArchLucid.Api","informationalVersion":"1.0-test"}""";
            else if (string.Equals(path, "/openapi/v1.json", StringComparison.Ordinal))
                json = """{"openapi":"3.0.1","info":{"title":"ArchLucid"}}""";
            else
                json = """{"status":"Healthy"}""";


            HttpResponseMessage response = new(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            return Task.FromResult(response);
        }
    }
}
