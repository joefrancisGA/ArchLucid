using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Pilots;

/// <summary>Validates committed-run posture before generating a sponsor proof pack.</summary>
internal static class BuyerProofPackCommitGuard
{
    internal static bool TryValidateCommitted(ArchitectureRunDetail detail, out string? error)
    {
        ArgumentNullException.ThrowIfNull(detail);

        error = null;

        if (detail.Manifest is null)
        {
            error = "Committed manifest is required for sponsor proof pack generation.";

            return false;
        }

        if (detail.Run.Status != ArchitectureRunStatus.Committed)
        {
            error = "Run must be in Committed status before generating a sponsor proof pack.";

            return false;
        }

        return true;
    }

    internal static bool TryValidateDeltasJson(string deltasJson, out bool demoDataWarning, out string? error)
    {
        ArgumentNullException.ThrowIfNull(deltasJson);

        demoDataWarning = false;
        error = null;

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("isDemoTenant", out JsonElement demoElement))
            demoDataWarning = demoElement.GetBoolean();

        if (!root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
        {
            error = "pilot-run-deltas response missing proofPackageCompleteness — cannot verify commit posture.";

            return false;
        }

        if (proof.TryGetProperty("runInCommittedStatus", out JsonElement committedElement) && committedElement.GetBoolean())
            return true;

        error =
            "Run is not in committed status (or manifest not present). Buyer proof pack is for finalized pilots only — commit the run and retry.";

        return false;
    }
}
