using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     SQL Server connectivity options under configuration section <c>SqlServer</c>.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class SqlServerOptions
{
    public const string SectionName = "SqlServer";

    /// <summary>Optional read replica for specific hot read paths.</summary>
    public SqlReadReplicaSettings ReadReplica
    {
        get;
        set;
    } = new();
}

/// <summary>Binding for <c>SqlServer:ReadReplica</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class SqlReadReplicaSettings
{
    /// <summary>
    ///     Azure SQL failover group <strong>read-only listener</strong> (secondary replica). Used for governance-resolution
    ///     and
    ///     golden-manifest lookup reads when set; also used for authority run lists when
    ///     <see cref="AuthorityRunListReadsConnectionString" /> is unset.
    /// </summary>
    public string? FailoverGroupReadOnlyListenerConnectionString
    {
        get;
        set;
    }

    /// <summary>
    ///     When set, authority run list reads prefer this connection over
    ///     <see cref="FailoverGroupReadOnlyListenerConnectionString" />.
    /// </summary>
    public string? AuthorityRunListReadsConnectionString
    {
        get;
        set;
    }
}
