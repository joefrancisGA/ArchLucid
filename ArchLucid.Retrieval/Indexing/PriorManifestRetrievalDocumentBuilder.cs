using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>Builds tenant-scoped prior-manifest retrieval documents from committed findings and decisions.</summary>
public static class PriorManifestRetrievalDocumentBuilder
{
    /// <summary>Creates decision and topology documents for cross-run recall.</summary>
    public static IReadOnlyList<RetrievalDocument> BuildFromManifest(
        ManifestDocument manifest,
        DateTime createdUtc)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        List<RetrievalDocument> documents = [];

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)
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

            documents.Add(CreateDocument(
                manifest,
                $"prior-manifest-{manifest.RunId:N}-decision-{decisionId}",
                "PriorManifestDecision",
                decisionId,
                title: decision.Title,
                content: content,
                hashInput: $"{manifest.RunId:N}|decision|{decisionId}|{content}",
                createdUtc: createdUtc,
                decisionId: decisionId,
                findingId: null));
        }

        TopologySection topology = manifest.Topology;

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

            documents.Add(CreateDocument(
                manifest,
                $"prior-manifest-{manifest.RunId:N}-topology",
                "PriorManifestTopology",
                manifest.RunId.ToString("N"),
                "Topology",
                topologyContent,
                $"{manifest.RunId:N}|topology|{topologyContent}",
                createdUtc,
                decisionId: null,
                findingId: null));
        }

        return documents;
    }

    /// <summary>Creates one document per active finding for semantic recall of prior decisions.</summary>
    public static IReadOnlyList<RetrievalDocument> BuildFromFindings(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        Guid manifestId,
        IEnumerable<Finding> findings,
        DateTime createdUtc)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<RetrievalDocument> documents = [];

        foreach (Finding finding in findings)
        {
            if (finding.IsMuted)
                continue;

            string message = ResolveFindingMessage(finding);

            if (string.IsNullOrWhiteSpace(message))
                continue;

            string findingId = string.IsNullOrWhiteSpace(finding.FindingId)
                ? Guid.NewGuid().ToString("N")
                : finding.FindingId.Trim();

            string content =
                $"[{finding.Category}] {finding.Severity}: {message}";

            string hashInput = $"{runId:N}|{findingId}|{content}";

            documents.Add(CreateDocument(
                tenantId,
                workspaceId,
                projectId,
                runId,
                manifestId,
                $"prior-manifest-{runId:N}-{findingId}",
                "PriorManifestFinding",
                findingId,
                finding.Category,
                content,
                hashInput,
                createdUtc,
                decisionId: null,
                findingId: findingId));
        }

        return documents;
    }

    private static RetrievalDocument CreateDocument(
        ManifestDocument manifest,
        string documentId,
        string sourceType,
        string sourceId,
        string title,
        string content,
        string hashInput,
        DateTime createdUtc,
        string? decisionId,
        string? findingId) =>
        CreateDocument(
            manifest.TenantId,
            manifest.WorkspaceId,
            manifest.ProjectId,
            manifest.RunId,
            manifest.ManifestId,
            documentId,
            sourceType,
            sourceId,
            title,
            content,
            hashInput,
            createdUtc,
            decisionId,
            findingId);

    private static RetrievalDocument CreateDocument(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        Guid manifestId,
        string documentId,
        string sourceType,
        string sourceId,
        string title,
        string content,
        string hashInput,
        DateTime createdUtc,
        string? decisionId,
        string? findingId)
    {
        string contentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hashInput)));

        return new RetrievalDocument
        {
            DocumentId = documentId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = runId,
            ManifestId = manifestId,
            CorpusKind = CorpusKind.PriorManifest,
            SourceType = sourceType,
            SourceId = sourceId,
            Title = title,
            Content = content,
            ContentHash = contentHash,
            CreatedUtc = createdUtc,
            DecisionId = decisionId,
            FindingId = findingId
        };
    }

    private static string ResolveFindingMessage(Finding finding)
    {
        if (!string.IsNullOrWhiteSpace(finding.Rationale))
            return finding.Rationale.Trim();

        if (!string.IsNullOrWhiteSpace(finding.Title))
            return finding.Title.Trim();

        return string.Empty;
    }
}
