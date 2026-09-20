using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationPrioritizationRepository
{
    Task<RemediationPrioritizationWeightsRecord?> TryGetWeightsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task UpsertWeightsAsync(
        RemediationPrioritizationWeightsRecord weights,
        CancellationToken cancellationToken = default);

    Task UpsertScoreAsync(
        RemediationPrioritizationScoreRecord score,
        CancellationToken cancellationToken = default);

    Task UpsertScoreInScopeAsync(
        ProjectScopeKey scope,
        RemediationPrioritizationScoreMutation mutation,
        CancellationToken cancellationToken = default) =>
        UpsertScoreAsync(
            new RemediationPrioritizationScoreRecord
            {
                FindingId = mutation.FindingId,
                TenantId = scope.TenantId,
                TotalScore = mutation.TotalScore,
                BreakdownJson = mutation.BreakdownJson,
                ExplanationSummary = mutation.ExplanationSummary,
                RuleVersion = mutation.RuleVersion,
                ComputedUtc = mutation.ComputedUtc,
            },
            cancellationToken);

    Task<RemediationPrioritizationScoreRecord?> TryGetScoreAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPrioritizationScoreRecord>> ListScoresByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationPrioritizationScoreRecord>> ListScoresByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default) =>
        ListScoresByTenantAsync(scope.TenantId, cancellationToken);
}


public sealed record RemediationPrioritizationScoreMutation
{
    public required Guid FindingId { get; init; }
    public required decimal TotalScore { get; init; }
    public required string BreakdownJson { get; init; }
    public required string ExplanationSummary { get; init; }
    public required string RuleVersion { get; init; }
    public required DateTime ComputedUtc { get; init; }
}
