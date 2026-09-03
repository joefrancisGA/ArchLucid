using ArchLucid.Core.Billing;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Billing;

public sealed partial class SqlBillingLedger(ISqlConnectionFactory connectionFactory) : IBillingLedger
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
}
