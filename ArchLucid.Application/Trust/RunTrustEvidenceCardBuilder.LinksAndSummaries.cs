using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Explanation;

namespace ArchLucid.Application.Trust;

public sealed partial class RunTrustEvidenceCardBuilder
{
    private static List<RunTrustEvidenceRouteRef> BuildLinks(string runId, string? topFindingId)
    {
        string enc = Uri.EscapeDataString(runId);
        List<RunTrustEvidenceRouteRef> links =
        [
            new()
            {
                Rel = "traceabilityZip",
                Path = FormattableString.Invariant($"/v1/architecture/review/{enc}/traceability-bundle.zip"),
                Label = "Review-trail ZIP",
            },
            new()
            {
                Rel = "traces", Path = FormattableString.Invariant($"/v1/architecture/review/{enc}/traces"), Label = "Agent execution traces",
            },
            new()
            {
                Rel = "evidence", Path = FormattableString.Invariant($"/v1/architecture/review/{enc}/evidence"), Label = "Evidence package",
            },
        ];

        if (!string.IsNullOrWhiteSpace(topFindingId))
            links.Add(new RunTrustEvidenceRouteRef
            {
                Rel = "topFindingEvidenceChain",
                Path = FormattableString.Invariant($"/v1/architecture/review/{enc}/findings/{Uri.EscapeDataString(topFindingId)}/evidence-chain"),
                Label = "Top finding evidence chain",
            });

        return links;
    }

    private static string SummarizeChain(FindingEvidenceChainResponse? chain)
    {
        if (chain is null)
            return "Evidence chain pointers not available.";
        int nodes = chain.RelatedGraphNodeIds.Count;
        int traces = chain.AgentExecutionTraceIds.Count;
        return FormattableString.Invariant($"Manifest version {chain.ManifestVersion ?? "—"}; graph nodes: {nodes}; linked trace ids: {traces}.");
    }

    private static ArchitectureFinding? SelectTopSeverityFinding(ArchitectureRunDetail detail)
    {
        // Marker rows / JSON hydration can leave Findings null despite the property default.
        return detail.Results
            .Where(static r => r is not null)
            .SelectMany(static r => r.Findings ?? [])
            .OrderByDescending(static f => (int)f.Severity)
            .FirstOrDefault();
    }

    private static string? TruncateTitle(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return null;
        string t = message.Trim();
        return t.Length <= 160 ? t : string.Concat(t.AsSpan(0, 157), "...");
    }

    /// <summary>Matches sponsor copy in <c>ArchLucid.Api.Support.RunExecutionFlavorSummary</c> without referencing the API layer.</summary>
    private static string BuildBuyerExecutionSummary(ArchitectureRun run)
    {
        ArgumentNullException.ThrowIfNull(run);

        if (run.RealModeFellBackToSimulator || run.StructuralExecutionMode == StructuralExecutionMode.Fallback)
            return
                "Part of this review used a documented deterministic analysis path after the primary path did not complete. Treat numeric highlights conservatively and use sponsor exports for the full provenance table.";

        if (run.StructuralExecutionMode == StructuralExecutionMode.Mixed)
            return StructuralExecutionModeLabels.MixedDetail;

        return run.StructuralExecutionMode == StructuralExecutionMode.Real
            ? "Agent-assisted steps used your API host's configured model path when this page was loaded."
            : "Agent-assisted steps used a deterministic analysis path on this host (no billable model calls for those steps).";
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
