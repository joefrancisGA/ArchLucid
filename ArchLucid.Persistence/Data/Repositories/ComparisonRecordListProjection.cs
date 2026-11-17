using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Repositories;

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
        ComparisonRecord materialized = ComparisonRecordRepositoryCore.Clone(row);
        ComparisonRecordPersistNormalizer.NormalizeForPersist(materialized);

        return new ComparisonRecord
        {
            ComparisonRecordId = materialized.ComparisonRecordId,
            ComparisonType = materialized.ComparisonType,
            LeftRunId = materialized.LeftRunId,
            RightRunId = materialized.RightRunId,
            LeftManifestVersion = materialized.LeftManifestVersion,
            RightManifestVersion = materialized.RightManifestVersion,
            LeftExportRecordId = materialized.LeftExportRecordId,
            RightExportRecordId = materialized.RightExportRecordId,
            Format = materialized.Format,
            SummaryMarkdown = materialized.SummaryMarkdown,
            PayloadJson = string.Empty,
            Notes = materialized.Notes,
            CreatedUtc = materialized.CreatedUtc,
            Label = materialized.Label,
            Tags = [.. materialized.Tags]
        };
    }
}
