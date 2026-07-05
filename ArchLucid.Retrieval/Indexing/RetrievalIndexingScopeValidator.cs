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

        return IsPlatformCorpus(document.TenantId, document.CorpusKind);
    }

    /// <summary>
    ///     Platform corpora indexed as chunks use the same sentinel tenant id as documents.
    /// </summary>
    public static bool IsPlatformCorpusChunk(RetrievalChunk chunk)
    {
        ArgumentNullException.ThrowIfNull(chunk);

        return IsPlatformCorpus(chunk.TenantId, chunk.CorpusKind);
    }

    /// <summary>
    ///     Validates each chunk against <paramref name="ambientScope" /> before vector-index upsert (TB-604).
    /// </summary>
    public static void ValidateChunks(IReadOnlyList<RetrievalChunk> chunks, ScopeContext ambientScope)
    {
        ArgumentNullException.ThrowIfNull(chunks);
        ArgumentNullException.ThrowIfNull(ambientScope);

        foreach (RetrievalChunk chunk in chunks)
        {
            ValidateChunk(chunk, ambientScope);
        }
    }

    /// <summary>
    ///     Throws <see cref="InvalidOperationException" /> when chunk scope metadata disagrees with ambient scope.
    /// </summary>
    public static void ValidateChunk(RetrievalChunk chunk, ScopeContext ambientScope)
    {
        ArgumentNullException.ThrowIfNull(chunk);
        ArgumentNullException.ThrowIfNull(ambientScope);

        if (IsPlatformCorpusChunk(chunk))
            return;

        ValidateTenantScopedIds(
            chunk.TenantId,
            chunk.WorkspaceId,
            chunk.ProjectId,
            ambientScope,
            "Retrieval chunk");
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

        ValidateTenantScopedIds(
            document.TenantId,
            document.WorkspaceId,
            document.ProjectId,
            ambientScope,
            "Retrieval document");
    }

    private static bool IsPlatformCorpus(Guid tenantId, CorpusKind corpusKind)
    {
        if (tenantId != CorpusKindSentinels.PlatformSentinelTenantId)
            return false;

        return corpusKind is CorpusKind.PolicyPack
            or CorpusKind.PlatformDoc
            or CorpusKind.ReferenceArchitecture
            or CorpusKind.AzureRetailPrice;
    }

    private static void ValidateTenantScopedIds(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        ScopeContext ambientScope,
        string entityLabel)
    {
        if (ambientScope.TenantId == Guid.Empty)
            return;

        if (tenantId != ambientScope.TenantId)
        {
            throw new InvalidOperationException(
                $"{entityLabel} TenantId does not match the current scope tenant. "
                + "Index writes cannot cross tenant boundaries.");
        }

        if (workspaceId != ambientScope.WorkspaceId)
        {
            throw new InvalidOperationException(
                $"{entityLabel} WorkspaceId does not match the current scope workspace.");
        }

        if (projectId != ambientScope.ProjectId)
        {
            throw new InvalidOperationException(
                $"{entityLabel} ProjectId does not match the current scope project.");
        }
    }
}
