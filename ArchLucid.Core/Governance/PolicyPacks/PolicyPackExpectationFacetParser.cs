using System.Globalization;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Json;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Parses reserved expectation keys from merged effective governance content.
/// </summary>
public static class PolicyPackExpectationFacetParser
{
  private static readonly HashSet<string> KnownTopologyCategories =
      new(StringComparer.OrdinalIgnoreCase)
      {
          "network",
          "compute",
          "storage",
          "data",
          "identity",
      };

  private static readonly HashSet<string> KnownSecurityControlFamilies =
      new(StringComparer.OrdinalIgnoreCase)
      {
          "identity-access",
          "network-isolation",
          "data-protection",
          "encryption",
          "logging-monitoring",
          "vulnerability-management",
      };

  public static PolicyPackExpectationFacet Parse(PolicyPackContentDocument? effective)
  {
    if (effective is null || effective.AdvisoryDefaults.Count == 0)
      return PolicyPackExpectationFacet.Empty;

    IReadOnlyList<string> topologyExtras = ParsePipeSeparatedTopology(
        effective.AdvisoryDefaults,
        PolicyPackExpectationAdvisoryKeys.TopologyCategoriesAdd);

    IReadOnlyList<string> securityExtras = ParsePipeSeparatedKnownSet(
        effective.AdvisoryDefaults,
        PolicyPackExpectationAdvisoryKeys.SecurityControlFamiliesAdd,
        KnownSecurityControlFamilies);

    IReadOnlyList<string> requirementExtras = ParsePipeSeparatedFree(
        effective.AdvisoryDefaults,
        PolicyPackExpectationAdvisoryKeys.RequirementThemesAdd);

    bool? requireBudgetCap = ParseRequireBudgetCap(effective.AdvisoryDefaults);
    string? breachSeverity = ParseBreachSeverity(effective.AdvisoryDefaults);

    return new PolicyPackExpectationFacet(
        topologyExtras,
        securityExtras,
        requirementExtras,
        requireBudgetCap,
        breachSeverity);
  }

  private static IReadOnlyList<string> ParsePipeSeparatedTopology(
      Dictionary<string, string> advisoryDefaults,
      string key)
  {
    if (!advisoryDefaults.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
      return [];

    return SplitDistinct(raw)
        .Where(token => KnownTopologyCategories.Contains(token))
        .ToList();
  }

  private static IReadOnlyList<string> ParsePipeSeparatedKnownSet(
      Dictionary<string, string> advisoryDefaults,
      string key,
      HashSet<string> knownSet)
  {
    if (!advisoryDefaults.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
      return [];

    return SplitDistinct(raw)
        .Where(token => knownSet.Contains(token))
        .ToList();
  }

  private static IReadOnlyList<string> ParsePipeSeparatedFree(
      Dictionary<string, string> advisoryDefaults,
      string key)
  {
    if (!advisoryDefaults.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
      return [];

    return SplitDistinct(raw).ToList();
  }

  private static bool? ParseRequireBudgetCap(Dictionary<string, string> advisoryDefaults)
  {
    if (!advisoryDefaults.TryGetValue(PolicyPackExpectationAdvisoryKeys.CostRequireBudgetCap, out string? raw)
        || string.IsNullOrWhiteSpace(raw))
    {
      return null;
    }

    string normalized = raw.Trim();

    if (JsonBooleanStringReader.TryParseBooleanString(normalized, out bool boolean))
    {
      return boolean;
    }

    if (TryParseWholeNumberString(normalized, out int wholeNumber))
    {
      return wholeNumber != 0;
    }

    return null;
  }

  private static string? ParseBreachSeverity(Dictionary<string, string> advisoryDefaults)
  {
    if (!advisoryDefaults.TryGetValue(PolicyPackExpectationAdvisoryKeys.CostBreachSeverity, out string? raw)
        || string.IsNullOrWhiteSpace(raw))
    {
      return null;
    }

    string trimmed = raw.Trim();

    if (Enum.TryParse<FindingSeverity>(trimmed, ignoreCase: true, out FindingSeverity parsed)
        && Enum.IsDefined(parsed))
    {
      return parsed.ToString();
    }

    if (TryParseWholeNumberString(trimmed, out int ordinal)
        && Enum.IsDefined(typeof(FindingSeverity), ordinal))
    {
      return ((FindingSeverity)ordinal).ToString();
    }

    return null;
  }

  private static bool TryParseWholeNumberString(string raw, out int value)
  {
    if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
    {
      return true;
    }

    if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
        && double.IsFinite(numeric)
        && numeric >= 0
        && numeric == Math.Floor(numeric))
    {
      value = (int)numeric;

      return true;
    }

    value = default;

    return false;
  }

  private static IEnumerable<string> SplitDistinct(string raw) =>
      raw.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
          .Where(segment => !string.IsNullOrWhiteSpace(segment))
          .Distinct(StringComparer.OrdinalIgnoreCase);
}
