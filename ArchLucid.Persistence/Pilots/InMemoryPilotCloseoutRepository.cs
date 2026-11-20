using ArchLucid.Core.Pilots;

namespace ArchLucid.Persistence.Pilots;

public sealed class InMemoryPilotCloseoutRepository : IPilotCloseoutRepository
{
    public Task InsertAsync(PilotCloseoutRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }
}
