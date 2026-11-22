using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Tests.Sql;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTracePatchSqlTests
{
    [Fact]
    public void Patch_read_shapes_hold_an_update_lock_until_the_write_completes()
    {
        AgentExecutionTraceSql.SelectTraceJsonByTraceIdForUpdate.Should()
            .Contain("WITH (UPDLOCK, HOLDLOCK)");
        AgentExecutionTraceSql.SelectTraceJsonAndRecordedOutcomeByTraceIdForUpdate.Should()
            .Contain("WITH (UPDLOCK, HOLDLOCK)");
    }
}
