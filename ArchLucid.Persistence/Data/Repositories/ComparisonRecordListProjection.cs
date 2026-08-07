using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Normalizes comparison list rows that omit <see cref="ComparisonRecord.PayloadJson"/> (TB-2057).</summary>
internal static class ComparisonRecordListProjection
{
    internal static IReadOnlyList<ComparisonRecord> MaterializeWithoutPayloadJson(IEnumerable<ComparisonRecord> rows)
    {
        List<ComparisonRecord> list = [];

        foreach (ComparisonRecord row in rows)
            list.Add(WithoutPayloadJson(row));

        return list;
    }

    internal static ComparisonRecord WithoutPayloadJson(ComparisonRecord row)
    {
        ComparisonRecordRunIdSql.NormalizeRunIdsForRead(row);

        return new ComparisonRecord
        {
            ComparisonRecordId = row.ComparisonRecordId,
            ComparisonType = row.ComparisonType,
            LeftRunId = row.LeftRunId,
            RightRunId = row.RightRunId,
            LeftManifestVersion = row.LeftManifestVersion,
            RightManifestVersion = row.RightManifestVersion,
            LeftExportRecordId = row.LeftExportRecordId,
            RightExportRecordId = row.RightExportRecordId,
            Format = row.Format,
            SummaryMarkdown = row.SummaryMarkdown,
            PayloadJson = string.Empty,
            Notes = row.Notes,
            CreatedUtc = row.CreatedUtc,
            Label = row.Label,
            Tags = [.. row.Tags]
        };
    }
}
