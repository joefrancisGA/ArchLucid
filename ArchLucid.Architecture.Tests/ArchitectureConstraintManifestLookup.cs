namespace ArchLucid.Architecture.Tests;

/// <summary>Resolves a rule from a constraint manifest, failing loudly when a theory row drifts from the manifest.</summary>
internal static class ArchitectureConstraintManifestLookup
{
    internal static TConstraint Rule<TConstraint>(
        IReadOnlyDictionary<string, TConstraint> rules,
        string ruleName)
        where TConstraint : notnull
    {
        ArgumentNullException.ThrowIfNull(rules);
        ArgumentException.ThrowIfNullOrWhiteSpace(ruleName);

        if (!rules.TryGetValue(ruleName, out TConstraint? constraint))
        {
            throw new KeyNotFoundException($"No architecture constraint is registered under rule name '{ruleName}'.");
        }

        return constraint;
    }
}
