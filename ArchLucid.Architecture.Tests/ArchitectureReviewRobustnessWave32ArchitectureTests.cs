using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-32 architecture create/review robustness suggestion 378 emitter call sites.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave32ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion378_compliance_drift_escalation_scanner_publisher_job_wiring()
    {
        string scanner = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "ComplianceDriftEscalationScanner.cs"));
        string publishing = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "ComplianceDriftIntegrationEventPublishing.cs"));
        string hosted = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Hosted",
                "ComplianceDriftEscalationHostedService.cs"));
        string job = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Core",
                "Jobs",
                "ComplianceDriftEscalationArchLucidJob.cs"));
        string composition = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "Modules",
                "ComplianceDriftEscalationCompositionModule.cs"));

        scanner.Should().Contain("ComplianceDriftIntegrationEventPublishing.TryPublishEscalatedAsync");
        scanner.Should().Contain("ComplianceDriftEscalationMetricKeys");
        publishing.Should().Contain("TryResolveVerifiedManifestHashOrNullAsync");
        publishing.Should().Contain("idempotencyKey");
        hosted.Should().Contain("ComplianceDriftEscalationScanner");
        job.Should().Contain("ComplianceDriftEscalationScanner");
        composition.Should().Contain("ComplianceDriftEscalationHostedService");
        composition.Should().Contain("ArchLucidJobNames.ComplianceDriftEscalation");
    }

    [Fact]
    public void Suggestion378_compliance_drift_escalation_leader_lease_and_job_slug()
    {
        string leaseNames = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Hosted", "HostElectionLeaseNames.cs"));
        string jobNames = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Jobs", "ArchLucidJobNames.cs"));

        leaseNames.Should().Contain("ComplianceDriftEscalationPolling");
        jobNames.Should().Contain("ComplianceDriftEscalation");
    }
}
