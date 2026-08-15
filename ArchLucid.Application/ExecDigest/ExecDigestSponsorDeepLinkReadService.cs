using System.Globalization;
using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Notifications;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.ExecDigest;

/// <inheritdoc cref="IExecDigestSponsorDeepLinkReadService" />
public sealed class ExecDigestSponsorDeepLinkReadService(
    IExecDigestSponsorDeepLinkTokenFactory tokenFactory,
    ITenantRepository tenantRepository,
    IExecDigestComposer execDigestComposer,
    IRunDetailQueryService runDetailQueryService,
    IRunSummaryOnePagerExportService runSummaryOnePagerExportService,
    IOptionsMonitor<EmailNotificationOptions> emailOptionsMonitor) : IExecDigestSponsorDeepLinkReadService
{
    private readonly IExecDigestComposer _execDigestComposer =
        execDigestComposer ?? throw new ArgumentNullException(nameof(execDigestComposer));

    private readonly IOptionsMonitor<EmailNotificationOptions> _emailOptionsMonitor =
        emailOptionsMonitor ?? throw new ArgumentNullException(nameof(emailOptionsMonitor));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IRunSummaryOnePagerExportService _runSummaryOnePagerExportService =
        runSummaryOnePagerExportService ?? throw new ArgumentNullException(nameof(runSummaryOnePagerExportService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IExecDigestSponsorDeepLinkTokenFactory _tokenFactory =
        tokenFactory ?? throw new ArgumentNullException(nameof(tokenFactory));

    /// <inheritdoc />
    public async Task<ExecDigestSponsorDeepLinkViewResponse?> TryLoadViewAsync(
        string token,
        string? expectedRunIdHex,
        CancellationToken cancellationToken)
    {
        if (!_tokenFactory.TryParse(token, out ExecDigestSponsorDeepLinkClaims claims))
            return null;

        if (claims.Target == ExecDigestSponsorDeepLinkTarget.RunCollateral)
        {
            if (string.IsNullOrWhiteSpace(claims.RunIdHex))
                return null;

            if (!string.IsNullOrWhiteSpace(expectedRunIdHex)
                && !string.Equals(
                    claims.RunIdHex,
                    NormalizeRunIdHex(expectedRunIdHex),
                    StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
        }

        TenantWorkspaceLink? workspace =
            await _tenantRepository.GetFirstWorkspaceAsync(claims.TenantId, cancellationToken).ConfigureAwait(false);

        if (workspace is null)
            return null;

        ScopeContext scope = new()
        {
            TenantId = claims.TenantId,
            WorkspaceId = workspace.WorkspaceId,
            ProjectId = workspace.DefaultProjectId,
        };

        (DateTime weekStartUtcInclusive, DateTime weekEndUtcExclusive) = ExecDigestIsoWeekRange.Parse(claims.IsoWeekKey);
        EmailNotificationOptions emailOptions = _emailOptionsMonitor.CurrentValue;
        string operatorBase = string.IsNullOrWhiteSpace(emailOptions.OperatorBaseUrl)
            ? "http://localhost:3000"
            : emailOptions.OperatorBaseUrl.Trim();
        string signInUrl = $"{operatorBase.TrimEnd('/')}/auth/sign-in";

        using (AmbientScopeContext.Push(scope))
        {
            if (claims.Target == ExecDigestSponsorDeepLinkTarget.Dashboard)
            {
                ExecDigestComposition composition = await _execDigestComposer.ComposeAsync(
                        claims.TenantId,
                        weekStartUtcInclusive,
                        weekEndUtcExclusive,
                        scope,
                        operatorBase,
                        cancellationToken)
                    .ConfigureAwait(false);

                return MapDashboard(composition, signInUrl);
            }

            ArchitectureRunDetail? detail =
                await _runDetailQueryService.GetRunDetailForRollupAsync(claims.RunIdHex!, cancellationToken)
                    .ConfigureAwait(false);

            if (detail is null || detail.Run.Status is not ArchitectureRunStatus.Committed)
                return null;

            RunSummaryOnePagerExportResult export =
                await _runSummaryOnePagerExportService.GenerateMarkdownAsync(claims.RunIdHex!, cancellationToken)
                    .ConfigureAwait(false);

            return new ExecDigestSponsorDeepLinkViewResponse
            {
                Target = "run-collateral",
                WeekLabel = FormatWeekLabel(weekStartUtcInclusive, weekEndUtcExclusive),
                RunIdHex = claims.RunIdHex,
                RunSummaryMarkdown = Encoding.UTF8.GetString(export.Content),
                SignInUrl = signInUrl,
            };
        }
    }

    private static ExecDigestSponsorDeepLinkViewResponse MapDashboard(
        ExecDigestComposition composition,
        string signInUrl)
    {
        return new ExecDigestSponsorDeepLinkViewResponse
        {
            Target = "dashboard",
            WeekLabel = composition.WeekLabel,
            CommittedManifestsInWeek = composition.CommittedManifestsInWeek,
            TopRuns = composition.TopManifestRuns
                .Select(static run => new ExecDigestSponsorDeepLinkHighlightedRunDto
                {
                    RunIdHex = run.RunIdHex,
                    SignificanceScore = run.SignificanceScore,
                    Caption = run.Caption,
                })
                .ToArray(),
            ComplianceDriftMarkdown = composition.ComplianceDriftMarkdown,
            FindingsDeltaSummary = composition.FindingsDeltaSummary,
            DecisionNeededMarkdown = composition.DecisionNeededMarkdown,
            SignInUrl = signInUrl,
        };
    }

    private static string FormatWeekLabel(DateTime startUtc, DateTime endUtc)
    {
        int isoYear = ISOWeek.GetYear(startUtc.Date);
        int isoWeek = ISOWeek.GetWeekOfYear(startUtc.Date);
        return $"{startUtc:yyyy-MM-dd}–{endUtc.AddTicks(-1):yyyy-MM-dd} UTC (ISO week {isoYear}-W{isoWeek:00})";
    }

    private static string NormalizeRunIdHex(string runIdHex)
    {
        return runIdHex.Trim().Replace("-", string.Empty, StringComparison.Ordinal).ToUpperInvariant();
    }
}
