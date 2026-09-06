using ArchLucid.Api.Services.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCaching;
using Microsoft.FeatureManagement;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AdminController
{
    /// <summary>Pending asynchronous authority and retrieval indexing work.</summary>
    [HttpGet("diagnostics/outboxes")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ProducesResponseType(typeof(AdminOutboxSnapshot), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOutboxes(CancellationToken cancellationToken = default)
    {
        AdminOutboxSnapshot snapshot = await _diagnostics.GetOutboxSnapshotAsync(cancellationToken);

        return Ok(snapshot);
    }

    /// <summary>SQL host leader lease holders (empty when InMemory storage or election disabled).</summary>
    [HttpGet("diagnostics/leases")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<HostLeaderLeaseSnapshot>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeases(CancellationToken cancellationToken = default)
    {
        IReadOnlyList<HostLeaderLeaseSnapshot> rows =
            await _diagnostics.GetLeasesAsync(cancellationToken);

        return Ok(rows);
    }

    /// <summary>Process-life cache hit/miss counters for operator observability.</summary>
    [HttpGet("diagnostics/caches")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(AdminCacheDiagnosticsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCacheDiagnostics(CancellationToken cancellationToken = default)
    {
        AdminCacheDiagnosticsResponse response =
            await _diagnostics.GetCacheDiagnosticsAsync(cancellationToken);

        return Ok(response);
    }

    /// <summary>Effective state of the async authority pipeline feature flag.</summary>
    [HttpGet("features/async-authority-pipeline")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ProducesResponseType(typeof(AsyncAuthorityPipelineFeatureState), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsyncAuthorityPipelineFeature(CancellationToken cancellationToken = default)
    {
        bool enabled =
            await _featureManager.IsEnabledAsync(AuthorityPipelineFeatureFlags.AsyncAuthorityPipeline,
                cancellationToken);

        return Ok(new AsyncAuthorityPipelineFeatureState(enabled));
    }

    /// <summary>Integration event outbox rows that exceeded publish retries (inspect before manual retry).</summary>
    [HttpGet("integration-outbox/dead-letters")]
    [Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<IntegrationEventOutboxDeadLetterRow>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListIntegrationOutboxDeadLetters(
        [FromQuery] int maxRows = 50,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<IntegrationEventOutboxDeadLetterRow> rows =
            await _diagnostics.ListIntegrationOutboxDeadLettersAsync(maxRows, cancellationToken);

        return Ok(rows);
    }
}
