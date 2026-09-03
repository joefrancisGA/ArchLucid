using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperUsageEventRepository(ISqlConnectionFactory connectionFactory) : IUsageEventRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
}
