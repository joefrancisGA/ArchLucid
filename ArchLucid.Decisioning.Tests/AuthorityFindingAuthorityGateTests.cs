using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

public sealed class AuthorityFindingAuthorityGateTests
{
  [Fact]
  public void MergeAdditionalFindings_skips_hypothesis_lane_findings()
  {
    FindingsSnapshot snapshot = new()
    {
      FindingsSnapshotId = Guid.NewGuid(),
      Findings = [],
    };

    Finding hypothesis = new()
    {
      FindingId = "hypothesis-1",
      FindingType = "ArchitectureIntelligence.AdversarialChallenge",
      PolicyRuleId = "architecture-intelligence.adversarial.hypothesis",
    };

    Finding substantive = new()
    {
      FindingId = "substantive-1",
      FindingType = "ArchitectureIntelligence.SpecialistReview",
    };

    FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
        snapshot,
        [hypothesis, substantive],
        TimeProvider.System);

    snapshot.Findings.Should().ContainSingle(finding => finding.FindingId == "substantive-1");
  }
}
