namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Parsed expectation extras from merged effective governance <c>advisoryDefaults</c>.
/// </summary>
public sealed class PolicyPackExpectationFacet
{
  public static PolicyPackExpectationFacet Empty { get; } =
      new([], [], [], null, null);

  public PolicyPackExpectationFacet(
      IReadOnlyList<string> extraTopologyCategories,
      IReadOnlyList<string> extraSecurityControlFamilies,
      IReadOnlyList<string> extraRequirementThemes,
      bool? requireBudgetCap,
      string? breachSeverity)
  {
    ExtraTopologyCategories = extraTopologyCategories ?? throw new ArgumentNullException(nameof(extraTopologyCategories));
    ExtraSecurityControlFamilies =
        extraSecurityControlFamilies ?? throw new ArgumentNullException(nameof(extraSecurityControlFamilies));
    ExtraRequirementThemes = extraRequirementThemes ?? throw new ArgumentNullException(nameof(extraRequirementThemes));
    RequireBudgetCap = requireBudgetCap;
    BreachSeverity = breachSeverity;
  }

  public IReadOnlyList<string> ExtraTopologyCategories { get; }

  public IReadOnlyList<string> ExtraSecurityControlFamilies { get; }

  public IReadOnlyList<string> ExtraRequirementThemes { get; }

  public bool? RequireBudgetCap { get; }

  /// <summary>Parseable <see cref="ArchLucid.Contracts.Findings.FindingSeverity" /> name when set.</summary>
  public string? BreachSeverity { get; }

  public bool IsEmpty =>
      ExtraTopologyCategories.Count == 0
      && ExtraSecurityControlFamilies.Count == 0
      && ExtraRequirementThemes.Count == 0
      && RequireBudgetCap is not true
      && string.IsNullOrWhiteSpace(BreachSeverity);
}
