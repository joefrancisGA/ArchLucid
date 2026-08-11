using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     Guards stable TVP insert shapes for finding child rows (TB-2164).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingChildInsertQueryShapeTests
{
    private static readonly string[] FindingChildInsertShapes =
    [
        FindingChildInsertQueryShapes.RelatedNodesInsert,
        FindingChildInsertQueryShapes.RecommendedActionsInsert,
        FindingChildInsertQueryShapes.PropertiesInsert,
        FindingChildInsertQueryShapes.TraceGraphNodesExaminedInsert,
        FindingChildInsertQueryShapes.TraceRulesAppliedInsert,
        FindingChildInsertQueryShapes.TraceDecisionsTakenInsert,
        FindingChildInsertQueryShapes.TraceAlternativePathsInsert,
        FindingChildInsertQueryShapes.TraceNotesInsert,
    ];

    [SkippableTheory]
    [MemberData(nameof(FindingChildInsertShapesMemberData))]
    public void Finding_child_insert_shapes_use_table_valued_parameter_select(string sql)
    {
        sql.Should().Contain("FROM @Rows AS src");
        sql.Should().Contain("@FindingRecordId");
        sql.Should().Contain("@TenantId");
        sql.Should().Contain("@WorkspaceId");
        sql.Should().Contain("@ProjectId");
        sql.Should().NotContain("VALUES");
    }

    public static IEnumerable<object[]> FindingChildInsertShapesMemberData()
    {
        foreach (string sql in FindingChildInsertShapes)
        {
            yield return [sql];
        }
    }
}
