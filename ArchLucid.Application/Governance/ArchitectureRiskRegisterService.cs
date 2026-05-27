using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Application.Governance;

public sealed class ArchitectureRiskRegisterService(IArchitectureRiskRegisterQuery reader) : IArchitectureRiskRegisterService
{
    private readonly IArchitectureRiskRegisterQuery _reader = reader ?? throw new ArgumentNullException(nameof(reader));

    public async Task<ArchitectureRiskRegisterResponse> GetRegisterAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<ArchitectureRiskRegisterEntry> entries =
            await _reader.ListAsync(tenantId, projectId, maxRows, cancellationToken);

        return new ArchitectureRiskRegisterResponse { Entries = entries };
    }
}
