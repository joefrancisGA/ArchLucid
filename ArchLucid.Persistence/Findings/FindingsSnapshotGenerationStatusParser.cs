using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Maps <c>dbo.FindingsSnapshots.GenerationStatus</c> string rows to
///     <see cref="FindingsSnapshotGenerationStatus" />.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Thin parse wrapper.")]
internal static class FindingsSnapshotGenerationStatusParser
{
    internal static FindingsSnapshotGenerationStatus Parse(string? raw)
    {
        if (!string.IsNullOrWhiteSpace(raw) && Enum.TryParse(raw.Trim(), true, out FindingsSnapshotGenerationStatus st))
            return st;

        return FindingsSnapshotGenerationStatus.Complete;
    }
}
