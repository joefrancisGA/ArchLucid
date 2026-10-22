using ArchLucid.Cli.Support;
using ArchLucid.Core.Support;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch5Tests
{
    [Fact]
    public void SupportBundleFinalManifestBuilder_attaches_inventory_and_redaction_rules()
    {
        SupportBundleManifest baseline = new()
        {
            CreatedUtc = "2026-07-20T00:00:00Z",
            CliWorkingDirectory = "/tmp",
        };

        SupportBundleManifest withPass = SupportBundleFinalManifestBuilder.WithInventory(
            baseline,
            redactionPassAppliedToSerializedSections: true);
        SupportBundleManifest withoutPass = SupportBundleFinalManifestBuilder.WithInventory(
            baseline,
            redactionPassAppliedToSerializedSections: false);

        withPass.IncludedFilesLexOrder.Should().BeEquivalentTo(
            SupportBundleFinalManifestBuilder.LexOrderedSectionFileNames(),
            options => options.WithStrictOrdering());
        withPass.RedactionPassAppliedToSerializedSections.Should().BeTrue();
        withPass.RedactionRulesApplied.Should().Equal(SupportBundleRedactor.TextPatternRedactionRules);
        withoutPass.RedactionPassAppliedToSerializedSections.Should().BeFalse();
        withoutPass.RedactionRulesApplied.Should().BeEmpty();

        Action nullBaseline = () => SupportBundleFinalManifestBuilder.WithInventory(null!, true);
        nullBaseline.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void SupportBundleTriageIndexBuilder_ToMarkdown_includes_run_health_and_notes()
    {
        SupportBundleTriageIndexDocument index = new()
        {
            GeneratedUtc = "2026-07-20T12:00:00Z",
            ApiBaseUrlRedacted = "https://api.example",
            ConfigModeSummary = "DevelopmentBypass",
            HostVersionSummary = "1.0.0",
            RedactionManifestStatus = "PASS",
            StructuralExecutionModeLabel = "Simulator",
            LatestFailedGateHint = "quality-gate",
            Scope = new SupportBundleTriageScopeSection
            {
                TenantId = "t1",
                WorkspaceId = "w1",
                ProjectId = "p1",
            },
            Health = new SupportBundleTriageHealthSection
            {
                LiveHttpStatus = 200,
                ReadyHttpStatus = 200,
                CombinedHttpStatus = 200,
            },
            Run = new SupportBundleTriageRunSection
            {
                RunId = "run-1",
                RequestId = "req-1",
                Status = "Committed",
                ManifestVersion = "v1",
                OtelTraceId = "trace-1",
            },
            RecentAuditEventIds = ["audit-1"],
            ArtifactIds = ["art-1"],
            Notes = ["note-a"],
        };

        string markdown = SupportBundleTriageIndexBuilder.ToMarkdown(index);

        markdown.Should().Contain("# Support bundle triage index");
        markdown.Should().Contain("runId: run-1");
        markdown.Should().Contain("Latest failed gate hint: quality-gate");
        markdown.Should().Contain("audit-1");
        markdown.Should().Contain("note-a");

        Action nullIndex = () => SupportBundleTriageIndexBuilder.ToMarkdown(null!);
        nullIndex.Should().Throw<ArgumentNullException>();
    }
}
