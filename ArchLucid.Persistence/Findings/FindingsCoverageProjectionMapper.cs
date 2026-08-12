using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Findings;

/// <summary>
///     Maps the coverage projection rows (TB-930) onto <see cref="FindingsSnapshot" />. Coverage callers only need engine
///     and severity counts, so rationale and payloads are deliberately left empty rather than read from SQL.
/// </summary>
internal static class FindingsCoverageProjectionMapper
{
    public static FindingsSnapshot Map(
        FindingsCoverageHeaderRow header,
        IReadOnlyList<FindingsCoverageFindingRow> findingRows)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(findingRows);

        return new FindingsSnapshot
        {
            FindingsSnapshotId = header.FindingsSnapshotId,
            RunId = header.RunId,
            ContextSnapshotId = header.ContextSnapshotId,
            GraphSnapshotId = header.GraphSnapshotId,
            CreatedUtc = header.CreatedUtc,
            SchemaVersion = header.SchemaVersion,
            GenerationStatus = FindingsSnapshotGenerationStatusParser.Parse(header.GenerationStatus),
            EngineFailures = TryDeserializeEngineFailures(header.EngineFailuresJson),
            EvaluationConfidenceEnrichmentSkipped = header.EvaluationConfidenceEnrichmentSkipped ?? false,
            Findings = findingRows.Select(MapFinding).ToList(),
        };
    }

    /// <summary>
    ///     Soft-fails corrupt/partial <c>JSON_QUERY(...engineFailures)</c> so buyer-summary coverage never 500s.
    /// </summary>
    public static List<FindingEngineFailure> TryDeserializeEngineFailures(string? engineFailuresJson)
    {
        if (string.IsNullOrWhiteSpace(engineFailuresJson))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<FindingEngineFailure>>(engineFailuresJson) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }

    private static Finding MapFinding(FindingsCoverageFindingRow row) =>
        new()
        {
            FindingId = row.FindingId,
            FindingType = row.FindingType,
            Category = row.Category,
            EngineType = row.EngineType,
            Severity = ParseSeverity(row.Severity),
            Title = row.Title,
            Rationale = string.Empty,
            PolicyRuleId = string.IsNullOrWhiteSpace(row.PolicyRuleId) ? null : row.PolicyRuleId.Trim(),
        };

    /// <summary>Unknown persisted severity names degrade to <see cref="FindingSeverity.Info" /> instead of throwing.</summary>
    private static FindingSeverity ParseSeverity(string? severity) =>
        Enum.TryParse(severity, ignoreCase: true, out FindingSeverity parsed) ? parsed : FindingSeverity.Info;
}
