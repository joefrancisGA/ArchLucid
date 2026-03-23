using ArchiForge.Persistence.Connections;

namespace ArchiForge.Persistence.Transactions;

/// <summary>
/// Opens a connection via <see cref="ISqlConnectionFactory"/> and begins a transaction for <see cref="DapperArchiForgeUnitOfWork"/>.
/// </summary>
public sealed class DapperArchiForgeUnitOfWorkFactory(ISqlConnectionFactory connectionFactory)
    : IArchiForgeUnitOfWorkFactory
{
    /// <inheritdoc />
    public async Task<IArchiForgeUnitOfWork> CreateAsync(CancellationToken ct)
    {
        var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        var transaction = connection.BeginTransaction();
        return new DapperArchiForgeUnitOfWork(connection, transaction);
    }
}
