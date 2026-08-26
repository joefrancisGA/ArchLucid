namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Reserved <see cref="ArchLucid.Contracts.Governance.PolicyPackContentDocument.AdvisoryDefaults" /> keys
///     for expectation parameterization (V1 — no OpenAPI facet).
/// </summary>
public static class PolicyPackExpectationAdvisoryKeys
{
  public const string TopologyCategoriesAdd = "expectation.topologyCategories.add";

  public const string SecurityControlFamiliesAdd = "expectation.securityControlFamilies.add";

  public const string RequirementThemesAdd = "expectation.requirementThemes.add";

  public const string CostRequireBudgetCap = "cost.requireBudgetCap";

  public const string CostBreachSeverity = "cost.breachSeverity";
}
