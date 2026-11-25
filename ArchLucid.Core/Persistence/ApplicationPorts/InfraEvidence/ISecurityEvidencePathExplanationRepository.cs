using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathExplanationRepository
{
    Task InsertAsync(SecurityEvidencePathExplanationRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathExplanationRecord>> ListByPathIdAsync(
        ScopeContext scope,
        Guid pathId,
        CancellationToken cancellationToken = default);

    /// <summary>Reads one latest observation per requested path, in the specified project and snapshot.</summary>
    Task<IReadOnlyList<SecurityEvidencePathVerificationRecord>> ListLatestVerificationByPathsAsync(
        ScopeContext scope,
        Guid snapshotId,
        IReadOnlyList<Guid> pathIds,
        CancellationToken cancellationToken = default);
}

public sealed record SecurityEvidencePathVerificationRecord(
    Guid PathId, Guid ExplanationId, DateTime RecordedUtc, InventoryFalsificationProbe Verification);

public interface ISecurityEvidencePathExplanationService
{
    Task<SecurityEvidencePathExplanationResult> TryBuildExplanationAsync(
        ScopeContext scope,
        Guid pathId,
        bool useSimulator,
        bool allowInsufficientEvidence,
        CancellationToken cancellationToken = default);
}

public sealed class SecurityEvidencePathExplanationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public SecurityEvidencePathExplanationRecord? Explanation
    {
        get;
        init;
    }
}
