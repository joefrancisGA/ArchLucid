using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackAttributionSignalCalculatorTests
{
  private static PolicyPackContentDocument SamplePack()
  {
    return new()
    {
      ComplianceRuleKeys = ["phi.minimization.intake"],
      ComplianceRuleIds = [Guid.Parse("22222222-2222-2222-2222-222222222222")],
      Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
      {
        ["pack.curatedRules.v1"] = "{\"rules\":[{\"id\":\"curated-rule-1\"}]}",
      },
    };
  }

  [Fact]
  public void Calculate_empty_snapshot_returns_zero_percent()
  {
    FindingsSnapshot snapshot = new()
    {
      Findings = [],
    };

    PolicyPackAttributionSignal signal = PolicyPackAttributionSignalCalculator.Calculate(snapshot, SamplePack());

    signal.TotalFindingCount.Should().Be(0);
    signal.AttributableFindingCount.Should().Be(0);
    signal.AttributionPercentage.Should().Be(0.0);
    signal.ByEngine.Should().BeEmpty();
  }

  [Fact]
  public void IsAttributable_matches_policy_rule_id_case_insensitively()
  {
    HashSet<string> packRuleIds = new(StringComparer.OrdinalIgnoreCase) { "phi.minimization.intake" };
    Finding finding = new()
    {
      FindingType = "fixture",
      Category = "fixture",
      EngineType = "compliance",
      Title = "t",
      Rationale = "r",
      PolicyRuleId = " PHI.Minimization.Intake ",
    };

    PolicyPackAttributionSignalCalculator.IsAttributable(finding, packRuleIds).Should().BeTrue();
  }

  [Fact]
  public void Calculate_all_pack_attributable_findings_returns_one_hundred_percent()
  {
    PolicyPackContentDocument pack = SamplePack();
    FindingsSnapshot snapshot = new()
    {
      Findings =
      [
        new Finding
        {
          FindingType = "fixture",
          Category = "fixture",
          EngineType = "compliance",
          Title = "t",
          Rationale = "r",
          PolicyRuleId = "phi.minimization.intake",
        },
        new Finding
        {
          FindingType = "fixture",
          Category = "fixture",
          EngineType = "compliance",
          Title = "t",
          Rationale = "r",
          PolicyRuleId = "22222222-2222-2222-2222-222222222222",
        },
        new Finding
        {
          FindingType = "fixture",
          Category = "fixture",
          EngineType = "compliance",
          Title = "t",
          Rationale = "r",
          Trace = new ExplainabilityTrace { RulesApplied = ["curated-rule-1"] },
        },
      ],
    };

    PolicyPackAttributionSignal signal = PolicyPackAttributionSignalCalculator.Calculate(snapshot, pack);

    signal.TotalFindingCount.Should().Be(3);
    signal.AttributableFindingCount.Should().Be(3);
    signal.AttributionPercentage.Should().Be(100.0);
    signal.ByEngine.Should().ContainSingle();
    signal.ByEngine[0].EngineType.Should().Be("compliance");
    signal.ByEngine[0].AttributionPercentage.Should().Be(100.0);
  }

  [Fact]
  public void Calculate_engine_only_findings_returns_zero_percent()
  {
    PolicyPackContentDocument pack = SamplePack();
    FindingsSnapshot snapshot = new()
    {
      Findings =
      [
        new Finding
        {
          FindingType = "fixture",
          Category = "fixture",
          EngineType = "topology",
          Title = "t",
          Rationale = "r",
          Trace = new ExplainabilityTrace { RulesApplied = ["topology-coverage-presence"] },
        },
        new Finding
        {
          FindingType = "fixture",
          Category = "fixture",
          EngineType = "security",
          Title = "t",
          Rationale = "r",
          Trace = new ExplainabilityTrace { RulesApplied = ["security-coverage-protection"] },
        },
      ],
    };

    PolicyPackAttributionSignal signal = PolicyPackAttributionSignalCalculator.Calculate(snapshot, pack);

    signal.AttributionPercentage.Should().Be(0.0);
    signal.ByEngine.Should().HaveCount(2);
  }

  [Fact]
  public void Calculate_mixed_snapshot_returns_fifty_percent()
  {
    PolicyPackContentDocument pack = new()
    {
      ComplianceRuleKeys = ["phi.minimization.intake"],
      ComplianceRuleIds = [Guid.Parse("11111111-1111-1111-1111-111111111111")],
      Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
      {
        ["pack.curatedRules.v1"] = "{\"rules\":[{\"id\":\"curated-rule-1\"}]}",
      },
    };

    FindingsSnapshot snapshot = new()
    {
      Findings =
      [
        new Finding
        {
          FindingType = "fixture",
          Category = "fixture",
          EngineType = "compliance",
          Title = "t",
          Rationale = "r",
          PolicyRuleId = "phi.minimization.intake",
        },
        new Finding
        {
          FindingType = "fixture",
          Category = "fixture",
          EngineType = "topology",
          Title = "t",
          Rationale = "r",
          Trace = new ExplainabilityTrace { RulesApplied = ["topology-coverage-presence"] },
        },
      ],
    };

    PolicyPackAttributionSignal signal = PolicyPackAttributionSignalCalculator.Calculate(snapshot, pack);

    signal.AttributionPercentage.Should().Be(50.0);
    signal.ByEngine.Should().HaveCount(2);
    signal.ByEngine.Single(x => x.EngineType == "compliance").AttributionPercentage.Should().Be(100.0);
    signal.ByEngine.Single(x => x.EngineType == "topology").AttributionPercentage.Should().Be(0.0);
  }
}