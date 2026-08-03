using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

/// <inheritdoc cref="IQuickScanIdentityAbuseStore" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent store; concurrency covered via in-memory counterpart.")]
public sealed class DapperQuickScanIdentityAbuseStore(IDbConnectionFactory connectionFactory)
    : IQuickScanIdentityAbuseStore
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<QuickScanIdentityAbuseStoreAdmitResult> TryAdmitAsync(
        QuickScanIdentityAbuseStoreAdmitRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        DynamicParameters parameters = new();
        parameters.Add("@SessionHourKey", request.SessionHourKey);
        parameters.Add("@SessionDayKey", request.SessionDayKey);
        parameters.Add("@BrowserHourKey", request.BrowserHourKey);
        parameters.Add("@BrowserDayKey", request.BrowserDayKey);
        parameters.Add("@IpHourKey", request.IpHourKey);
        parameters.Add("@IpDayKey", request.IpDayKey);
        parameters.Add("@IpRangeHourKey", request.IpRangeHourKey);
        parameters.Add("@IpRangeDayKey", request.IpRangeDayKey);
        parameters.Add("@GlobalHourKey", request.GlobalHourKey);
        parameters.Add("@GlobalDayKey", request.GlobalDayKey);
        parameters.Add("@BurstMinuteKey", request.BurstMinuteKey);
        parameters.Add("@BurstFiveMinuteKey", request.BurstFiveMinuteKey);
        parameters.Add("@ContentHash", request.ContentHash);
        parameters.Add("@UtcNow", request.UtcNow.UtcDateTime);
        parameters.Add("@DuplicateWindowSeconds", request.DuplicateWindowSeconds);
        parameters.Add("@MaxSessionHour", request.MaxSessionHour);
        parameters.Add("@MaxSessionDay", request.MaxSessionDay);
        parameters.Add("@MaxBrowserHour", request.MaxBrowserHour);
        parameters.Add("@MaxBrowserDay", request.MaxBrowserDay);
        parameters.Add("@MaxIpHour", request.MaxIpHour);
        parameters.Add("@MaxIpDay", request.MaxIpDay);
        parameters.Add("@MaxIpRangeHour", request.MaxIpRangeHour);
        parameters.Add("@MaxIpRangeDay", request.MaxIpRangeDay);
        parameters.Add("@MaxGlobalHour", request.MaxGlobalHour);
        parameters.Add("@MaxGlobalDay", request.MaxGlobalDay);
        parameters.Add("@MaxBurstMinute", request.MaxBurstMinute);
        parameters.Add("@MaxBurstFiveMinutes", request.MaxBurstFiveMinutes);
        parameters.Add("@SignInAfterSessionScans", request.SignInAfterSessionScans);
        parameters.Add("@CaptchaAfterSessionScans", request.CaptchaAfterSessionScans);
        parameters.Add("@CaptchaSatisfied", request.CaptchaSatisfied);
        parameters.Add("@DryRun", request.DryRun);
        parameters.Add("@Outcome", dbType: DbType.Byte, direction: ParameterDirection.Output);

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                "dbo.usp_QuickScanIdentityAbuse_TryAdmit",
                parameters,
                commandType: CommandType.StoredProcedure,
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        byte outcome = parameters.Get<byte>("@Outcome");

        return outcome switch
        {
            0 => QuickScanIdentityAbuseStoreAdmitResult.Admitted(),
            2 => QuickScanIdentityAbuseStoreAdmitResult.Duplicate(),
            3 => QuickScanIdentityAbuseStoreAdmitResult.Suspicious(),
            4 => QuickScanIdentityAbuseStoreAdmitResult.SignInRequired(),
            5 => QuickScanIdentityAbuseStoreAdmitResult.CaptchaRequired(),
            _ => QuickScanIdentityAbuseStoreAdmitResult.RateLimited(),
        };
    }
}
