using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Shared WHERE clauses and parameters for comparison record search (skip vs cursor paging).
/// </summary>
internal static class ComparisonRecordSearchPredicateBuilder
{
    public static void AppendFilters(
        List<string> conditions,
        DynamicParameters parameters,
        string? comparisonType,
        string? leftRunId,
        string? rightRunId,
        DateTime? createdFromUtc,
        DateTime? createdToUtc,
        string? leftExportRecordId,
        string? rightExportRecordId,
        string? label,
        IReadOnlyList<string>? tags)
    {
        if (!string.IsNullOrWhiteSpace(comparisonType))
        {
            conditions.Add("ComparisonType = @ComparisonType");
            parameters.Add("@ComparisonType", comparisonType);
        }

        if (!string.IsNullOrWhiteSpace(leftRunId))
        {
            Guid? leftGuid = ComparisonRecordRunIdSql.ToNullableSqlGuid(leftRunId);
            if (leftGuid is null)
            {
                conditions.Add("1 = 0");
            }
            else
            {
                conditions.Add("LeftRunId = @LeftRunId");
                parameters.Add("@LeftRunId", leftGuid.Value);
            }
        }

        if (!string.IsNullOrWhiteSpace(rightRunId))
        {
            Guid? rightGuid = ComparisonRecordRunIdSql.ToNullableSqlGuid(rightRunId);
            if (rightGuid is null)
            {
                conditions.Add("1 = 0");
            }
            else
            {
                conditions.Add("RightRunId = @RightRunId");
                parameters.Add("@RightRunId", rightGuid.Value);
            }
        }

        if (createdFromUtc is not null)
        {
            conditions.Add("CreatedUtc >= @CreatedFromUtc");
            parameters.Add("@CreatedFromUtc", createdFromUtc);
        }

        if (createdToUtc is not null)
        {
            conditions.Add("CreatedUtc <= @CreatedToUtc");
            parameters.Add("@CreatedToUtc", createdToUtc);
        }

        if (!string.IsNullOrWhiteSpace(leftExportRecordId))
        {
            string normalizedLeftExportRecordId =
                ComparisonExportRecordIdLookup.NormalizeLookupKey(leftExportRecordId);
            conditions.Add("LTRIM(RTRIM(LeftExportRecordId)) = @LeftExportRecordId");
            parameters.Add("@LeftExportRecordId", normalizedLeftExportRecordId);
        }

        if (!string.IsNullOrWhiteSpace(rightExportRecordId))
        {
            string normalizedRightExportRecordId =
                ComparisonExportRecordIdLookup.NormalizeLookupKey(rightExportRecordId);
            conditions.Add("LTRIM(RTRIM(RightExportRecordId)) = @RightExportRecordId");
            parameters.Add("@RightExportRecordId", normalizedRightExportRecordId);
        }

        if (!string.IsNullOrWhiteSpace(label))
        {
            conditions.Add("Label = @Label");
            parameters.Add("@Label", label);
        }

        if (tags is not { Count: > 0 })
            return;

        for (int i = 0; i < tags.Count; i++)
        {
            string t = tags[i];
            if (string.IsNullOrWhiteSpace(t))
                continue;
            string paramName = $"@Tag{i}";
            parameters.Add(paramName, t);
            conditions.Add(
                $"EXISTS (SELECT 1 FROM OPENJSON(ISNULL(Tags, '[]')) AS t WHERE t.value = {paramName})");
        }
    }
}
