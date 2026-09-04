using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Value;

[ExcludeFromCodeCoverage(Justification = "SQL-backed reader; exercised via integration workloads.")]
public sealed partial class DapperValueReportMetricsReader(IReadOnlyDbConnectionFactory connectionFactory) : IValueReportMetricsReader
{
    private readonly IReadOnlyDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
}
