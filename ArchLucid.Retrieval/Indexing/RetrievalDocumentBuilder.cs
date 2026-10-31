using System.Text;
using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
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
        string manifestTitle = string.IsNullOrWhiteSpace(manifest.Metadata?.Name)
            ? "Manifest name was not stored."
            : manifest.Metadata.Name.Trim();

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
                Title = manifestTitle,
                Content = JsonSerializer.Serialize(manifest, JsonOptions),
                ContentHash = manifest.ManifestHash,
                CreatedUtc = manifest.CreatedUtc,
                DecisionId = null,
                FindingId = null
            }
        ];

        StringBuilder mandatedMarkdown = new();
        ArchitectureMandatedMarkdownSections.Append(mandatedMarkdown, manifest);
        string mandatedContent = mandatedMarkdown.ToString();
        string mandatedHashInput = $"{manifest.RunId:N}|mandated-markdown|{mandatedContent}";

        documents.Add(new RetrievalDocument
        {
            DocumentId = $"manifest-{manifest.ManifestId:N}-mandated-markdown",
            TenantId = manifest.TenantId,
            WorkspaceId = manifest.WorkspaceId,
            ProjectId = manifest.ProjectId,
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CorpusKind = CorpusKind.TenantManifest,
            SourceType = "ManifestMandatedMarkdown",
            SourceId = manifest.ManifestId.ToString(),
            Title = "Mandated architecture markdown",
            Content = mandatedContent,
            ContentHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(mandatedHashInput))),
            CreatedUtc = manifest.CreatedUtc,
            DecisionId = null,
            FindingId = null
        });

        int emittedDecisionOrdinal = 0;

        for (int decisionIndex = 0; decisionIndex < manifest.Decisions.Count; decisionIndex++)
        {
            ResolvedArchitectureDecision decision = manifest.Decisions[decisionIndex];

            if (string.IsNullOrWhiteSpace(decision.Title))
                continue;

            // JSON deserialization can leave DecisionId null; the manifest-scoped index keeps retries stable.
            string stableDecisionKey = string.IsNullOrWhiteSpace(decision.DecisionId)
                ? $"generated-{manifest.ManifestId:N}-{emittedDecisionOrdinal}"
                : decision.DecisionId.Trim();
            string decisionId = string.IsNullOrWhiteSpace(decision.DecisionId)
                ? "Decision id was not stored."
                : decision.DecisionId.Trim();

            string rationale = string.IsNullOrWhiteSpace(decision.Rationale) ? string.Empty : decision.Rationale.Trim();
            string selected = string.IsNullOrWhiteSpace(decision.SelectedOption)
                ? "Selected option was not stored."
                : decision.SelectedOption.Trim();

            string content =
                $"[{decision.Category}] Decision {decision.Title}: selected {selected}. {rationale}".Trim();

            if (string.IsNullOrWhiteSpace(content))
                continue;

            documents.Add(new RetrievalDocument
            {
                DocumentId = $"manifest-{manifest.ManifestId:N}-decision-{stableDecisionKey}",
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
                ContentHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes($"{manifest.RunId:N}|decision|{stableDecisionKey}|{content}"))),
                CreatedUtc = manifest.CreatedUtc,
                DecisionId = decisionId
            });

            emittedDecisionOrdinal++;
        }

        var topology = manifest.Topology;

        if (topology.Services.Count > 0 || topology.Datastores.Count > 0 || topology.Relationships.Count > 0)
        {
            List<string> serviceNames = topology.Services
                .Select(static s => string.IsNullOrWhiteSpace(s.ServiceName)
                    ? "Service name was not stored."
                    : s.ServiceName.Trim())
                .ToList();

            List<string> datastoreNames = topology.Datastores
                .Select(static d => string.IsNullOrWhiteSpace(d.DatastoreName)
                    ? "Datastore name was not stored."
                    : d.DatastoreName.Trim())
                .ToList();

            string servicesLine = serviceNames.Count > 0
                ? string.Join(", ", serviceNames)
                : "Services were not listed on this snapshot.";
            string datastoresLine = datastoreNames.Count > 0
                ? string.Join(", ", datastoreNames)
                : "Datastores were not listed on this snapshot.";
            string relationshipsLine = topology.Relationships.Count > 0
                ? topology.Relationships.Count.ToString()
                : "Relationships were not listed on this snapshot.";

            string topologyContent =
                $"Topology services: {servicesLine}. " +
                $"Datastores: {datastoresLine}. " +
                $"Relationships: {relationshipsLine}.";

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
                CreatedUtc = manifest.CreatedUtc,
                DecisionId = null,
                FindingId = null
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
        // Run-completion outbox retries may resend the same ArtifactId; keep the last payload so indexing does not emit duplicate DocumentIds.
        return artifacts
            .GroupBy(static x => x.ArtifactId)
            .Select(static group => group.Last())
            .Select(x => new RetrievalDocument
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
                CreatedUtc = x.CreatedUtc,
                DecisionId = null,
                FindingId = null
            })
            .ToList();
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
            CreatedUtc = x.CreatedUtc,
            DecisionId = null,
            FindingId = null
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

        // The outbox may index the same run again after artifacts or findings change.
        // Hash the graph bytes so an unchanged graph still skips, and a changed graph reindexes.
        string contentHash = Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes($"{runId:N}|provenance|{summary}")));

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
                ContentHash = contentHash,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                DecisionId = null,
                FindingId = null
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
        int emittedFindingOrdinal = 0;

        for (int findingIndex = 0; findingIndex < findings.Count; findingIndex++)
        {
            Finding finding = findings[findingIndex];

            if (finding.IsMuted)
                continue;

            string message = !string.IsNullOrWhiteSpace(finding.Rationale) ? finding.Rationale.Trim() :
                             !string.IsNullOrWhiteSpace(finding.Title) ? finding.Title.Trim() : string.Empty;

            if (string.IsNullOrWhiteSpace(message))
                continue;

            // JSON deserialization can leave FindingId null; the run-scoped index keeps retries stable.
            string stableFindingKey = string.IsNullOrWhiteSpace(finding.FindingId)
                ? $"generated-{runId:N}-{emittedFindingOrdinal}"
                : finding.FindingId.Trim();
            string findingId = string.IsNullOrWhiteSpace(finding.FindingId)
                ? "Finding id was not stored."
                : finding.FindingId.Trim();

            string category = string.IsNullOrWhiteSpace(finding.Category)
                ? "Category was not stored."
                : finding.Category.Trim();
            string title = string.IsNullOrWhiteSpace(finding.Title)
                ? "Finding title was not stored."
                : finding.Title.Trim();

            string content = $"[{category}] {finding.Severity}: {message}";
            string hashInput = $"{runId:N}|{stableFindingKey}|{content}";

            documents.Add(new RetrievalDocument
            {
                DocumentId = $"manifest-{runId:N}-finding-{stableFindingKey}",
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = runId,
                ManifestId = manifestId,
                CorpusKind = CorpusKind.TenantManifest,
                SourceType = "ManifestFinding",
                SourceId = findingId,
                Title = title,
                Content = content,
                ContentHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(hashInput))),
                CreatedUtc = createdUtc,
                FindingId = findingId
            });

            emittedFindingOrdinal++;
        }

        return documents;
    }
}
