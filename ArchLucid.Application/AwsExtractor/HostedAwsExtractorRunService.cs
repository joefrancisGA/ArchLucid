using System.Text.Json;

using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.CloudInventoryExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Http;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AwsExtractor;

public interface IHostedAwsExtractorRunService
{
    Task<HostedAwsExtractorRunResult> RunAsync(
        Guid tenantId,
        Guid connectionId,
        Guid? runId,
        string actorId,
        string? correlationId,
        CancellationToken cancellationToken);
}

public sealed class HostedAwsExtractorRunService(
    ITenantAwsConnectionRepository connectionRepository,
    IHostedAwsExtractorClient hostedClient,
    ICloudInventoryExtractorIngestService ingestService,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IOptionsMonitor<HostedAwsExtractorOptions> optionsMonitor) : IHostedAwsExtractorRunService
{
    private readonly ITenantAwsConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly IHostedAwsExtractorClient _hostedClient =
        hostedClient ?? throw new ArgumentNullException(nameof(hostedClient));

    private readonly ICloudInventoryExtractorIngestService _ingestService =
        ingestService ?? throw new ArgumentNullException(nameof(ingestService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptionsMonitor<HostedAwsExtractorOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public async Task<HostedAwsExtractorRunResult> RunAsync(
        Guid tenantId,
        Guid connectionId,
        Guid? runId,
        string actorId,
        string? correlationId,
        CancellationToken cancellationToken)
    {
        if (!_optionsMonitor.CurrentValue.Enabled)
            return HostedAwsExtractorRunResult.CreateFeatureDisabled();

        TenantAwsConnectionRecord? connection = await _connectionRepository
            .TryGetAsync(tenantId, connectionId, cancellationToken)
            .ConfigureAwait(false);

        if (connection is null || connection.Status == AwsConnectionStatus.Disconnected)
            return HostedAwsExtractorRunResult.CreateNotConfigured();

        await _connectionRepository
            .UpdateStatusAsync(
                tenantId,
                connectionId,
                AwsConnectionStatus.Polling,
                connection.LastPolledUtc,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        HostedAwsExtractorCollectionResult collection;

        try
        {
            collection = await _hostedClient
                .CollectZipAsync(
                    new HostedAwsExtractorCollectionRequest
                    {
                        AccountId = connection.AccountId,
                        Region = connection.Region,
                        RoleArn = connection.RoleArn
                    },
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception ex) when (HostedAwsExtractorFailureClassifier.IsThrottled(ex))
        {
            await MarkErrorAsync(tenantId, connectionId, actorId, cancellationToken).ConfigureAwait(false);

            return HostedAwsExtractorRunResult.CreateThrottled(
                HostedAwsExtractorFailureClassifier.Describe(ex));
        }
        catch (Exception ex)
        {
            await MarkErrorAsync(tenantId, connectionId, actorId, cancellationToken).ConfigureAwait(false);

            return HostedAwsExtractorRunResult.CreateCollectionFailed(
                HostedAwsExtractorFailureClassifier.Describe(ex));
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
                CloudProvider.Aws,
                formFile,
                runId,
                cancellationToken,
                correlationId)
            .ConfigureAwait(false);

        if (!ingestResult.Succeeded)
        {
            await MarkErrorAsync(tenantId, connectionId, actorId, cancellationToken).ConfigureAwait(false);

            return HostedAwsExtractorRunResult.CreateIngestFailed(
                ingestResult.FailureDetail ?? "Hosted AWS extractor ingest failed.");
        }

        DateTimeOffset polledUtc = TimeProvider.System.GetUtcNow();

        await _connectionRepository
            .UpdateStatusAsync(
                tenantId,
                connectionId,
                AwsConnectionStatus.Connected,
                polledUtc,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudConnectionAwsPolled,
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
                        connection.AccountId,
                        connection.Region,
                        packageId = ingestResult.PackageId,
                        resourceCount = collection.ResourceCount
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken).ConfigureAwait(false);

        return HostedAwsExtractorRunResult.CreateSuccess(
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
            AwsConnectionStatus.Error,
            null,
            actorId,
            cancellationToken);
}
