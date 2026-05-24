using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Builds <see cref="ArchLucid.Retrieval.Models.RetrievalDocument" /> sets from a completed authority run and indexes
///     them for semantic search.
/// </summary>
/// <remarks>
///     Implementation: <see cref="RetrievalRunCompletionIndexer" />. Production hosts enqueue work via the persistence
///     retrieval indexing outbox; <c>ArchLucid.Host.Core</c> drains the outbox and calls this interface after the authority unit of work commits.
/// </remarks>
public interface IRetrievalRunCompletionIndexer
{
    /// <summary>
    ///     Indexes manifest JSON, per-artifact bodies, and serialized provenance for <see cref="ManifestDocument.RunId" />.
    /// </summary>
    /// <param name="tenantId">Scope tenant.</param>
    /// <param name="workspaceId">Scope workspace.</param>
    /// <param name="projectId">Scope project.</param>
    /// <param name="manifest">Golden manifest for the run.</param>
    /// <param name="artifacts">Synthesized artifacts for the run (may be empty).</param>
    /// <param name="provenanceGraph">Decision provenance graph for the run.</param>
    /// <param name="findingsSnapshot">Committed findings snapshot for per-finding prior-manifest chunks (optional).</param>
    /// <param name="ct">Cancellation token.</param>
    Task IndexAuthorityRunAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        ManifestDocument manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        DecisionProvenanceGraph provenanceGraph,
        FindingsSnapshot? findingsSnapshot,
        CancellationToken ct);
}
