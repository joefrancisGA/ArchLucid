using ArchLucid.Core.Scoping;

using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Ensures retrieval index writes cannot attach tenant metadata outside the ambient <see cref="ScopeContext" /> (TB-048).
/// </summary>
public static class RetrievalIndexingScopeValidator
{
    /// <summary>
    ///     Platform corpora (policy packs, ADRs, exemplars) use <see cref="CorpusKindSentinels.PlatformSentinelTenantId" />.
    /// </summary>
    public static bool IsPlatformCorpusDocument(RetrievalDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (document.TenantId != CorpusKindSentinels.PlatformSentinelTenantId)
            return false;

        return document.CorpusKind is CorpusKind.PolicyPack
            or CorpusKind.PlatformDoc
            or CorpusKind.ReferenceArchitecture
            or CorpusKind.AzureRetailPrice;
    }

    /// <summary>
    ///     Validates each document against <paramref name="ambientScope" /> before embedding/indexing.
    /// </summary>
    public static void ValidateDocuments(IReadOnlyList<RetrievalDocument> documents, ScopeContext ambientScope)
    {
        ArgumentNullException.ThrowIfNull(documents);
        ArgumentNullException.ThrowIfNull(ambientScope);

        foreach (RetrievalDocument document in documents)
        {
            ValidateDocument(document, ambientScope);
        }
    }

    /// <summary>
    ///     Throws <see cref="InvalidOperationException" /> when tenant/workspace/project metadata disagrees with ambient scope.
    /// </summary>
    public static void ValidateDocument(RetrievalDocument document, ScopeContext ambientScope)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentNullException.ThrowIfNull(ambientScope);

        if (IsPlatformCorpusDocument(document))
            return;

        if (ambientScope.TenantId == Guid.Empty)
            return;

        if (document.TenantId != ambientScope.TenantId)
        {
            throw new InvalidOperationException(
                "Retrieval document TenantId does not match the current scope tenant. "
                + "Index writes cannot cross tenant boundaries.");
        }

        if (document.WorkspaceId != ambientScope.WorkspaceId)
        {
            throw new InvalidOperationException(
                "Retrieval document WorkspaceId does not match the current scope workspace.");
        }

        if (document.ProjectId != ambientScope.ProjectId)
        {
            throw new InvalidOperationException(
                "Retrieval document ProjectId does not match the current scope project.");
        }
    }
}
