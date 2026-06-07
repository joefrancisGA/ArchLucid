namespace ArchLucid.Core.Persistence;

/// <summary>
///     One evidence-anchor pointer on <c>dbo.Runs</c> whose target child row must belong to the same run.
/// </summary>
/// <param name="PointerColumnName">Header column on <c>dbo.Runs</c> holding the child primary key.</param>
/// <param name="ChildTableName"><c>dbo</c> child table name without schema.</param>
/// <param name="ChildPrimaryKeyColumn">Primary key column on the child table.</param>
/// <param name="ChildRunIdColumn">Run authority column on the child table.</param>
/// <param name="SqlConstantName">
///     Public const name on Host.Core <c>CommittedRunHeaderFkRepointProbeSql</c>.
/// </param>
public sealed record CommittedRunHeaderFkRepointRegistration(
    string PointerColumnName,
    string ChildTableName,
    string ChildPrimaryKeyColumn,
    string ChildRunIdColumn,
    string SqlConstantName);
