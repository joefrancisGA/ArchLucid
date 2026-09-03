namespace ArchLucid.Persistence.Archival;

internal static class AgentTraceOrphanBlobPathParser
{
    internal const string AgentTracesContainer = "agent-traces";

    internal static bool TryParseRunPrefixFromBlobName(string blobName, out string runPrefix)
    {
        runPrefix = string.Empty;

        if (string.IsNullOrWhiteSpace(blobName))
            return false;

        string normalized = blobName.Replace("\\", "/", StringComparison.Ordinal).Trim('/');
        string[] segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length < 2)
            return false;

        if (!Guid.TryParse(segments[0], out _))
            return false;

        if (!Guid.TryParse(segments[1], out _))
            return false;

        runPrefix = $"{segments[0]}/{segments[1]}";

        return true;
    }

    internal static bool TryParseRunIdFromRunPrefix(string runPrefix, out Guid runId)
    {
        runId = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runPrefix))
            return false;

        string[] segments = runPrefix.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length < 2)
            return false;

        return Guid.TryParse(segments[1], out runId);
    }

    internal static bool TryParseRunPrefixFromLocalPath(string containerDir, string filePath, out string runPrefix)
    {
        runPrefix = string.Empty;

        string relative = Path.GetRelativePath(containerDir, filePath);
        string normalized = relative.Replace("\\", "/", StringComparison.Ordinal);
        string[] segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length < 3)
            return false;

        if (!Guid.TryParse(segments[0], out _))
            return false;

        if (!Guid.TryParse(segments[1], out _))
            return false;

        runPrefix = $"{segments[0]}/{segments[1]}";

        return true;
    }

    internal static string SanitizeFileToken(string segment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(segment);

        return segment.Replace("/", "_").Replace("\\", "_");
    }
}
