using ArchLucid.Decisioning.Findings;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackAttributionSignalCalculatorPropertyTests
{
  [Property(MaxTest = 120)]
  public Property Calculate_attribution_percentage_is_between_zero_and_one_hundred()
  {
    return Prop.ForAll(FindingsSnapshotArb(), snapshot =>
    {
      PolicyPackContentDocument pack = new()
      {
        ComplianceRuleKeys = ["pack.rule"],
      };

      PolicyPackAttributionSignal signal = PolicyPackAttributionSignalCalculator.Calculate(snapshot, pack);

      return signal.AttributionPercentage is >= 0.0 and <= 100.0
             && signal.AttributableFindingCount <= signal.TotalFindingCount
             && signal.TotalFindingCount == snapshot.Findings.Count;
    });
  }

  [Fact]
  public void Calculate_empty_snapshot_always_zero_percent()
  {
    PolicyPackContentDocument pack = new()
    {
      ComplianceRuleKeys = ["pack.rule"],
    };

    FindingsSnapshot snapshot = new()
    {
      Findings = [],
    };

    PolicyPackAttributionSignal signal = PolicyPackAttributionSignalCalculator.Calculate(snapshot, pack);

    signal.TotalFindingCount.Should().Be(0);
    signal.AttributableFindingCount.Should().Be(0);
    signal.AttributionPercentage.Should().Be(0.0);
    signal.ByEngine.Should().BeEmpty();
  }

  private static Arbitrary<FindingsSnapshot> FindingsSnapshotArb()
  {
    return Arb.From(
      Gen.Choose(0, 12).SelectMany(count =>
        from findings in Gen.ListOf(count, FindingArb().Generator)
        select new FindingsSnapshot { Findings = findings.ToList() }));
  }

  private static Arbitrary<Finding> FindingArb()
  {
    return Arb.From(
      from engine in Arb.Default.NonEmptyString().Generator
      from policyRuleId in Arb.Default.String().Generator
      from rules in Arb.Default.Array<string>().Generator
      select new Finding
      {
        FindingType = "fixture",
        Category = "fixture",
        EngineType = engine.Get,
        Title = "title",
        Rationale = "rationale",
        PolicyRuleId = string.IsNullOrWhiteSpace(policyRuleId) ? null : policyRuleId,
        Trace = new ExplainabilityTrace { RulesApplied = rules.ToList() },
      });
  }
}