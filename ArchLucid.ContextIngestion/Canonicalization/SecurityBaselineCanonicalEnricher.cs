using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>
///     Adds default <c>status</c> for SecurityBaseline objects.
/// </summary>
public sealed class SecurityBaselineCanonicalEnricher : ICanonicalObjectTypeEnricher
{
    public bool CanEnrich(CanonicalObject item)
    {
        ArgumentNullException.ThrowIfNull(item);

        return string.Equals(item.ObjectType, "SecurityBaseline", StringComparison.OrdinalIgnoreCase);
    }

    public CanonicalObject Enrich(CanonicalObject item)
    {
        ArgumentNullException.ThrowIfNull(item);

        item.Properties.TryAdd("status", "declared");

        return item;
    }
}
