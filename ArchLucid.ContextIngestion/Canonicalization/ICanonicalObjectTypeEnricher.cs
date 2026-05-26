using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>
///     Enriches one <see cref="CanonicalObject.ObjectType" /> slice before composite post-processing.
/// </summary>
public interface ICanonicalObjectTypeEnricher
{
    bool CanEnrich(CanonicalObject item);

    CanonicalObject Enrich(CanonicalObject item);
}
