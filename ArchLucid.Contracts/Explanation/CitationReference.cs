namespace ArchLucid.Contracts.Explanation;

/// <summary>URL-safe citation to persisted evidence backing an AI or deterministic narrative.</summary>
/// <param name="Kind">Artifact class for chip routing in the operator UI.</param>
/// <param name="Id">Canonical id string (GUID <c>D</c> form for most artifacts).</param>
/// <param name="Label">Short operator-facing title.</param>
/// <param name="RunId">Owning run when applicable; null for cross-run references in future APIs.</param>
public sealed record CitationReference(CitationKind Kind, string Id, string Label, Guid? RunId);
