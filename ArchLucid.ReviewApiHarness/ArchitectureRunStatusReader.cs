using System.Text.Json;

namespace ArchLucid.ReviewApiHarness;

/// <summary>Helpers for reading architecture run status from validated JSON payloads.</summary>
public static class ArchitectureRunStatusReader
{
    public static string? ReadRunId(JsonElement createOrDetail)
    {
        if (!createOrDetail.TryGetProperty("run", out JsonElement run) ||
            !run.TryGetProperty("runId", out JsonElement runIdEl))
        {
            return null;
        }

        if (runIdEl.ValueKind == JsonValueKind.String)
            return runIdEl.GetString();

        if (runIdEl.ValueKind == JsonValueKind.Number)
            return runIdEl.GetRawText();

        return runIdEl.GetRawText();
    }

    public static string? ReadStatus(JsonElement detail)
    {
        if (!detail.TryGetProperty("run", out JsonElement run))
            return null;

        if (run.TryGetProperty("status", out JsonElement statusEl))
            return ReadJsonStringOrNumber(statusEl);

        if (run.TryGetProperty("legacyRunStatus", out JsonElement legacyStatusEl))
            return ReadJsonStringOrNumber(legacyStatusEl);

        return null;
    }

    private static string? ReadJsonStringOrNumber(JsonElement value)
    {
        return value.ValueKind == JsonValueKind.Number
            ? value.GetRawText()
            : value.GetString();
    }

    public static bool IsReadyForCommitOrCommitted(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return false;

        if (string.Equals(status, "ReadyForCommit", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "Committed", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Contracts enum: ReadyForCommit=4, Committed=5 (authoritative for API payloads).
        return status is "4" or "5";
    }

    public static bool IsTerminalFailure(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return false;

        if (string.Equals(status, "Failed", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "FailedPartial", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "ExecutionCompletedQualityRejected", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Contracts: Failed=6, ExecutionCompletedQualityRejected=8, FailedPartial=10.
        return status is "6" or "8" or "10";
    }

    public static string? ReadManifestVersion(JsonElement commitOrDetail)
    {
        if (commitOrDetail.TryGetProperty("manifest", out JsonElement manifest) &&
            manifest.TryGetProperty("metadata", out JsonElement metadata) &&
            metadata.TryGetProperty("manifestVersion", out JsonElement versionEl))
        {
            return versionEl.GetString();
        }

        if (commitOrDetail.TryGetProperty("run", out JsonElement run) &&
            run.TryGetProperty("currentManifestVersion", out JsonElement current))
        {
            return current.GetString();
        }

        return null;
    }

    public static string? ReadApprovalRequestId(JsonElement approval)
    {
        if (approval.TryGetProperty("approvalRequestId", out JsonElement idEl))
            return idEl.GetString();

        return null;
    }
}
