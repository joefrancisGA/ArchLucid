using ArchLucid.Application.Architecture;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Support;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch11Tests
{
    [Fact]
    public void QuickScanExecutionResult_success_factory_sets_body()
    {
        ArchitectureQuickScanResponse body = new()
        {
            ScanId = "scan-1",
            SystemName = "Core",
            PrimaryEnvironment = "prod",
            Summary = "ok",
            DemonstrationDisclaimer = "sample",
            CompletedUtc = DateTime.UtcNow,
        };

        QuickScanExecutionResult result = QuickScanExecutionResult.Success(body);

        result.Succeeded.Should().BeTrue();
        result.SuccessBody.Should().BeSameAs(body);
        result.FailureKind.Should().BeNull();
    }

    [Fact]
    public void QuickScanExecutionResult_guard_rejected_sets_reason()
    {
        QuickScanExecutionResult result =
            QuickScanExecutionResult.GuardRejected(QuickScanGuardRejectionReason.SignInRequired);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.GuardRejected);
        result.GuardRejectionReason.Should().Be(QuickScanGuardRejectionReason.SignInRequired);
    }

    [Fact]
    public void QuickScanGuardDecision_permit_and_reject()
    {
        QuickScanGuardDecision permit = QuickScanGuardDecision.Permit();
        QuickScanGuardDecision reject = QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.SignInRequired);

        permit.Allowed.Should().BeTrue();
        reject.Allowed.Should().BeFalse();
        reject.RejectionReason.Should().Be(QuickScanGuardRejectionReason.SignInRequired);
    }

    [Fact]
    public void SupportProblemReportCopy_formats_acknowledgement_with_reference()
    {
        string message = SupportProblemReportCopy.FormatAcknowledgement("  REF-42  ");

        message.Should().Contain("REF-42");
        message.Should().Contain(SupportProblemReportCopy.SlaMessage);
    }

    [Fact]
    public void ValueReportSnapshotMarkdownFormatter_emits_headline_metrics()
    {
        ValueReportSnapshot snapshot = new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            DateTimeOffset.Parse("2026-04-01T00:00:00Z"),
            DateTimeOffset.Parse("2026-05-01T00:00:00Z"),
            [],
            3,
            2,
            1,
            0,
            10m,
            2m,
            1m,
            13m,
            4.5m,
            "Per-run estimate from ValueReportComputationOptions — not invoice truth.",
            12000m,
            900m,
            25000m,
            -13900m,
            -55.6m,
            null,
            null,
            null,
            null,
            0,
            ReviewCycleBaselineProvenance.DefaultedFromRoiModelOptions,
            null,
            null,
            0,
            0,
            null,
            null);

        ValueReportSnapshotMarkdownFormatter formatter = new(new ExportFormatterService());
        string markdown = formatter.Format(snapshot);

        markdown.Should().Contain("# Value report snapshot");
        markdown.Should().Contain("Runs completed");
        markdown.Should().Contain("ROI vs baseline");
    }
}
