using System.Text.Json;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch14Tests
{
    private static readonly DateTime FixedUtcNow = new(2026, 5, 30, 12, 0, 0, DateTimeKind.Utc);

    public static IEnumerable<object[]> AuthDiagnosticsBlockingCases()
    {
        yield return ["DevelopmentBypass", CreateJwtLikeDiagnostics(authMode: "DevelopmentBypass"), true];
        yield return ["ApiKey", CreateJwtLikeDiagnostics(authMode: "ApiKey"), false];
        yield return ["Audience missing", CreateJwtLikeDiagnostics(audienceConfigured: false), true];
        yield return ["Issuer missing", CreateJwtLikeDiagnostics(issuerOrAuthorityConfigured: false), true];
        yield return ["Discovery failed", CreateJwtLikeDiagnostics(openIdDiscoverySucceeded: false), true];
        yield return ["Jwks missing", CreateJwtLikeDiagnostics(jwksConfigured: false), true];
        yield return
        [
            "Saml SpEntityId missing",
            CreateJwtLikeDiagnostics(saml2Enabled: true, spEntityIdConfigured: false),
            true,
        ];
        yield return
        [
            "Saml role sources missing",
            CreateJwtLikeDiagnostics(
                saml2Enabled: true,
                spEntityIdConfigured: true,
                samlRoleClaimSourcesConfigured: false),
            true,
        ];
        yield return
        [
            "Tenant claim mapping missing",
            CreateJwtLikeDiagnostics(tenantClaimMappingConfigured: false),
            true,
        ];
        yield return ["All good Jwt-like", CreateJwtLikeDiagnostics(), false];
    }

    [Theory]
    [MemberData(nameof(AuthDiagnosticsBlockingCases))]
    public void AuthDiagnosticsBlockingEvaluator_HasBlockingMisconfiguration(
        string scenario,
        AdminAuthConfigurationDiagnosticsResponse response,
        bool expectedBlocking)
    {
        _ = scenario;

        AuthDiagnosticsBlockingEvaluator.HasBlockingMisconfiguration(response).Should().Be(expectedBlocking);
    }

    [Fact]
    public void AuthDiagnosticsBlockingEvaluator_rejects_null_response()
    {
        Action act = () => AuthDiagnosticsBlockingEvaluator.HasBlockingMisconfiguration(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(
        """{"isDemoTenant":true,"estimatedUsdSavings":500}""",
        "WARN")]
    [InlineData(
        """{"estimatedUsdSavings":5000,"extractorCollectionTimestampUtc":"2026-05-29T12:00:00Z"}""",
        "HOLD")]
    [InlineData(
        """
        {
          "estimatedUsdSavings": 1200,
          "extractorCollectionTimestampUtc": "2026-04-01T00:00:00Z",
          "roiMetricSources": [
            { "metricKey": "hours", "label": "Hours", "value": "4", "sourceKind": "CustomerProvided" }
          ]
        }
        """,
        "HOLD")]
    [InlineData(
        """
        {
          "estimatedUsdSavings": 100,
          "extractorCollectionTimestampUtc": "2026-05-29T12:00:00Z",
          "roiMetricSources": [
            { "metricKey": "net", "label": "Net", "value": "100", "sourceKind": "BenchmarkAssumption" }
          ]
        }
        """,
        "WARN")]
    [InlineData(
        """
        {
          "estimatedUsdSavings": 100,
          "extractorCollectionTimestampUtc": "2026-05-29T12:00:00Z",
          "roiMetricSources": [
            { "metricKey": "hours", "label": "Hours", "value": "4", "sourceKind": "CustomerProvided" }
          ]
        }
        """,
        "PASS")]
    [InlineData(
        """
        {
          "estimatedUsdSavings": 1200,
          "extractorCollectionTimestampUtc": "not-a-date",
          "roiMetricSources": [
            { "metricKey": "hours", "label": "Hours", "value": "4", "sourceKind": "CustomerProvided" }
          ]
        }
        """,
        "PASS")]
    [InlineData(
        """
        {
          "estimatedUsdSavings": 1200,
          "roiMetricSources": [
            { "metricKey": "hours", "label": "Hours", "value": "4", "sourceKind": "CustomerProvided" }
          ]
        }
        """,
        "PASS")]
    [InlineData(
        """{"estimatedUsdSavings":"lots","extractorCollectionTimestampUtc":"2026-05-29T12:00:00Z"}""",
        "PASS")]
    [InlineData(
        """{"extractorCollectionTimestampUtc":"2026-05-29T12:00:00Z"}""",
        "PASS")]
    public void PilotProofPacketRoiFreshnessEvaluator_ResolveDisposition_maps_json_deltas(
        string deltasJson,
        string expectedDisposition)
    {
        PilotProofPacketRoiFreshnessEvaluator.ResolveDisposition(deltasJson, FixedUtcNow)
            .Should()
            .Be(expectedDisposition);
    }

    [Theory]
    [InlineData("HOLD")]
    [InlineData("WARN")]
    public void PilotProofPacketRoiFreshnessEvaluator_BuildLimitationsLine_emits_line_for_non_pass(
        string expectedFragment)
    {
        string deltasJson = expectedFragment switch
        {
            "HOLD" => """{"estimatedUsdSavings":5000,"extractorCollectionTimestampUtc":"2026-05-29T12:00:00Z"}""",
            "WARN" => """{"isDemoTenant":true,"estimatedUsdSavings":100}""",
            _ => throw new InvalidOperationException("Unexpected disposition fragment."),
        };

        string line = PilotProofPacketRoiFreshnessEvaluator.BuildLimitationsLine(deltasJson, FixedUtcNow);

        line.Should().Contain("ROI freshness");
        line.Should().Contain(expectedFragment);
    }

    [Fact]
    public void PilotProofPacketRoiFreshnessEvaluator_BuildLimitationsLine_is_empty_for_pass()
    {
        const string deltasJson = """
            {
              "estimatedUsdSavings": 100,
              "extractorCollectionTimestampUtc": "2026-05-29T12:00:00Z",
              "roiMetricSources": [
                { "metricKey": "hours", "label": "Hours", "value": "4", "sourceKind": "CustomerProvided" }
              ]
            }
            """;

        PilotProofPacketRoiFreshnessEvaluator.BuildLimitationsLine(deltasJson, FixedUtcNow).Should().BeEmpty();
    }

    [Fact]
    public void PilotProofPacketRoiFreshnessEvaluator_treats_non_string_timestamp_as_missing()
    {
        const string deltasJson = """
            {
              "estimatedUsdSavings": 1200,
              "extractorCollectionTimestampUtc": 1717200000,
              "roiMetricSources": [
                { "metricKey": "hours", "label": "Hours", "value": "4", "sourceKind": "CustomerProvided" }
              ]
            }
            """;

        PilotProofPacketRoiFreshnessEvaluator.ResolveDisposition(deltasJson, FixedUtcNow).Should().Be("PASS");
    }

    [Fact]
    public void PilotProofPacketGovernanceArtifacts_BuildGovernanceOutcomeSummaryJson_marks_hold_for_demo_tenant()
    {
        const string deltasJson = """
            {
              "isDemoTenant": true,
              "proofPackageCompleteness": {
                "publishingTier": "pilot",
                "proofSendability": "review",
                "evidenceCompleteness": "partial",
                "sponsorProofReadiness": "hold"
              }
            }
            """;

        string json = PilotProofPacketGovernanceArtifacts.BuildGovernanceOutcomeSummaryJson(
            "run-gov",
            deltasJson,
            pilotStrictSatisfied: true);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.GetProperty("runId").GetString().Should().Be("run-gov");
        root.GetProperty("proofDisposition").GetString().Should().Be("HOLD");
        root.GetProperty("governanceBlockingDecision").GetString().Should().Be("review_required");
        root.GetProperty("publishingTier").GetString().Should().Be("pilot");
    }

    [Fact]
    public void PilotProofPacketGovernanceArtifacts_BuildScaleEnvelopeEvidenceJson_passes_when_commit_seconds_present()
    {
        const string deltasJson = """{"timeToCommittedManifestTotalSeconds": 42.5}""";

        string json = PilotProofPacketGovernanceArtifacts.BuildScaleEnvelopeEvidenceJson(
            "run-scale",
            deltasJson,
            "https://api.example/");

        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("disposition").GetString().Should().Be("PASS");
        doc.RootElement.GetProperty("timeToCommittedManifestSeconds").GetDouble().Should().Be(42.5);
    }

    [Fact]
    public void PilotProofPacketGovernanceArtifacts_BuildAuditEvidenceSummaryJson_warns_when_no_audit_rows()
    {
        string json = PilotProofPacketGovernanceArtifacts.BuildAuditEvidenceSummaryJson(
            "run-audit",
            ["evt-1"],
            """{"auditRowCount": 0, "auditRowCountTruncated": false}""");

        using JsonDocument doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("disposition").GetString().Should().Be("WARN");
        doc.RootElement.GetProperty("sampleAuditEventIdCount").GetInt32().Should().Be(1);
    }

    [Theory]
    [InlineData("""{"proofPackageCompleteness":{"agentOutputPilotStrictEvidenceSatisfied":false}}""", false)]
    [InlineData("""{"proofPackageCompleteness":{"agentOutputPilotStrictEvidenceSatisfied":true}}""", true)]
    [InlineData("""{"proofPackageCompleteness":{}}""", true)]
    [InlineData("""{}""", true)]
    public void PilotProofPacketRoiArtifacts_TryResolvePilotStrictSatisfied_reads_strict_flag(
        string deltasJson,
        bool expected)
    {
        PilotProofPacketRoiArtifacts.TryResolvePilotStrictSatisfied(deltasJson).Should().Be(expected);
    }

    [Fact]
    public void PilotProofPacketRoiArtifacts_TryParseRoiMetricSources_skips_incomplete_rows_and_parses_kinds()
    {
        const string deltasJson = """
            {
              "roiMetricSources": [
                { "metricKey": "hours", "label": "Hours saved", "value": "4", "sourceKind": "CustomerProvided", "citation": "tenant" },
                { "metricKey": "", "label": "Skip me" },
                { "metricKey": "bench", "label": "Benchmark", "value": "10", "sourceKind": "BenchmarkAssumption" }
              ]
            }
            """;

        IReadOnlyList<RoiMetricSourceRow> rows = PilotProofPacketRoiArtifacts.TryParseRoiMetricSources(deltasJson);

        rows.Should().HaveCount(2);
        rows[0].MetricKey.Should().Be("hours");
        rows[0].SourceKind.Should().Be(RoiMetricSourceKind.CustomerProvided);
        rows[1].SourceKind.Should().Be(RoiMetricSourceKind.BenchmarkAssumption);
    }

    [Fact]
    public void PilotPreflightProductionLikeConfigLintSteps_evaluates_blocking_findings_for_development_bypass()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ConnectionStrings:ArchLucid"] = "Server=.;Database=ArchLucid;Trusted_Connection=True;Encrypt=True;",
            ["AgentExecution:Mode"] = "Simulator",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();

        List<PilotPreflightStepResult> steps =
            PilotPreflightProductionLikeConfigLintSteps.Evaluate(configuration, simulateProduction: true).ToList();

        steps.Should().Contain(step =>
            step.Disposition == PilotPreflightDisposition.Block
            && step.Name.StartsWith("config-lint:", StringComparison.Ordinal));
    }

    [Fact]
    public void ItsmPullForwardEvidenceParser_ResolveLedgerDirectory_uses_default_under_repository_root()
    {
        string repositoryRoot = Path.Combine(Path.GetTempPath(), "archlucid-itsm-" + Guid.NewGuid().ToString("N"));
        ItsmPullForwardOptions options = new();

        try
        {
            string resolved = ItsmPullForwardEvidenceParser.ResolveLedgerDirectory(repositoryRoot, options.LedgerDirectory);

            resolved.Should().Be(
                Path.Combine(repositoryRoot, "artifacts", "validation", "paid-pilot-ledgers"));
        }
        finally
        {
            try
            {
                if (Directory.Exists(repositoryRoot))
                    Directory.Delete(repositoryRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort cleanup for temp probe directory.
            }
        }
    }

    [Fact]
    public void ItsmPullForwardEvidenceParser_CountLedgerFiles_returns_zero_for_missing_directory()
    {
        string repositoryRoot = Path.Combine(Path.GetTempPath(), "archlucid-itsm-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(repositoryRoot);

        try
        {
            ItsmPullForwardEvidenceParser.CountLedgerFiles(repositoryRoot, new ItsmPullForwardOptions())
                .Should()
                .Be(0);
        }
        finally
        {
            try
            {
                Directory.Delete(repositoryRoot, recursive: true);
            }
            catch (IOException)
            {
                // Best-effort cleanup for temp probe directory.
            }
        }
    }

    [Fact]
    public void PilotProofPacketDataConsistencyArtifacts_BuildSummaryMarkdown_includes_hold_reasons()
    {
        const string deltas = """
            {
              "proofPackageCompleteness": {
                "runInCommittedStatus": false,
                "committedManifestPresent": false
              }
            }
            """;

        string markdown = PilotProofPacketDataConsistencyArtifacts.BuildSummaryMarkdown("run-md", deltas);

        markdown.Should().Contain("# Data consistency summary");
        markdown.Should().Contain("**Disposition:** **HOLD**");
        markdown.Should().Contain("Hold reasons");
    }

    private static AdminAuthConfigurationDiagnosticsResponse CreateJwtLikeDiagnostics(
        string authMode = "JwtBearer",
        bool audienceConfigured = true,
        bool issuerOrAuthorityConfigured = true,
        bool? openIdDiscoverySucceeded = true,
        bool? jwksConfigured = true,
        bool saml2Enabled = false,
        bool? spEntityIdConfigured = true,
        bool? samlRoleClaimSourcesConfigured = true,
        bool? tenantClaimMappingConfigured = true)
    {
        return new AdminAuthConfigurationDiagnosticsResponse
        {
            AuthMode = authMode,
            AudienceConfigured = audienceConfigured,
            IssuerOrAuthorityConfigured = issuerOrAuthorityConfigured,
            OpenIdDiscoverySucceeded = openIdDiscoverySucceeded,
            JwksConfigured = jwksConfigured,
            Saml2Enabled = saml2Enabled,
            SpEntityIdConfigured = spEntityIdConfigured,
            SamlRoleClaimSourcesConfigured = samlRoleClaimSourcesConfigured,
            TenantClaimMappingConfigured = tenantClaimMappingConfigured,
        };
    }
}
