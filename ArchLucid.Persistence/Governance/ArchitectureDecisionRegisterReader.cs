using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL projection for the architecture decision register (TB-060).</summary>
public sealed partial class ArchitectureDecisionRegisterReader(ISqlConnectionFactory connectionFactory)
    : IArchitectureDecisionRegisterQuery
{
}
