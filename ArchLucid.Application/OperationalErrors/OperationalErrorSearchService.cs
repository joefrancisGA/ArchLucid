using ArchLucid.Core.OperationalErrors;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.OperationalErrors;

/// <summary>Validates search parameters and delegates to the operational error repository.</summary>
public sealed class OperationalErrorSearchService(
    IOperationalErrorRepository repository,
    IOptionsMonitor<OperationalErrorOptions> options)
{
    private readonly IOperationalErrorRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IOptionsMonitor<OperationalErrorOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    public Task<IReadOnlyList<OperationalErrorRecord>> SearchAsync(
        OperationalErrorSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(criteria);

        OperationalErrorOptions opts = _options.CurrentValue;
        criteria.MaxRows = Math.Clamp(criteria.MaxRows, 1, opts.MaxRowsPerSearch);

        if (criteria.FromUtc is not null && criteria.ToUtc is not null && criteria.FromUtc >= criteria.ToUtc)
            throw new ArgumentException("fromUtc must be before toUtc.");

        return _repository.SearchAsync(criteria, cancellationToken);
    }

    public Task<OperationalErrorRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        _repository.GetByIdAsync(id, cancellationToken);
}
