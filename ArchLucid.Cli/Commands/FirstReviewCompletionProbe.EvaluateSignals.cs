namespace ArchLucid.Cli.Commands;

internal static partial class FirstReviewCompletionProbe
{
    private static FirstReviewCompletionProbeResult EvaluateRunDetailSignal(
        FirstReviewCompletionRunDetailSignal signal,
        FirstReviewCompletionRunSnapshot snapshot)
    {
        if (signal.RequiredStatusValues.Count > 0)
        {
            bool matches = signal.RequiredStatusValues.Any(value =>
                string.Equals(snapshot.StatusRaw, value, StringComparison.OrdinalIgnoreCase));

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = matches,
                Detail = matches
                    ? $"status={snapshot.StatusRaw}"
                    : $"status={snapshot.StatusRaw}; expected one of [{string.Join(", ", signal.RequiredStatusValues)}]",
            };
        }

        if (signal.RequireManifestVersion)
        {
            bool hasManifest = !string.IsNullOrWhiteSpace(snapshot.CurrentManifestVersion);

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = hasManifest,
                Detail = hasManifest
                    ? $"manifestVersion={snapshot.CurrentManifestVersion}"
                    : "manifestVersion missing",
            };
        }

        if (signal.RequireRequestId)
        {
            bool hasRequest = !string.IsNullOrWhiteSpace(snapshot.RequestId);

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = hasRequest,
                Detail = hasRequest
                    ? $"requestId={snapshot.RequestId}"
                    : "requestId missing",
            };
        }

        if (signal.RequireAnyExecutionSignal)
        {
            bool hasSignals = snapshot.ResultCount > 0 || snapshot.TaskCount > 0 || snapshot.HasCompletedUtc;

            return new FirstReviewCompletionProbeResult
            {
                SignalId = signal.Id,
                Success = hasSignals,
                Detail =
                    $"taskCount={snapshot.TaskCount}; resultCount={snapshot.ResultCount}; completedUtc={(snapshot.HasCompletedUtc ? "present" : "missing")}",
            };
        }

        return new FirstReviewCompletionProbeResult
        {
            SignalId = signal.Id,
            Success = true,
            Detail = "no-op signal",
        };
    }
}
