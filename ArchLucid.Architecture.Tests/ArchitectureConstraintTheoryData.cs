namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Builds xUnit theory data from constraint manifest keys. Rules travel through <c>MemberData</c> as their
///     name only, so CI output shows the rule sentence and the data rows stay serializable.
/// </summary>
internal static class ArchitectureConstraintTheoryData
{
    internal static TheoryData<string> FromRuleNames(IEnumerable<string> ruleNames)
    {
        ArgumentNullException.ThrowIfNull(ruleNames);

        TheoryData<string> data = new();

        foreach (string ruleName in ruleNames)
        {
            data.Add(ruleName);
        }

        return data;
    }
}
