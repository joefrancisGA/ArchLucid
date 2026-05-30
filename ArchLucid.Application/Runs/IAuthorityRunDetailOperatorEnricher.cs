using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Adds operator-facing fields to authority <see cref="RunDetailDto" /> (cost, trust, agent results) — TB-106.
/// </summary>
public interface IAuthorityRunDetailOperatorEnricher
{
    Task EnrichAsync(RunDetailDto detail, string? hostAgentExecutionMode, CancellationToken cancellationToken = default);
}
