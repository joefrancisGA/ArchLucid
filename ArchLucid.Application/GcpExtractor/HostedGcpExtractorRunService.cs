using System.Text.Json;

using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.GcpExtractor;

public interface IHostedGcpExtractorRunService
{
    Task<HostedGcpExtractorRunResult> RunAsync(
        Guid tenantId,
        Guid connectionId,
        Guid? runId,
        string actorId,
        string? correlationId,
        CancellationToken cancellationToken);
}

public sealed class HostedGcpExtractorRunService(
    ITenantGcpConnectionRepository connectionRepository,
    IHostedGcpExtractorClient hostedClient,
    ICloudInventoryExtractorIngestService ingestService,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IOptionsMonitor<HostedGcpExtractorOptions> optionsMonitor) : IHostedGcpExtractorRunService
{
    private readonly ITenantGcpConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly IHostedGcpExtractorClient _hostedClient =
        hostedClient ?? throw new ArgumentNullException(nameof(hostedClient));

    private readonly ICloudInventoryExtractorIngestService _ingestService =
        ingestService ?? throw new ArgumentNullException(nameof(ingestService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptionsMonitor<HostedGcpExtractorOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public async Task<HostedGcpExtractorRunResult> RunAsync(
        Guid tenantId,
        Guid connectionId,
        Guid? runId,
        string actorId,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        if (!_optionsMonitor.CurrentValue.Enabled)
            return HostedGcpExtractorRunResult.CreateFeatureDisabled();

        TenantGcpConnectionRecord? connection = await _connectionRepository
            .TryGetAsync(tenantId, connectionId, cancellationToken)
            .ConfigureAwait(false);

        if (connection is null || connection.Status == GcpConnectionStatus.Disconnected)
            return HostedGcpExtractorRunResult.CreateNotConfigured();

        await _connectionRepository
            .UpdateStatusAsync(
                tenantId,
                connectionId,
                GcpConnectionStatus.Polling,
                connection.LastPolledUtc,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        HostedGcpExtractorCollectionResult collection;

        try
        {
            collection = await _hostedClient
                .CollectZipAsync(
                    new HostedGcpExtractorCollectionRequest
                    {
                        ProjectId = connection.ProjectId,
                        WorkloadIdentityPoolProvider = connection.WorkloadIdentityPoolProvider,
                        ServiceAccountEmail = connection.ServiceAccountEmail
                    },
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (HostedGcpExtractorFailureClassifier.IsThrottled(ex))
        {
            await MarkErrorAsync(tenantId, connectionId, actorId, cancellationToken).ConfigureAwait(false);

            return HostedGcpExtractorRunResult.CreateThrottled(
                HostedGcpExtractorFailureClassifier.Describe(ex));
        }
        catch (Exception ex)
        {
            await MarkErrorAsync(tenantId, connectionId, actorId, cancellationToken).ConfigureAwait(false);

            return HostedGcpExtractorRunResult.CreateCollectionFailed(
                HostedGcpExtractorFailureClassifier.Describe(ex));
        }

        await using MemoryStream stream = new(collection.ZipBytes);

        FormFile formFile = new(
            stream,
            0,
            collection.ZipBytes.Length,
            "file",
            collection.OriginalFileName);

        CloudInventoryExtractorIngestResult ingestResult = await _ingestService
            .IngestZipAsync(
                CloudProvider.Gcp,
                formFile,
                runId,
                cancellationToken,
                correlationId)
            .ConfigureAwait(false);

        if (!ingestResult.Succeeded)
        {
            await MarkErrorAsync(tenantId, connectionId, actorId, cancellationToken).ConfigureAwait(false);

            return HostedGcpExtractorRunResult.CreateIngestFailed(
                ingestResult.FailureDetail ?? "Hosted GCP extractor ingest failed.");
        }

        DateTimeOffset polledUtc = TimeProvider.System.GetUtcNow();

        await _connectionRepository
            .UpdateStatusAsync(
                tenantId,
                connectionId,
                GcpConnectionStatus.Connected,
                polledUtc,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudConnectionGcpPolled,
                ActorUserId = actorId,
                ActorUserName = actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = correlationId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        connectionId,
                        connection.ProjectId,
                        packageId = ingestResult.PackageId,
                        resourceCount = collection.ResourceCount
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken).ConfigureAwait(false);

        return HostedGcpExtractorRunResult.CreateSuccess(
            ingestResult.PackageId!.Value,
            collection.ResourceCount);
    }

    private Task MarkErrorAsync(
        Guid tenantId,
        Guid connectionId,
        string actorId,
        CancellationToken cancellationToken) =>
        _connectionRepository.UpdateStatusAsync(
            tenantId,
            connectionId,
            GcpConnectionStatus.Error,
            null,
            actorId,
            cancellationToken);
}
