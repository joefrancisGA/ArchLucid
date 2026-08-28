using ArchLucid.Core.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL projection for the architecture risk register (TB-057).</summary>
public sealed partial class ArchitectureRiskRegisterReader(ISqlConnectionFactory connectionFactory)
    : IArchitectureRiskRegisterQuery
{
}
