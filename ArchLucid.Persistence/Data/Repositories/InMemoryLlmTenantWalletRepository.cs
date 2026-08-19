using System.Collections.Concurrent;

using ArchLucid.Core.Budgeting;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory <see cref="ILlmTenantWalletRepository" /> for non-SQL storage modes.</summary>
public sealed class InMemoryLlmTenantWalletRepository : ILlmTenantWalletRepository
{
    private sealed class Row
    {
        public decimal BalanceUsd;

        public bool AutoReplenishEnabled;

        public decimal RefillIncrementUsd = LlmTenantWalletDefaults.RefillIncrementUsd;

        public decimal RefillTriggerThresholdUsd = LlmTenantWalletDefaults.RefillTriggerThresholdUsd;

        public decimal MonthlyCapUsd;

        public int AutoRefillsThisUtcMonthCount;

        public int AutoRefillsThisUtcMonthYearMonth;

        public DateTimeOffset? LastRefillUtc;

        public string? StripeCustomerId;

        public string? StripePaymentMethodId;

        public long Version;

        public byte[] RowVersionBytes => BitConverter.GetBytes(Version);
    }

    private sealed class LedgerRow
    {
        public Guid TenantId { get; init; }

        public string EntryType { get; init; } = string.Empty;

        public decimal AmountUsd { get; init; }

        public decimal BalanceAfterUsd { get; init; }

        public string? StripePaymentIntentId { get; init; }

        public Guid CorrelationId { get; init; }
    }

    private readonly ConcurrentDictionary<Guid, Row> _rows = new();

    private readonly ConcurrentDictionary<Guid, object> _locks = new();

    private readonly ConcurrentDictionary<string, byte> _webhookIds = new(StringComparer.Ordinal);

    private readonly ConcurrentDictionary<string, byte> _paymentIntentIds = new(StringComparer.Ordinal);

    private readonly List<LedgerRow> _ledger = [];

    public Task<LlmTenantWalletStateReadModel> GetOrCreateAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        object gate = _locks.GetOrAdd(tenantId, _ => new object());

