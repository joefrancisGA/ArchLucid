using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Common;
using ArchLucid.Application.DataConsistency;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

internal static class AdminDiagnosticsServiceTestFactory
{
    internal static AdminDiagnosticsService Create(
        IDbConnectionFactory connectionFactory,
        IOptions<ArchLucidOptions> archLucidOptions,
        IAuditService auditService,
        IActorContext actorContext,
        IScopeContextProvider scopeContextProvider,
        ICacheTelemetrySnapshotProvider cacheTelemetrySnapshotProvider,
        IAdminOutboxSnapshotReader outboxSnapshotReader,
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IHostLeaderLeaseRepository hostLeaderLeases,
        IRunRepository runRepository)
    {
        IAdminRunArchiveAuditLogger archiveAuditLogger =
            new AdminRunArchiveAuditLogger(actorContext, auditService);

        IAdminIntegrationOutboxDiagnosticsService integrationOutboxDiagnostics =
            new AdminIntegrationOutboxDiagnosticsService(
                outboxSnapshotReader,
                integrationEventOutbox,
                scopeContextProvider,
                Options.Create(new IntegrationEventsOptions()),
                auditService);

        IDataConsistencyRemediationExecutor remediationExecutor =
            new DataConsistencyRemediationExecutor(connectionFactory, auditService);

        IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions> missingArchitectureOptions =
            MissingArchitectureRequestOptionsMonitor();

        IAdminDataConsistencyDiagnosticsService dataConsistencyDiagnostics =
            new AdminDataConsistencyDiagnosticsService(
                runRepository,
                connectionFactory,
                archLucidOptions,
                missingArchitectureOptions,
                remediationExecutor,
                archiveAuditLogger);

        IAdminRunArchiveDiagnosticsService runArchiveDiagnostics =
            new AdminRunArchiveDiagnosticsService(
                runRepository,
                scopeContextProvider,
                archiveAuditLogger);

        return new AdminDiagnosticsService(
            integrationOutboxDiagnostics,
            dataConsistencyDiagnostics,
            runArchiveDiagnostics,
            hostLeaderLeases,
            cacheTelemetrySnapshotProvider);
    }

    private static IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions>
        MissingArchitectureRequestOptionsMonitor()
    {
        Mock<IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new MissingArchitectureRequestAutoRemediationOptions());

        return monitor.Object;
    }
}
