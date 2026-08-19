using System.Globalization;
using System.Text;

namespace ArchLucid.Cli.Commands;

/// <summary>Buyer-safe source labeling for proof-packet exports (assessment Tier 2 #16).</summary>
internal static class ProofPacketSourceLabelsBuilder
{
    public const string FileName = "SOURCE-LABELS.txt";

    public static string Build(string runId, DateTimeOffset? generatedUtc = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        DateTimeOffset utc = generatedUtc ?? TimeProvider.System.GetUtcNow();
        StringBuilder sb = new();

        sb.AppendLine("ArchLucid proof-packet — source labels and data policy");
        sb.AppendLine(CultureInfo.InvariantCulture, $"GeneratedUtc: {utc:O}");
        sb.AppendLine(CultureInfo.InvariantCulture, $"RunId: {runId.Trim()}");
        sb.AppendLine();
        sb.AppendLine("This ZIP is a buyer-safe handoff for one committed architecture review.");
        sb.AppendLine("It excludes secrets, raw audit payloads, and full tenant identifiers.");
        sb.AppendLine();
        sb.AppendLine("Included sources (OpenAPI v1):");
        sb.AppendLine("- GET /v1/pilots/runs/{runId}/pilot-run-deltas — run evidence and proof completeness");
        sb.AppendLine("- GET /v1/pilots/runs/{runId}/first-value-report — sponsor Markdown summary (when available)");
        sb.AppendLine("- GET /v1/explain/runs/{runId}/aggregate — explanation confidence (optional)");
        sb.AppendLine("- GET /v1/audit/search — recent audit event ids only (no DataJson payloads)");
        sb.AppendLine("- GET /v1/artifacts/runs/{runId} — artifact id manifest (when authorized)");
        sb.AppendLine();
        sb.AppendLine("ROI and savings lines use RoiMetricSourceKind labels (CustomerProvided, BenchmarkAssumption, NotEstimated).");
        sb.AppendLine("Estimated LLM/Azure costs are model-derived — not invoice truth.");
        sb.AppendLine();
        sb.AppendLine("Before external circulation:");
        sb.AppendLine("- Confirm runInCommittedStatus via proofPackageCompleteness in run-evidence.json");
        sb.AppendLine("- Read limitations.md for PilotStrict, demo tenant, and deferred procurement items");
        sb.AppendLine("- Do not forward when buyer-safe gate reports NotSendable without explicit caveat");
        sb.AppendLine();
        sb.AppendLine("Canonical trust narrative: docs/go-to-market/trust-center.md (hosted /trust when deployed).");

        return sb.ToString();
    }
}
