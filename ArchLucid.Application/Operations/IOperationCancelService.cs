using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Operations;

/// <summary>Accepts cancel requests for unified long-running operations (TB-2076).</summary>
public interface IOperationCancelService
{
    /// <summary>
    ///     Requests cooperative cancel for <paramref name="operationId" /> in <paramref name="scope" />.
    /// </summary>
    /// <exception cref="ConflictException">When the operation is already terminal.</exception>
    Task<OperationDetail> RequestCancelAsync(
        string operationId,
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}
