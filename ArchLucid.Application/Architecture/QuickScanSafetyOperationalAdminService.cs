using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Architecture;

/// <summary>Admin mutations for Quick Scan runtime safety override (TB-898).</summary>
public interface IQuickScanSafetyOperationalAdminService
{
    Task<AdminQuickScanSafetySnapshotResponse> GetSnapshotAsync(CancellationToken cancellationToken = default);

    Task<AdminQuickScanSafetySnapshotResponse> SetOverrideAsync(
        AdminQuickScanSafetyUpdateRequest request,
        string actorUserId,
        CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IQuickScanSafetyOperationalAdminService" />
public sealed class QuickScanSafetyOperationalAdminService(
    IQuickScanSafetyOperationalStateProvider operationalStateProvider,
    IQuickScanSafetyOperationalStateStore store,
    TimeProvider timeProvider) : IQuickScanSafetyOperationalAdminService
{
    private readonly IQuickScanSafetyOperationalStateProvider _operationalStateProvider =
        operationalStateProvider ?? throw new ArgumentNullException(nameof(operationalStateProvider));

    private readonly IQuickScanSafetyOperationalStateStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task<AdminQuickScanSafetySnapshotResponse> GetSnapshotAsync(CancellationToken cancellationToken = default)
    {
        QuickScanSafetyOperationalSnapshot snapshot =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        QuickScanSafetyOperationalOverrideRow? row =
            await _store.GetOverrideAsync(cancellationToken).ConfigureAwait(false);

        return Map(snapshot, row);
    }

    /// <inheritdoc />
    public async Task<AdminQuickScanSafetySnapshotResponse> SetOverrideAsync(
        AdminQuickScanSafetyUpdateRequest request,
        string actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ArgumentException("Reason is required.", nameof(request));
        }

        QuickScanSafetyOperationalMode mode = ParseMode(request.OperationalMode);

        QuickScanSafetyOperationalOverrideWriteRequest writeRequest = new()
        {
            Mode = mode,
            PublicMessage = request.PublicMessage?.Trim() ?? string.Empty,
            Reason = request.Reason.Trim(),
            ActorUserId = actorUserId,
            UpdatedUtc = _timeProvider.GetUtcNow(),
        };

        await _store.SetOverrideAsync(writeRequest, cancellationToken).ConfigureAwait(false);

        _operationalStateProvider.InvalidateCache();

        QuickScanSafetyOperationalSnapshot snapshot =
            await _operationalStateProvider.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        QuickScanSafetyOperationalOverrideRow? row =
            await _store.GetOverrideAsync(cancellationToken).ConfigureAwait(false);

        return Map(snapshot, row);
    }

    private static AdminQuickScanSafetySnapshotResponse Map(
        QuickScanSafetyOperationalSnapshot snapshot,
        QuickScanSafetyOperationalOverrideRow? row) =>
        new()
        {
            OperationalMode = snapshot.Mode.ToString(),
            AnonymousExecutionAllowed = snapshot.AnonymousExecutionAllowed,
            SampleResultAvailable = snapshot.SampleResultAvailable,
            PublicMessage = snapshot.PublicMessage,
            Reason = row?.Reason ?? string.Empty,
            ActorUserId = row?.ActorUserId ?? string.Empty,
            UpdatedUtc = row?.UpdatedUtc,
            StoreHealthy = snapshot.StoreHealthy,
        };

    private static QuickScanSafetyOperationalMode ParseMode(string value)
    {
        if (!Enum.TryParse(value, ignoreCase: true, out QuickScanSafetyOperationalMode mode))
        {
            throw new ArgumentException($"Unknown operational mode '{value}'.", nameof(value));
        }

        return mode;
    }
}

/// <summary>Audit payload helper for Quick Scan safety override mutations.</summary>
public static class QuickScanSafetyOperationalAuditSerializer
{
    public static string SerializeChange(
        QuickScanSafetyOperationalMode previousMode,
        QuickScanSafetyOperationalMode newMode,
        string reason,
        string actorUserId) =>
        JsonSerializer.Serialize(
            new
            {
                previousMode = previousMode.ToString(),
                newMode = newMode.ToString(),
                reason,
                actorUserId,
            },
            AuditJsonSerializationOptions.Instance);
}
