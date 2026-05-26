using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>
///     Runs per-<see cref="CanonicalObject.ObjectType" /> enrichers, then App Service network baseline expansion.
/// </summary>
public sealed class CompositeCanonicalEnricher(IReadOnlyList<ICanonicalObjectTypeEnricher> typeEnrichers) : ICanonicalEnricher
{
    private readonly IReadOnlyList<ICanonicalObjectTypeEnricher> _typeEnrichers =
        typeEnrichers ?? throw new ArgumentNullException(nameof(typeEnrichers));

    public IReadOnlyList<CanonicalObject> Enrich(IEnumerable<CanonicalObject> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        List<CanonicalObject> results = [];

        foreach (CanonicalObject item in items)
        {
            CanonicalObject current = item;

            foreach (ICanonicalObjectTypeEnricher enricher in _typeEnrichers)
            {
                if (enricher.CanEnrich(current))
                    current = enricher.Enrich(current);
            }

            results.Add(current);
        }

        return AppServiceNetworkAccessSecurityBaselineExpander.Expand(results);
    }
}
