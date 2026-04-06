using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Canonicalization;

public interface ICanonicalDeduplicator
{
    IReadOnlyList<CanonicalObject> Deduplicate(
        IEnumerable<CanonicalObject> items);
}
