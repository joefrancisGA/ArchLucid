using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Operations;

/// <summary>Projects background jobs and run pipeline state into the unified operation DTO (TB-2074).</summary>
public interface IOperationQueryService
{
  /// <summary>
  ///     Returns the operation when <paramref name="operationId" /> resolves in <paramref name="scope" />;
  ///     otherwise <see langword="null" /> (caller should respond 404).
  /// </summary>
  Task<OperationDetail?> GetAsync(
    string operationId,
    ScopeContext scope,
    CancellationToken cancellationToken = default);
}
