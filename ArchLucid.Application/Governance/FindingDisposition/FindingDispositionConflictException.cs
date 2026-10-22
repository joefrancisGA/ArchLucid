using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.FindingDisposition;

/// <summary>
///     Thrown when a disposition write lost the race to advance <c>dbo.FindingCurrentDispositions</c> (ADR 0076).
/// </summary>
public sealed class FindingDispositionConflictException : InvalidOperationException
{
    public FindingDispositionConflictException(string findingId, FindingDispositionConflictDetail currentDisposition)
        : base(BuildMessage(findingId, currentDisposition))
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);
        ArgumentNullException.ThrowIfNull(currentDisposition);
        FindingId = findingId.Trim();
        CurrentDisposition = currentDisposition;
    }

    public string FindingId
    {
        get;
    }

    public FindingDispositionConflictDetail CurrentDisposition
    {
        get;
    }

    private static string BuildMessage(string findingId, FindingDispositionConflictDetail currentDisposition)
    {
        return
            $"Finding '{findingId}' disposition was updated by another operator " +
            $"({currentDisposition.Disposition} at {currentDisposition.OccurredAtUtc:O}). Reload and retry or record a correction.";
    }
}
