using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Canonicalization;

public interface ICanonicalEnricher
{
    IReadOnlyList<CanonicalObject> Enrich(IEnumerable<CanonicalObject> items);
}