        lock (gate)
        {
            Row row = _rows.GetOrAdd(tenantId, _ => new Row());

            return Task.FromResult(Map(tenantId, row));
        }
    }

    public Task<LlmTenantWalletStateReadModel?> UpdateSettingsAsync(
        LlmTenantWalletUpdateSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        object gate = _locks.GetOrAdd(request.TenantId, _ => new object());

        lock (gate)
        {
            if (!_rows.TryGetValue(request.TenantId, out Row? row))
                return Task.FromResult<LlmTenantWalletStateReadModel?>(null);

            if (!RowVersionMatches(row, request.ExpectedRowVersion))
                return Task.FromResult<LlmTenantWalletStateReadModel?>(null);

            if (request.AutoReplenishEnabled.HasValue)
                row.AutoReplenishEnabled = request.AutoReplenishEnabled.Value;

            if (request.MonthlyCapUsd.HasValue)
                row.MonthlyCapUsd = request.MonthlyCapUsd.Value;

            if (request.StripeCustomerId is not null)
                row.StripeCustomerId = request.StripeCustomerId;

            if (request.StripePaymentMethodId is not null)
                row.StripePaymentMethodId = request.StripePaymentMethodId;

            row.Version++;

            return Task.FromResult<LlmTenantWalletStateReadModel?>(Map(request.TenantId, row));
        }
    }

    public Task<LlmTenantWalletConsumeResult> TryConsumeAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (amountUsd <= 0m)
            return Task.FromResult(LlmTenantWalletConsumeResult.Ok(0m));

        object gate = _locks.GetOrAdd(tenantId, _ => new object());

        lock (gate)
        {
            Row row = _rows.GetOrAdd(tenantId, _ => new Row());

            if (!RowVersionMatches(row, expectedRowVersion))
                return Task.FromResult(LlmTenantWalletConsumeResult.Conflict());

            if (row.BalanceUsd < amountUsd)
                return Task.FromResult(LlmTenantWalletConsumeResult.NotEnough());

            row.BalanceUsd = decimal.Round(row.BalanceUsd - amountUsd, 2, MidpointRounding.AwayFromZero);
            row.Version++;

            AppendLedger(tenantId, LlmTenantWalletLedgerEntryTypes.Consume, -amountUsd, row.BalanceUsd, null, correlationId);

            return Task.FromResult(LlmTenantWalletConsumeResult.Ok(row.BalanceUsd));
        }
    }

    public Task<LlmTenantWalletCreditResult> TryCreditRefillAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string? stripePaymentIntentId,
        int utcYearMonth,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (amountUsd <= 0m)
            return Task.FromResult(LlmTenantWalletCreditResult.Ok(0m));

        if (!string.IsNullOrWhiteSpace(stripePaymentIntentId) && _paymentIntentIds.ContainsKey(stripePaymentIntentId))
            return Task.FromResult(LlmTenantWalletCreditResult.Duplicate());

        object gate = _locks.GetOrAdd(tenantId, _ => new object());

        lock (gate)
        {
            Row row = _rows.GetOrAdd(tenantId, _ => new Row());

            if (!RowVersionMatches(row, expectedRowVersion))
                return Task.FromResult(LlmTenantWalletCreditResult.Conflict());

            if (row.AutoRefillsThisUtcMonthYearMonth != utcYearMonth)
            {
                row.AutoRefillsThisUtcMonthYearMonth = utcYearMonth;
                row.AutoRefillsThisUtcMonthCount = 0;
            }

            row.BalanceUsd = decimal.Round(row.BalanceUsd + amountUsd, 2, MidpointRounding.AwayFromZero);
            row.AutoRefillsThisUtcMonthCount++;
            row.LastRefillUtc = TimeProvider.System.GetUtcNow();
            row.Version++;

            AppendLedger(tenantId, LlmTenantWalletLedgerEntryTypes.Refill, amountUsd, row.BalanceUsd, stripePaymentIntentId, correlationId);

            if (!string.IsNullOrWhiteSpace(stripePaymentIntentId))
                _paymentIntentIds.TryAdd(stripePaymentIntentId, 0);

            return Task.FromResult(LlmTenantWalletCreditResult.Ok(row.BalanceUsd));
        }
    }

    public Task<bool> TryInsertStripeWebhookIdempotencyAsync(
        string stripeEventId,
        string eventType,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(_webhookIds.TryAdd(stripeEventId, 0));
    }

    public Task<bool> LedgerContainsPaymentIntentAsync(
        string stripePaymentIntentId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(_paymentIntentIds.ContainsKey(stripePaymentIntentId));
    }

    private void AppendLedger(
        Guid tenantId,
        string entryType,
        decimal amountUsd,
        decimal balanceAfterUsd,
        string? stripePaymentIntentId,
        Guid correlationId)
    {
        _ledger.Add(
            new LedgerRow
            {
                TenantId = tenantId,
                EntryType = entryType,
                AmountUsd = amountUsd,
                BalanceAfterUsd = balanceAfterUsd,
                StripePaymentIntentId = stripePaymentIntentId,
                CorrelationId = correlationId,
            });
    }

    private static bool RowVersionMatches(Row row, byte[] expectedRowVersion)
    {
        if (expectedRowVersion.Length == 0)
            return true;

        return row.RowVersionBytes.SequenceEqual(expectedRowVersion);
    }

    private static LlmTenantWalletStateReadModel Map(Guid tenantId, Row row)
    {
        return new LlmTenantWalletStateReadModel
        {
            TenantId = tenantId,
            BalanceUsd = row.BalanceUsd,
            AutoReplenishEnabled = row.AutoReplenishEnabled,
            RefillIncrementUsd = row.RefillIncrementUsd,
            RefillTriggerThresholdUsd = row.RefillTriggerThresholdUsd,
            MonthlyCapUsd = row.MonthlyCapUsd,
            AutoRefillsThisUtcMonthCount = row.AutoRefillsThisUtcMonthCount,
            AutoRefillsThisUtcMonthYearMonth = row.AutoRefillsThisUtcMonthYearMonth,
            LastRefillUtc = row.LastRefillUtc,
            StripeCustomerId = row.StripeCustomerId,
            StripePaymentMethodId = row.StripePaymentMethodId,
            RowVersion = row.RowVersionBytes,
        };
    }
}
