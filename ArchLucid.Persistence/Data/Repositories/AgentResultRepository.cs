using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed partial class AgentResultRepository(
    IDbConnectionFactory connectionFactory,
    IAgentResultEnrichmentRepository agentResultEnrichmentRepository) : IAgentResultRepository
{
    private readonly IAgentResultEnrichmentRepository _agentResultEnrichmentRepository =
        agentResultEnrichmentRepository ?? throw new ArgumentNullException(nameof(agentResultEnrichmentRepository));
}
