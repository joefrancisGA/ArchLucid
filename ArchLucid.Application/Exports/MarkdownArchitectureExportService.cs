using System.Text;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Produces a Markdown export document containing the architecture diagram (as a Mermaid code fence),
///     the Markdown summary, and an optional compact evidence snapshot.
/// </summary>
public sealed class MarkdownArchitectureExportService : IArchitectureExportService
{
    /// <inheritdoc/>
    public string GenerateMarkdownPackage(GoldenManifest manifest, string mermaidDiagram, string markdownSummary, AgentEvidencePackage? evidence = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(mermaidDiagram);
        ArgumentNullException.ThrowIfNull(markdownSummary);
        StringBuilder sb = new();
        string systemName = MarkdownPackageExportHonestyCopy.ResolveSystemName(manifest.SystemName);
        sb.AppendLine($"# Architecture Export: {systemName}");
        sb.AppendLine();
        sb.AppendLine("## Diagram");
        sb.AppendLine();

        if (string.IsNullOrWhiteSpace(mermaidDiagram))
        {
            sb.AppendLine(MarkdownPackageExportHonestyCopy.DiagramNotStored);
        }
        else
        {
            sb.AppendLine("```mermaid");
            sb.AppendLine(mermaidDiagram.TrimEnd());
            sb.AppendLine("```");
            sb.AppendLine();
            sb.AppendLine(MarkdownPackageExportHonestyCopy.DiagramStoredNotObservedTrafficDisclaimer);
        }

        sb.AppendLine();
        sb.AppendLine("## Summary");
        sb.AppendLine();

        if (string.IsNullOrWhiteSpace(markdownSummary))
            sb.AppendLine(MarkdownPackageExportHonestyCopy.ArchitectureSummaryNotStored);
        else
            sb.AppendLine(markdownSummary.TrimEnd());

        sb.AppendLine();

        if (evidence is null)
        {
            sb.AppendLine("---");
            sb.AppendLine();
            sb.AppendLine("## Evidence Package Snapshot");
            sb.AppendLine();
            sb.AppendLine(MarkdownPackageExportHonestyCopy.EvidencePackageNotStored);
            sb.AppendLine();

            return sb.ToString();
        }

        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("## Evidence Package Snapshot");
        sb.AppendLine();
        sb.AppendLine(
            $"- Evidence Package ID: {MarkdownPackageExportHonestyCopy.ResolveIdentityField(evidence.EvidencePackageId, MarkdownPackageExportHonestyCopy.EvidencePackageIdNotStored)}");
        sb.AppendLine(
            $"- Run ID: {MarkdownPackageExportHonestyCopy.ResolveIdentityField(evidence.RunId, MarkdownPackageExportHonestyCopy.RunIdNotStored)}");
        sb.AppendLine(
            $"- Request ID: {MarkdownPackageExportHonestyCopy.ResolveIdentityField(evidence.RequestId, MarkdownPackageExportHonestyCopy.RequestIdNotStored)}");
        sb.AppendLine(
            $"- Policy Count: {MarkdownPackageExportHonestyCopy.FormatEvidenceCollectionCount(evidence.Policies.Count, MarkdownPackageExportHonestyCopy.PolicyCountStoredEmpty)}");
        sb.AppendLine(
            $"- Service Catalog Hint Count: {MarkdownPackageExportHonestyCopy.FormatEvidenceCollectionCount(evidence.ServiceCatalog.Count, MarkdownPackageExportHonestyCopy.ServiceCatalogCountStoredEmpty)}");
        sb.AppendLine(
            $"- Pattern Hint Count: {MarkdownPackageExportHonestyCopy.FormatEvidenceCollectionCount(evidence.Patterns.Count, MarkdownPackageExportHonestyCopy.PatternHintCountStoredEmpty)}");
        sb.AppendLine(
            $"- Evidence Note Count: {MarkdownPackageExportHonestyCopy.FormatEvidenceCollectionCount(evidence.Notes.Count, MarkdownPackageExportHonestyCopy.EvidenceNoteCountStoredEmpty)}");
        sb.AppendLine();
        return sb.ToString();
    }
}
