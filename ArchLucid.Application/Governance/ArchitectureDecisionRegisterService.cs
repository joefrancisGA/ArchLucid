using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Application.Governance;

public sealed class ArchitectureDecisionRegisterService(IArchitectureDecisionRegisterQuery reader)
    : IArchitectureDecisionRegisterService
{
    private readonly IArchitectureDecisionRegisterQuery _reader = reader ?? throw new ArgumentNullException(nameof(reader));

    public async Task<ArchitectureDecisionRegisterResponse> GetRegisterAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<ArchitectureDecisionRegisterEntry> decisions =
            await _reader.ListAsync(tenantId, projectId, maxRows, cancellationToken);

        return new ArchitectureDecisionRegisterResponse { Decisions = decisions };
    }
}
