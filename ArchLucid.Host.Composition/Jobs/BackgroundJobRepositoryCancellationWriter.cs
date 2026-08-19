using ArchLucid.Application.Jobs;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Host.Composition.Jobs;

/// <summary>Durable worker hosts cancel via SQL without registering <see cref="Host.Core.Jobs.IBackgroundJobQueue"/>.</summary>
public sealed class BackgroundJobRepositoryCancellationWriter(IBackgroundJobRepository repository) : IBackgroundJobCancellationWriter
{
    private readonly IBackgroundJobRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public Task MarkCanceledAsync(string jobId, CancellationToken cancellationToken = default) =>
        _repository.MarkCanceledAsync(jobId, cancellationToken);
}
