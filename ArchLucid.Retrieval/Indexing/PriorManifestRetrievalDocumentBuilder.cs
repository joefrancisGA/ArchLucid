using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>Builds tenant-scoped prior-manifest retrieval documents from committed findings.</summary>
public static class PriorManifestRetrievalDocumentBuilder
{
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
            string contentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hashInput)));

            documents.Add(new RetrievalDocument
            {
                DocumentId = $"prior-manifest-{runId:N}-{findingId}",
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                RunId = runId,
                ManifestId = manifestId,
                CorpusKind = CorpusKind.TenantManifest,
                SourceType = "PriorManifestFinding",
                SourceId = findingId,
                Title = finding.Category,
                Content = content,
                ContentHash = contentHash,
                CreatedUtc = createdUtc,
            });
        }

        return documents;
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
