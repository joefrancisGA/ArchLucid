using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Conversation;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     <see cref="IRetrievalDocumentBuilder" /> with stable <see cref="RetrievalDocument.DocumentId" /> patterns per
///     source type.
/// </summary>
public sealed class RetrievalDocumentBuilder : IRetrievalDocumentBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false, PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <inheritdoc />
    public IReadOnlyList<RetrievalDocument> BuildForManifest(ManifestDocument manifest)
    {
        List<RetrievalDocument> documents =
        [
            new RetrievalDocument
            {
                DocumentId = $"manifest-{manifest.ManifestId:N}",
                TenantId = manifest.TenantId,
                WorkspaceId = manifest.WorkspaceId,
                ProjectId = manifest.ProjectId,
                RunId = manifest.RunId,
                ManifestId = manifest.ManifestId,
                CorpusKind = CorpusKind.TenantManifest,
                SourceType = "Manifest",
                SourceId = manifest.ManifestId.ToString(),
                Title = manifest.Metadata.Name,
                Content = JsonSerializer.Serialize(manifest, JsonOptions),
                ContentHash = manifest.ManifestHash,
                CreatedUtc = manifest.CreatedUtc
            }
        ];

        foreach (var decision in manifest.Decisions)
        {
            if (string.IsNullOrWhiteSpace(decision.Title))
                continue;

            string decisionId = string.IsNullOrWhiteSpace(decision.DecisionId)
                ? Guid.NewGuid().ToString("N")
                : decision.DecisionId.Trim();

            string rationale = string.IsNullOrWhiteSpace(decision.Rationale) ? string.Empty : decision.Rationale.Trim();
            string selected = string.IsNullOrWhiteSpace(decision.SelectedOption)
                ? string.Empty
                : decision.SelectedOption.Trim();

            string content =
                $"[{decision.Category}] Decision {decision.Title}: selected {selected}. {rationale}".Trim();

            if (string.IsNullOrWhiteSpace(content))
                continue;

            documents.Add(new RetrievalDocument
            {
                DocumentId = $"manifest-{manifest.ManifestId:N}-decision-{decisionId}",
                TenantId = manifest.TenantId,
                WorkspaceId = manifest.WorkspaceId,
                ProjectId = manifest.ProjectId,
                RunId = manifest.RunId,
                ManifestId = manifest.ManifestId,
                CorpusKind = CorpusKind.TenantManifest,
                SourceType = "ManifestDecision",
                SourceId = decisionId,
                Title = decision.Title,
                Content = content,
                ContentHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{manifest.RunId:N}|decision|{decisionId}|{content}"))),
                CreatedUtc = manifest.CreatedUtc,
                DecisionId = decisionId
            });
        }

        var topology = manifest.Topology;
        if (topology.Services.Count > 0 || topology.Datastores.Count > 0 || topology.Relationships.Count > 0)
        {
            List<string> serviceNames = topology.Services
                .Select(static s => s.ServiceName)
                .Where(static n => !string.IsNullOrWhiteSpace(n))
                .ToList();

            List<string> datastoreNames = topology.Datastores
                .Select(static d => d.DatastoreName)
                .Where(static n => !string.IsNullOrWhiteSpace(n))
                .ToList();

            string topologyContent =
                $"Topology services: {string.Join(", ", serviceNames)}. " +
                $"Datastores: {string.Join(", ", datastoreNames)}. " +
                $"Relationships: {topology.Relationships.Count}.";

            documents.Add(new RetrievalDocument
            {
                DocumentId = $"manifest-{manifest.ManifestId:N}-topology",
                TenantId = manifest.TenantId,
                WorkspaceId = manifest.WorkspaceId,
                ProjectId = manifest.ProjectId,
                RunId = manifest.RunId,
                ManifestId = manifest.ManifestId,
                CorpusKind = CorpusKind.TenantManifest,
                SourceType = "ManifestTopology",
                SourceId = manifest.RunId.ToString("N"),
                Title = "Topology",
                Content = topologyContent,
                ContentHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{manifest.RunId:N}|topology|{topologyContent}"))),
                CreatedUtc = manifest.CreatedUtc
            });
        }

        return documents;
    }

    /// <inheritdoc />
    public IReadOnlyList<RetrievalDocument> BuildForArtifacts(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        return artifacts.Select(x => new RetrievalDocument
        {
            DocumentId = $"artifact-{x.ArtifactId:N}",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = x.RunId,
            ManifestId = x.ManifestId,
            CorpusKind = CorpusKind.TenantManifest,
            SourceType = "Artifact",
            SourceId = x.ArtifactId.ToString(),
            Title = x.Name,
            Content = x.Content,
            ContentHash = x.ContentHash,
            CreatedUtc = x.CreatedUtc
        }).ToList();
    }

    /// <inheritdoc />
    public IReadOnlyList<RetrievalDocument> BuildForConversation(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid? runId,
        IReadOnlyList<ConversationMessage> messages)
    {
        return messages.Select(x => new RetrievalDocument
        {
            DocumentId = $"conversation-{x.MessageId:N}",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = runId,
            CorpusKind = CorpusKind.Conversation,
            SourceType = "ConversationMessage",
            SourceId = x.MessageId.ToString(),
            Title = x.Role,
            Content = x.Content,
            ContentHash = x.MessageId.ToString("N"),
            CreatedUtc = x.CreatedUtc
        }).ToList();
    }

    /// <inheritdoc />
    public IReadOnlyList<RetrievalDocument> BuildForProvenance(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        DecisionProvenanceGraph graph)
    {
        string summary = JsonSerializer.Serialize(graph, JsonOptions);

        return
        [
            new RetrievalDocument
            {
                DocumentId = $"provenance-{runId:N}",
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = runId,
                CorpusKind = CorpusKind.TenantManifest,
                SourceType = "ProvenanceGraph",
                SourceId = runId.ToString(),
                Title = $"Provenance for Run {runId}",
                Content = summary,
                ContentHash = runId.ToString("N"),
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            }
        ];
    }

    /// <inheritdoc />
    public IReadOnlyList<RetrievalDocument> BuildForFindings(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        Guid manifestId,
        IReadOnlyList<ArchLucid.Contracts.Findings.Finding> findings,
        DateTime createdUtc)
    {
        List<RetrievalDocument> documents = [];

        foreach (var finding in findings)
        {
            if (finding.IsMuted)
                continue;

            string message = !string.IsNullOrWhiteSpace(finding.Rationale) ? finding.Rationale.Trim() :
                             !string.IsNullOrWhiteSpace(finding.Title) ? finding.Title.Trim() : string.Empty;

            if (string.IsNullOrWhiteSpace(message))
                continue;

            string findingId = string.IsNullOrWhiteSpace(finding.FindingId)
                ? Guid.NewGuid().ToString("N")
                : finding.FindingId.Trim();

            string content = $"[{finding.Category}] {finding.Severity}: {message}";
            string hashInput = $"{runId:N}|{findingId}|{content}";

            documents.Add(new RetrievalDocument
            {
                DocumentId = $"manifest-{runId:N}-finding-{findingId}",
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = runId,
                ManifestId = manifestId,
                CorpusKind = CorpusKind.TenantManifest,
                SourceType = "ManifestFinding",
                SourceId = findingId,
                Title = finding.Category,
                Content = content,
                ContentHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(hashInput))),
                CreatedUtc = createdUtc,
                FindingId = findingId
            });
        }

        return documents;
    }
}
