using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Alerts;

/// <summary>
/// Dapper implementation of <see cref="ICompositeAlertRuleRepository"/>; writes <c>dbo.CompositeAlertRules</c> and child condition rows in a transaction.
/// </summary>
/// <param name="connectionFactory">SQL connection factory (scoped in DI).</param>
/// <remarks>
/// List methods hydrate <see cref="CompositeAlertRule.Conditions"/> from <c>dbo.CompositeAlertRuleConditions</c>.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class DapperCompositeAlertRuleRepository(ISqlConnectionFactory connectionFactory)
    : ICompositeAlertRuleRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
}
