using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance;

using ArchLucid.Core.Audit;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Pilots;

/// <inheritdoc cref="IPilotReportCardMetricsReader" />
[ExcludeFromCodeCoverage(Justification = "SQL-backed reader; exercised via integration workloads.")]
public sealed partial class DapperPilotReportCardMetricsReader(IReadOnlyDbConnectionFactory connectionFactory)
    : IPilotReportCardMetricsReader
{
    /// <remarks>
    ///     Durable exporter audit tails surfaced to sponsors/operators (subset excludes pure comparison bookkeeping rows).
    /// </remarks>
    private static readonly string[] ExportGeneratingAuditEvents =
    [
        AuditEventTypes.ArchitectureDocxExportGenerated,
        AuditEventTypes.RunExported,
        AuditEventTypes.ValueReportGenerated,
        AuditEventTypes.ReplayExportRecorded,
        AuditEventTypes.ArchitectureAnalysisReportGenerated
    ];

    private readonly IReadOnlyDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));
}
