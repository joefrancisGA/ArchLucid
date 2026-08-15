using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph;

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

        if (!item.Properties.ContainsKey(CanonicalGraphPropertyKeys.BaselineScope))
        {
            item.Properties.TryGetValue("controlId", out string? controlId);
            item.Properties[CanonicalGraphPropertyKeys.BaselineScope] =
                TopologySensitivityClassifier.ClassifyBaselineScope(controlId, item.Name);
        }

        return item;
    }
}
