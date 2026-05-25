namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     One child table whose <see cref="ColumnName" /> should reference <c>dbo.Runs</c>.
/// </summary>
/// <param name="TableName"><c>dbo</c> table name without schema.</param>
/// <param name="ColumnName">Foreign-key column referencing <c>dbo.Runs.RunId</c>.</param>
/// <param name="IsBackgroundProbed">
///     When true, <see cref="DataConsistencyOrphanProbeExecutor" /> counts orphans on each probe pass.
/// </param>
/// <param name="SqlConstantName">
///     Public const name on <see cref="DataConsistencyOrphanProbeSql" /> when <paramref name="IsBackgroundProbed" /> is true.
/// </param>
/// <param name="OptOutRationale">
///     Required when <paramref name="IsBackgroundProbed" /> is false — explains why background probing is deferred.
/// </param>
public sealed record DataConsistencyOrphanProbeRegistration(
    string TableName,
    string ColumnName,
    bool IsBackgroundProbed,
    string? SqlConstantName = null,
    string? OptOutRationale = null);
