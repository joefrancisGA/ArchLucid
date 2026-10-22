using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Application")]
public sealed class OpenCommitmentClassifierTests
{
  private static readonly DateTimeOffset Now = new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);

  [Fact]
  public void Classify_overdue_deferral_when_revisit_passed()
  {
    FindingReviewEventRecord eventRecord = new()
    {
      FindingId = "f-defer",
      Disposition = FindingDisposition.Deferred,
      RevisitDueUtc = Now.AddDays(-3),
      OccurredAtUtc = Now.AddDays(-10),
    };

    IReadOnlyList<OpenCommitmentSignal> signals = OpenCommitmentClassifier.Classify(
      [eventRecord],
      [],
      new Dictionary<string, DateTimeOffset?>(),
      Now,
      30);

    OpenCommitmentSignal signal = signals.Single(s => s.Kind == OpenCommitmentSignalKind.OverdueDeferral);
    signal.SourceFindingId.Should().Be("f-defer");
    signal.DaysOverdueOrUntilExpiry.Should().Be(3);
  }

  [Fact]
  public void Classify_unanswered_evidence_when_latest_disposition_needs_evidence()
  {
    FindingReviewEventRecord eventRecord = new()
    {
      FindingId = "f-evidence",
      Disposition = FindingDisposition.NeedsEvidence,
      OccurredAtUtc = Now.AddDays(-5),
    };

    IReadOnlyList<OpenCommitmentSignal> signals = OpenCommitmentClassifier.Classify(
      [eventRecord],
      [],
      new Dictionary<string, DateTimeOffset?>(),
      Now,
      30);

    signals.Single(s => s.Kind == OpenCommitmentSignalKind.UnansweredEvidenceRequest).SourceFindingId
      .Should().Be("f-evidence");
  }

  [Fact]
  public void Classify_expired_and_expiring_waivers()
  {
    RiskExceptionRecord expired = new()
    {
      FindingId = "f-waiver-expired",
      ExpiresAtUtc = Now.AddDays(-1),
      Status = RiskExceptionStatus.Active,
    };

    RiskExceptionRecord expiring = new()
    {
      FindingId = "f-waiver-soon",
      ExpiresAtUtc = Now.AddDays(10),
      Status = RiskExceptionStatus.Active,
    };

    IReadOnlyList<OpenCommitmentSignal> signals = OpenCommitmentClassifier.Classify(
      [],
      [expired, expiring],
      new Dictionary<string, DateTimeOffset?>(),
      Now,
      30);

    signals.Should().Contain(s => s.Kind == OpenCommitmentSignalKind.ExpiredWaiver);
    signals.Should().Contain(s => s.Kind == OpenCommitmentSignalKind.ExpiringWaiver);
  }

  [Fact]
  public void Classify_overdue_remediation_suppressed_when_remediated()
  {
    FindingReviewEventRecord remediated = new()
    {
      FindingId = "f-remed",
      Disposition = FindingDisposition.Remediated,
      OccurredAtUtc = Now.AddDays(-1),
    };

    Dictionary<string, DateTimeOffset?> remediationDue = new()
    {
      ["f-remed"] = Now.AddDays(-2),
    };

    IReadOnlyList<OpenCommitmentSignal> signals = OpenCommitmentClassifier.Classify(
      [remediated],
      [],
      remediationDue,
      Now,
      30);

    signals.Should().NotContain(s => s.Kind == OpenCommitmentSignalKind.OverdueRemediation);
  }

  [Fact]
  public void Classify_latest_disposition_wins_for_conflicting_events()
  {
    FindingReviewEventRecord older = new()
    {
      FindingId = "f1",
      Disposition = FindingDisposition.Deferred,
      RevisitDueUtc = Now.AddDays(-1),
      OccurredAtUtc = Now.AddDays(-20),
    };

    FindingReviewEventRecord newer = new()
    {
      FindingId = "f1",
      Disposition = FindingDisposition.Accepted,
      OccurredAtUtc = Now.AddDays(-1),
    };

    IReadOnlyList<OpenCommitmentSignal> signals = OpenCommitmentClassifier.Classify(
      [older, newer],
      [],
      new Dictionary<string, DateTimeOffset?>(),
      Now,
      30);

    signals.Should().NotContain(s => s.Kind == OpenCommitmentSignalKind.OverdueDeferral);
  }
}
