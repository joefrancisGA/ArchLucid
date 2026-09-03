using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-4 suggestion 34 / wave-5 suggestion 42: pins enabled policy pack ids and versions on the run at create time.
/// </summary>
public interface IRunPolicyPackPinService
{
    Task<(string Json, byte[] HashSha256)> BuildPinAsync(ScopeContext scope, CancellationToken cancellationToken);

    Task ApplyToRunHeaderAsync(RunRecord header, ScopeContext scope, CancellationToken cancellationToken);

    Task VerifyPinIntegrityOrThrowAsync(RunRecord header, ScopeContext scope, CancellationToken cancellationToken);
}

public sealed class RunPolicyPackPinService(IPolicyPackAssignmentRepository policyPackAssignmentRepository) : IRunPolicyPackPinService
{
    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    public async Task<(string Json, byte[] HashSha256)> BuildPinAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<PolicyPackAssignment> assignments = await _policyPackAssignmentRepository
            .ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        PinnedPolicyPackRow[] enabledRows = assignments
            .Where(static assignment => assignment.IsEnabled)
            .Select(static assignment => new PinnedPolicyPackRow(
                assignment.PolicyPackId.ToString("D"),
                assignment.PolicyPackVersion))
            .DistinctBy(static row => row.PolicyPackId, StringComparer.OrdinalIgnoreCase)
            .OrderBy(static row => row.PolicyPackId, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        string json = JsonSerializer.Serialize(enabledRows, ContractJson.CamelCaseIgnoreNullCompact);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(json));

        return (json, hash);
    }

    public async Task ApplyToRunHeaderAsync(
        RunRecord header,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);

        (string json, byte[] hash) = await BuildPinAsync(scope, cancellationToken).ConfigureAwait(false);
        header.PinnedPolicyPackIdsJson = json;
        header.PinnedPolicyPackIdsHashSha256 = hash;
    }

    public async Task VerifyPinIntegrityOrThrowAsync(
        RunRecord header,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentNullException.ThrowIfNull(scope);

        if (header.PinnedPolicyPackIdsHashSha256 is null || header.PinnedPolicyPackIdsHashSha256.Length == 0)
        {
            throw new ConflictException(
                "Commit blocked: run is missing a policy pack pin hash from create time.");
        }

        if (string.IsNullOrWhiteSpace(header.PinnedPolicyPackIdsJson))
        {
            throw new ConflictException(
                "Commit blocked: run has policy pack pin hash but is missing the create-time pin JSON.");
        }

        if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(header.PinnedPolicyPackIdsJson, out _))
        {
            throw new ConflictException(
                "Commit blocked: policy pack pin JSON is not a valid PinnedPolicyPackRow array.");
        }

        byte[] jsonHash = SHA256.HashData(Encoding.UTF8.GetBytes(header.PinnedPolicyPackIdsJson));

        if (!jsonHash.AsSpan().SequenceEqual(header.PinnedPolicyPackIdsHashSha256))
        {
            throw new ConflictException(
                "Commit blocked: policy pack pin JSON no longer matches the stored create-time pin hash.");
        }

        (_, byte[] rebuiltHash) = await BuildPinAsync(scope, cancellationToken).ConfigureAwait(false);

        if (!rebuiltHash.AsSpan().SequenceEqual(header.PinnedPolicyPackIdsHashSha256))
        {
            throw new ConflictException(
                "Commit blocked: policy pack pin drifted since run create (theory-in-force changed).");
        }
    }
}
