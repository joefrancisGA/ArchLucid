using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>Persists privacy-minimized Quick Scan usage rows (TB-899).</summary>
public interface IQuickScanUsageRecorder
{
    Task RecordAsync(QuickScanUsageRecord record, CancellationToken cancellationToken = default);
}

/// <inheritdoc cref="IQuickScanUsageRecorder" />
public sealed class QuickScanUsageRecorder(IQuickScanUsageRecordStore store) : IQuickScanUsageRecorder
{
    private readonly IQuickScanUsageRecordStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    /// <inheritdoc />
    public Task RecordAsync(QuickScanUsageRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        return _store.InsertAsync(record, cancellationToken);
    }

    /// <summary>Hashes caller identity for durable telemetry without storing raw values.</summary>
    public static string HashIdentity(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "empty";
        }

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).Substring(0, 12);
    }
}
