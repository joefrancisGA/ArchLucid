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
///     Wave-4 suggestion 34: pins enabled policy pack ids on the run at create time.
/// </summary>
public interface IRunPolicyPackPinService
{
    Task<(string Json, byte[] HashSha256)> BuildPinAsync(ScopeContext scope, CancellationToken cancellationToken);

    Task ApplyToRunHeaderAsync(RunRecord header, ScopeContext scope, CancellationToken cancellationToken);
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

        string[] enabledPackIds = assignments
            .Where(static assignment => assignment.IsEnabled)
            .Select(static assignment => assignment.PolicyPackId.ToString("D"))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static id => id, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        string json = JsonSerializer.Serialize(enabledPackIds, ContractJson.CamelCaseIgnoreNullCompact);
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
}
