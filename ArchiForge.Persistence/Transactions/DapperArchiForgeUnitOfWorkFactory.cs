using ArchiForge.Persistence.Connections;

namespace ArchiForge.Persistence.Transactions;

public sealed class DapperArchiForgeUnitOfWorkFactory(ISqlConnectionFactory connectionFactory)
    : IArchiForgeUnitOfWorkFactory
{
    public async Task<IArchiForgeUnitOfWork> CreateAsync(CancellationToken ct)
    {
        var connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        var transaction = connection.BeginTransaction();
        return new DapperArchiForgeUnitOfWork(connection, transaction);
    }
}
