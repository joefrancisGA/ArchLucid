using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Confluence;

/// <inheritdoc cref="IConfluenceFirstValueReportPublisher" />
public sealed class ConfluenceFirstValueReportPublisher(
    IRunRepository runRepository,
    FirstValueReportBuilder firstValueReportBuilder,
    ConfluenceCloudPublisherConnector publisherConnector,
    IOptionsMonitor<ConfluencePublishingOptions> options,
    ILogger<ConfluenceFirstValueReportPublisher> logger) : IConfluenceFirstValueReportPublisher
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly FirstValueReportBuilder _firstValueReportBuilder =
        firstValueReportBuilder ?? throw new ArgumentNullException(nameof(firstValueReportBuilder));

    private readonly ConfluenceCloudPublisherConnector _publisherConnector =
        publisherConnector ?? throw new ArgumentNullException(nameof(publisherConnector));

    private readonly IOptionsMonitor<ConfluencePublishingOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<ConfluenceFirstValueReportPublisher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<PublishOutcome> PublishFirstValueReportAsync(
        string runId,
        string apiBaseForLinks,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (string.IsNullOrWhiteSpace(apiBaseForLinks))
            throw new ArgumentException("API base for links is required.", nameof(apiBaseForLinks));

        ConfluencePublishingOptions o = _options.CurrentValue;

        if (!o.Enabled)
        {
            return new PublishOutcome(
                false,
                null,
                ConfluencePublishFailureReason.BadResponse,
                "Confluence publishing is disabled in configuration.");
        }

        if (!TryParseRunKey(runId, out Guid runGuid))
        {
            return new PublishOutcome(
                false,
                null,
                ConfluencePublishFailureReason.BadResponse,
                "Run id must be a 32-character hex GUID.");
        }

        RunRecord? record = await _runRepository
            .GetByRunIdAdminAsync(runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (record is null)
        {
            return new PublishOutcome(
                false,
                null,
                ConfluencePublishFailureReason.NotFound,
                "Run was not found (or is archived).");
        }

        ScopeContext scope = new()
        {
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ProjectId = record.ScopeProjectId
        };

        string normalizedRunId = runGuid.ToString("N");
        string baseUrl = apiBaseForLinks.Trim().TrimEnd('/');

        string? markdown;

        using (AmbientScopeContext.Push(scope))
        {
            markdown = await _firstValueReportBuilder
                .BuildMarkdownAsync(normalizedRunId, baseUrl, cancellationToken)
                .ConfigureAwait(false);
        }

        if (markdown is null)
        {
            return new PublishOutcome(
                false,
                null,
                ConfluencePublishFailureReason.NotFound,
                "First-value report could not be built for this run.");
        }

        string title = $"ArchLucid first value — {normalizedRunId}";

        PublishRequest request = new(
            record.TenantId,
            record.WorkspaceId,
            record.ScopeProjectId,
            TargetId: runGuid,
            runGuid,
            ManifestVersion: record.CurrentManifestVersion ?? string.Empty,
            DiffBadgeStateLabel: string.Empty,
            PayloadJson: markdown,
            PageTitle: title,
            ExistingConfluencePageId: null);

        PublishOutcome outcome =
            await _publisherConnector.PublishAsync(request, cancellationToken).ConfigureAwait(false);

        if (outcome.Succeeded && _logger.IsEnabled(LogLevel.Information))

            _logger.LogInformation(
                "Published first-value report for run {RunId} to Confluence page {PageId}.",
                normalizedRunId,
                outcome.ExternalPageId);

        return outcome;
    }

    private static bool TryParseRunKey(string runId, out Guid guid)
    {
        ReadOnlySpan<char> s = runId.AsSpan().Trim();

        if (s.Length is 32 &&
            Guid.TryParseExact(s, "N", out guid))

            return true;

        return Guid.TryParse(runId, out guid);
    }
}
