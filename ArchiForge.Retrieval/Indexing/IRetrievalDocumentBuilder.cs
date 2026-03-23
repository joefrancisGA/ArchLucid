using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.Core.Conversation;
using ArchiForge.Decisioning.Models;
using ArchiForge.Provenance;
using ArchiForge.Retrieval.Models;

namespace ArchiForge.Retrieval.Indexing;

/// <summary>
/// Maps domain objects into <see cref="ArchiForge.Retrieval.Models.RetrievalDocument"/> rows for <see cref="IRetrievalIndexingService"/>.
/// </summary>
/// <remarks>Implementation: <see cref="RetrievalDocumentBuilder"/> (JSON for manifest/provenance, plain text for artifacts/messages).</remarks>
public interface IRetrievalDocumentBuilder
{
    /// <summary>One document: full <see cref="GoldenManifest"/> JSON as content.</summary>
    IReadOnlyList<RetrievalDocument> BuildForManifest(GoldenManifest manifest);

    /// <summary>One document per synthesized artifact (content = artifact body).</summary>
    IReadOnlyList<RetrievalDocument> BuildForArtifacts(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IReadOnlyList<SynthesizedArtifact> artifacts);

    /// <summary>One document per chat message (title = role, content = message text).</summary>
    IReadOnlyList<RetrievalDocument> BuildForConversation(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? runId,
        IReadOnlyList<ConversationMessage> messages);

    /// <summary>Single document containing serialized <see cref="DecisionProvenanceGraph"/>.</summary>
    IReadOnlyList<RetrievalDocument> BuildForProvenance(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        DecisionProvenanceGraph graph);
}
