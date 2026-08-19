using System.Text;
using System.Text.Json.Nodes;

using ArchLucid.Cli.Commands;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch6Tests
{
    [Fact]
    public void ComplianceReportConfigurationSnapshotFormatter_builds_redacted_table()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ASPNETCORE_ENVIRONMENT"] = "Development",
                    ["ArchLucid:StorageProvider"] = "Sql",
                    ["ArchLucidAuth:Mode"] = "ApiKey",
                    ["AgentExecution:Mode"] = "Simulator",
                    ["ConnectionStrings:ArchLucid"] = "Server=.;Database=x;",
                    ["Authentication:ApiKey:Enabled"] = "true",
                })
            .Build();

        string markdown = ComplianceReportConfigurationSnapshotFormatter.Build(
            configuration,
            contentRoot: "C:\\repo|root",
            appsettingsExists: true);

        markdown.Should().Contain("| Key | Value |");
        markdown.Should().Contain("Development");
        markdown.Should().Contain("(present — redacted)");
        markdown.Should().Contain("C:\\repo\\|root");
        markdown.Should().Contain("`appsettings.json` present");
        markdown.Should().Contain("yes");

        string absent = ComplianceReportConfigurationSnapshotFormatter.Build(
            new ConfigurationBuilder().Build(),
            "root",
            appsettingsExists: false);
        absent.Should().Contain("(not set)");
        absent.Should().Contain("no");
    }

    [Fact]
    public void ComplianceReportValidateConfigSummaryFormatter_counts_and_lists_followups()
    {
        List<ValidateConfigFinding> findings =
        [
            new(ValidateConfigFindingSeverity.Error, "Auth", "Mode", "bad"),
            new(ValidateConfigFindingSeverity.Warning, "Storage", "Provider", "warn"),
            new(ValidateConfigFindingSeverity.Ok, "Agents", "Mode", "ok"),
            new(ValidateConfigFindingSeverity.Info, "Env", "Host", "info"),
        ];

        string withIssues = ComplianceReportValidateConfigSummaryFormatter.Build(findings);
        withIssues.Should().Contain("| Error | 1 |");
        withIssues.Should().Contain("| Warning | 1 |");
        withIssues.Should().Contain("**Error**");
        withIssues.Should().Contain("**Warning**");
        withIssues.Should().NotContain("*(no errors or warnings)*");

        string clean = ComplianceReportValidateConfigSummaryFormatter.Build(
        [
            new(ValidateConfigFindingSeverity.Ok, "A", "B", "C"),
        ]);
        clean.Should().Contain("*(no errors or warnings)*");
    }

    [Fact]
    public void CitationIntegrityOptions_and_ship_gate_option_family_parse_args()
    {
        CitationIntegrityOptions citation = CitationIntegrityOptions.Parse(
        [
            "--fixtures-dir", "fx",
            "--manifest", "m.json",
            "--rules", "r.json",
            "--json-out", "out.json",
            "--markdown-out", "out.md",
            "--include-api",
            "--sample-size", "3",
            "--fail-threshold", "2",
            "--no-write-artifacts",
        ]);
        citation.FixturesDirectory.Should().Be("fx");
        citation.IncludeApi.Should().BeTrue();
        citation.SampleSize.Should().Be(3);
        citation.FailThreshold.Should().Be(2);
        citation.SuppressDefaultArtifacts.Should().BeTrue();

        Action badInt = () => CitationIntegrityOptions.Parse(["--sample-size", "0"]);
        badInt.Should().Throw<ArgumentException>();

        PilotReadinessBundleOptions pilot = PilotReadinessBundleOptions.Parse(
        [
            "--run-id", "r1",
            "--json-out", "j.json",
            "--markdown-out", "m.md",
            "--ui-base-url", "https://ui",
            "--include-api",
            "--no-write-artifacts",
        ]);
        pilot.RunId.Should().Be("r1");
        pilot.IncludeApi.Should().BeTrue();

        BuyerProofEvidenceLedgerOptions buyer = BuyerProofEvidenceLedgerOptions.Parse(
        [
            "--proof-dir", "p",
            "--rules", "rules.json",
            "--json-out", "j.json",
            "--markdown-out", "m.md",
            "--no-write-artifacts",
        ]);
        buyer.ProofDirectory.Should().Be("p");

        ItsmPullForwardOptions itsm = ItsmPullForwardOptions.Parse(
        [
            "--ledger-dir", "l",
            "--evidence", "e.md",
            "--json-out", "j.json",
            "--markdown-out", "m.md",
            "--include-api",
            "--no-write-artifacts",
        ]);
        itsm.LedgerDirectory.Should().Be("l");
        itsm.IncludeApi.Should().BeTrue();

        FrontierAiBaselineOptions frontier = FrontierAiBaselineOptions.Parse(
        [
            "--scoreboard", "s.json",
            "--json-out", "j.json",
            "--markdown-out", "m.md",
            "--init-scoreboard",
            "--no-write-artifacts",
        ]);
        frontier.InitScoreboard.Should().BeTrue();

        DecisionOwnerScoreboardOptions decision = DecisionOwnerScoreboardOptions.Parse(
        [
            "--ledger-dir", "l",
            "--rules", "r.json",
            "--json-out", "j.json",
            "--markdown-out", "m.md",
            "--sponsor-markdown-out", "s.md",
            "--no-write-artifacts",
        ]);
        decision.SponsorMarkdownOutPath.Should().Be("s.md");

        ReturnTriggerTelemetryOptions ret = ReturnTriggerTelemetryOptions.Parse(
        [
            "--ledger-dir", "l",
            "--rules", "r.json",
            "--json-out", "j.json",
            "--markdown-out", "m.md",
            "--no-write-artifacts",
        ]);
        ret.LedgerDirectory.Should().Be("l");

        TenantIsolationNegativeTestOptions tenant = TenantIsolationNegativeTestOptions.Parse(
        [
            "--run-id", "r1",
            "--alternate-tenant-id", "t2",
            "--alternate-workspace-id", "w2",
            "--alternate-project-id", "p2",
            "--manifest", "m.json",
            "--json-out", "j.json",
            "--markdown-out", "m.md",
            "--no-write-artifacts",
        ]);
        tenant.AlternateTenantId.Should().Be("t2");
        tenant.SuppressDefaultArtifacts.Should().BeTrue();
    }

    [Fact]
    public void SecurityTrustPublishCommandOptions_covers_parse_edges()
    {
        SecurityTrustPublishCommandOptions? empty =
            SecurityTrustPublishCommandOptions.Parse([], out string? emptyError);
        empty.Should().BeNull();
        emptyError.Should().Contain("Missing arguments");

        SecurityTrustPublishCommandOptions? missingKindValue =
            SecurityTrustPublishCommandOptions.Parse(["--kind"], out string? kindError);
        missingKindValue.Should().BeNull();
        kindError.Should().Contain("--kind");

        SecurityTrustPublishCommandOptions? unknown =
            SecurityTrustPublishCommandOptions.Parse(["--nope"], out string? unknownError);
        unknown.Should().BeNull();
        unknownError.Should().Contain("Unknown argument");

        SecurityTrustPublishCommandOptions? badDate =
            SecurityTrustPublishCommandOptions.Parse(
                ["--date", "not-a-date", "--summary-url", "https://x"],
                out string? dateError);
        badDate.Should().BeNull();
        dateError.Should().Contain("calendar date");

        SecurityTrustPublishCommandOptions? missingSummary =
            SecurityTrustPublishCommandOptions.Parse(["--date", "2026-07-01"], out string? summaryError);
        missingSummary.Should().BeNull();
        summaryError.Should().Contain("--summary-url");

        SecurityTrustPublishCommandOptions? ok = SecurityTrustPublishCommandOptions.Parse(
            [
                "--kind", "pen-test",
                "--date", "2026-07-01",
                "--summary-url", "https://summary",
                "--assessor", "A",
                "--assessment-code", "C1",
                "--ui-base-url", "https://ui",
            ],
            out string? okError);
        ok.Should().NotBeNull();
        okError.Should().BeNull();
        ok!.AssessorDisplayName.Should().Be("A");
        ok.AssessmentCode.Should().Be("C1");
        ok.UiBaseUrl.Should().Be("https://ui");
    }

    [Fact]
    public void DeploymentEvidenceOptions_covers_parse_and_sanitize_edges()
    {
        DeploymentEvidenceOptions? missingEnv =
            DeploymentEvidenceOptions.Parse(["--api-base-url", "https://api"], out string? envError);
        missingEnv.Should().BeNull();
        envError.Should().Contain("--environment");

        DeploymentEvidenceOptions? missingApi =
            DeploymentEvidenceOptions.Parse(["--environment", "staging"], out string? apiError);
        missingApi.Should().BeNull();
        apiError.Should().Contain("--api-base-url");

        DeploymentEvidenceOptions? missingValue =
            DeploymentEvidenceOptions.Parse(["--environment"], out string? valueError);
        missingValue.Should().BeNull();
        valueError.Should().Contain("Missing value for --environment");

        DeploymentEvidenceOptions? unexpected =
            DeploymentEvidenceOptions.Parse(
                ["--environment", "staging", "--api-base-url", "https://api/", "--nope"],
                out string? unexpectedError);
        unexpected.Should().BeNull();
        unexpectedError.Should().Contain("Unexpected argument");

        DeploymentEvidenceOptions? ok = DeploymentEvidenceOptions.Parse(
            [
                "--environment", "Staging!!",
                "--api-base-url", "https://api.example/",
                "--out", " custom.md ",
                "--repo", " C:\\repo ",
                "--synthetic-path", "",
                "--allow-missing-openapi",
            ],
            out string? okError);
        ok.Should().NotBeNull();
        okError.Should().BeNull();
        ok!.ApiBaseUrl.Should().Be("https://api.example");
        ok.OutPath.Should().Be("custom.md");
        ok.RepoRoot.Should().Be("C:\\repo");
        ok.SyntheticPath.Should().Be("/version");
        ok.AllowMissingOpenApi.Should().BeTrue();
        DeploymentEvidenceOptions.SanitizeEnvironmentToken("@@@").Should().Be("env");
        ok.ResolveDefaultOutPath().Should().Contain("deployment-evidence-");
    }

    [Fact]
    public void ArtifactOutputPathHelper_and_jwt_claims_reader_cover_edges()
    {
        ArtifactOutputPathHelper.GetTrailingPathSegment("a/b/c.md").Should().Be("c.md");
        ArtifactOutputPathHelper.GetTrailingPathSegment("a\\b\\c.md\\").Should().Be("c.md");
        ArtifactOutputPathHelper.GetFileNameWithoutExtensionFromPath("a\\b\\report.md").Should().Be("report");

        Action blank = () => ArtifactOutputPathHelper.GetTrailingPathSegment(" ");
        blank.Should().Throw<ArgumentException>();

        string payloadJson = """{"oid":"abc","tid":"tenant"}""";
        string payload = Convert.ToBase64String(Encoding.UTF8.GetBytes(payloadJson))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        string jwt = $"hdr.{payload}.sig";

        bool ok = AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject(jwt, out JsonObject? claims);
        ok.Should().BeTrue();
        claims!["oid"]!.GetValue<string>().Should().Be("abc");

        AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject(" ", out _).Should().BeFalse();
        AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject("a.b", out _).Should().BeFalse();
        AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject("a..c", out _).Should().BeFalse();
        AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject("a.%%% .c", out _).Should().BeFalse();
    }

    [Fact]
    public void ComplianceReportMarkdownComposer_covers_live_audit_branches()
    {
        string notAttempted = ComplianceReportMarkdownComposer.Compose(
            "# Template",
            "C:\\repo",
            "2026-07-01T00:00:00Z",
            "machine",
            "cwd",
            "| k | v |",
            "| Error | 0 |",
            liveAudit: null,
            liveAuditAttempted: false);
        notAttempted.Should().Contain("Not requested");

        string nullSample = ComplianceReportMarkdownComposer.Compose(
            "# Template",
            "C:\\repo",
            "2026-07-01T00:00:00Z",
            "machine",
            "cwd",
            "| k | v |",
            "| Error | 0 |",
            liveAudit: null,
            liveAuditAttempted: true);
        nullSample.Should().Contain("did not run");

        string unreachable = ComplianceReportMarkdownComposer.Compose(
            "# Template",
            "C:\\repo",
            "2026-07-01T00:00:00Z",
            "machine",
            "cwd",
            "| k | v |",
            "| Error | 0 |",
            new ComplianceReportAuditLiveSample(false, "boom`pipe|", 0, new Dictionary<string, int>(), null, null),
            liveAuditAttempted: true);
        unreachable.Should().Contain("Live audit unavailable");
        unreachable.Should().Contain("boom'pipe|");

        string emptyPage = ComplianceReportMarkdownComposer.Compose(
            "# Template",
            "C:\\repo",
            "2026-07-01T00:00:00Z",
            "machine",
            "cwd",
            "| k | v |",
            "| Error | 0 |",
            new ComplianceReportAuditLiveSample(true, null, 0, new Dictionary<string, int>(), null, null),
            liveAuditAttempted: true);
        emptyPage.Should().Contain("no audit rows");

        string withEvents = ComplianceReportMarkdownComposer.Compose(
            "# Template",
            "C:\\repo",
            "2026-07-01T00:00:00Z",
            "machine",
            "cwd",
            "| k | v |",
            "| Error | 0 |",
            new ComplianceReportAuditLiveSample(
                true,
                null,
                2,
                new Dictionary<string, int> { ["RunStarted"] = 2, ["A|B"] = 1 },
                new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 7, 1, 1, 0, 0, DateTimeKind.Utc)),
            liveAuditAttempted: true);
        withEvents.Should().Contain("Sample window");
        withEvents.Should().Contain("RunStarted");
        withEvents.Should().Contain("A\\|B");
    }
}
