using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Parses <c>pilot-run-deltas</c> JSON to enforce buyer-pack commit posture (kept separate for CLI tests).
/// </summary>
internal static class BuyerProofPackCommitGuard
{
    public static bool TryValidate(string deltasJson, out bool demoDataWarning, out string? error)
    {
        ArgumentNullException.ThrowIfNull(deltasJson);

        demoDataWarning = false;
        error = null;

        using JsonDocument doc = JsonDocument.Parse(deltasJson);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("isDemoTenant", out JsonElement demoE))
            demoDataWarning = demoE.GetBoolean();

        if (!root.TryGetProperty("proofPackageCompleteness", out JsonElement proof))
        {
            error = "pilot-run-deltas response missing proofPackageCompleteness — cannot verify commit posture.";

            return false;
        }

        if (!proof.TryGetProperty("runInCommittedStatus", out JsonElement committedEl) || !committedEl.GetBoolean())
        {
            error =
                "Run is not in committed status (or manifest not present). Buyer proof pack is for finalized pilots only — commit the run and retry.";

            return false;
        }

        return true;
    }
}
