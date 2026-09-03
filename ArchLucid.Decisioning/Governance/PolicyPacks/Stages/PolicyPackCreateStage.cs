using System.Text.Json;

using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Transactions;

namespace ArchLucid.Decisioning.Governance.PolicyPacks.Stages;

/// <inheritdoc cref="IPolicyPackCreateStage" />
public sealed class PolicyPackCreateStage(
    IPolicyPackRepository packRepository,
    IPolicyPackVersionRepository versionRepository,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IPolicyPackChangeLogAppender changeLogAppender) : IPolicyPackCreateStage
{
    private const string InitialVersion = "1.0.0";

    private readonly IPolicyPackRepository _packRepository =
        packRepository ?? throw new ArgumentNullException(nameof(packRepository));

    private readonly IPolicyPackVersionRepository _versionRepository =
        versionRepository ?? throw new ArgumentNullException(nameof(versionRepository));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IPolicyPackChangeLogAppender _changeLogAppender =
        changeLogAppender ?? throw new ArgumentNullException(nameof(changeLogAppender));

    public async Task<PolicyPack> CreatePackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string name,
        string description,
        string packType,
        string initialContentJson,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(packType);

        string distributionScope = PolicyPackDistributionScopeRules.ResolveForPackType(packType);
        PolicyPackDistributionScopeRules.RejectReservedScope(distributionScope);

        PolicyPack pack = new()
        {
            PolicyPackId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Name = name,
            Description = description,
            PackType = packType,
            DistributionScope = distributionScope,
            Status = PolicyPackStatus.Draft,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentVersion = InitialVersion,
        };

        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(ct);

        try
        {
            if (uow.SupportsExternalTransaction)
            {
                await _packRepository.CreateAsync(pack, ct, uow.Connection, uow.Transaction);

                await _versionRepository
                    .CreateAsync(
                        new PolicyPackVersion
                        {
                            PolicyPackVersionId = Guid.NewGuid(),
                            PolicyPackId = pack.PolicyPackId,
                            Version = InitialVersion,
                            ContentJson = string.IsNullOrWhiteSpace(initialContentJson) ? "{}" : initialContentJson,
                            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                            IsPublished = false,
                        },
                        ct,
                        uow.Connection,
                        uow.Transaction);
            }
            else
            {
                await _packRepository.CreateAsync(pack, ct);

                await _versionRepository
                    .CreateAsync(
                        new PolicyPackVersion
                        {
                            PolicyPackVersionId = Guid.NewGuid(),
                            PolicyPackId = pack.PolicyPackId,
                            Version = InitialVersion,
                            ContentJson = string.IsNullOrWhiteSpace(initialContentJson) ? "{}" : initialContentJson,
                            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                            IsPublished = false,
                        },
                        ct);
            }

            await uow.CommitAsync(ct);
        }
        catch
        {
            await uow.RollbackAsync(ct);
            throw;
        }

        string newValueJson = JsonSerializer.Serialize(
            new { name, description, packType, distributionScope = pack.DistributionScope, initialVersion = InitialVersion },
            PolicyPackChangeLogAppender.ChangeLogJsonOptions);

        await _changeLogAppender.AppendAsync(
            pack.PolicyPackId,
            pack.TenantId,
            pack.WorkspaceId,
            pack.ProjectId,
            PolicyPackChangeTypes.Created,
            "system",
            null,
            newValueJson,
            $"Policy pack '{name}' created with initial version {InitialVersion}.",
            ct);

        return pack;
    }
}
