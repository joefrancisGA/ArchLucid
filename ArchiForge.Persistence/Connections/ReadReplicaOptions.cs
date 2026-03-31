namespace ArchiForge.Persistence.Connections;

/// <summary>
/// Optional read replica / read scale-out for specific hot read paths (see <see cref="IAuthorityRunListConnectionFactory"/>).
/// </summary>
public sealed class ReadReplicaOptions
{
    public const string SectionName = "SqlServer:ReadReplica";

    /// <summary>
    /// When set, <see cref="Repositories.SqlRunRepository.ListByProjectAsync"/> opens this connection instead of the primary.
    /// Must target a replica that is transactionally consistent enough for “recent runs” listings (acceptable lag documented per deployment).
    /// </summary>
    public string? AuthorityRunListReadsConnectionString { get; set; }
}
