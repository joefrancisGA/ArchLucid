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
            conditions.Add(
                "LOWER(LTRIM(RTRIM(ComparisonType))) = LOWER(@ComparisonType)");
            parameters.Add("@ComparisonType", comparisonType.Trim());
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
            conditions.Add(
                "LOWER(LTRIM(RTRIM(LeftExportRecordId))) = LOWER(@LeftExportRecordId)");
            parameters.Add("@LeftExportRecordId", normalizedLeftExportRecordId);
        }

        if (!string.IsNullOrWhiteSpace(rightExportRecordId))
        {
            string normalizedRightExportRecordId =
                ComparisonExportRecordIdLookup.NormalizeLookupKey(rightExportRecordId);
            conditions.Add(
                "LOWER(LTRIM(RTRIM(RightExportRecordId))) = LOWER(@RightExportRecordId)");
            parameters.Add("@RightExportRecordId", normalizedRightExportRecordId);
        }

        if (!string.IsNullOrWhiteSpace(label))
        {
            conditions.Add("LOWER(LTRIM(RTRIM(Label))) = LOWER(@Label)");
            parameters.Add("@Label", label.Trim());
        }

        if (tags is not { Count: > 0 })
            return;

        for (int i = 0; i < tags.Count; i++)
        {
            string t = tags[i];
            if (string.IsNullOrWhiteSpace(t))
                continue;
            string paramName = $"@Tag{i}";
            parameters.Add(paramName, t.Trim());
            conditions.Add(
                $"EXISTS (SELECT 1 FROM OPENJSON(ISNULL(Tags, '[]')) AS t WHERE LOWER(LTRIM(RTRIM(t.value))) = LOWER({paramName}))");
        }
    }
}
