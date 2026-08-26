using System.Data;
using ArchLucid.Core.Tenancy;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>Dapper implementation over <c>dbo.IntegrationEventOutbox</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.")]
public sealed partial class DapperIntegrationEventOutboxRepository(ISqlConnectionFactory connectionFactory)
    : IIntegrationEventOutboxRepository
{
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local", Justification = "Dapper materialization.")]
    private sealed class IntegrationEventOutboxRow
    {
        public Guid OutboxId
        {
            get; init;
        }

        public Guid? RunId
        {
            get; init;
        }

        public string? EventType
        {
            get; init;
        }

        public string? MessageId
        {
            get; init;
        }

        public byte[]? PayloadUtf8
        {
            get; init;
        }

        public Guid TenantId
        {
            get; init;
        }

        public Guid WorkspaceId
        {
            get; init;
        }

        public Guid ProjectId
        {
            get; init;
        }

        public DateTime CreatedUtc
        {
            get; init;
        }

        public int? Priority
        {
            get; init;
        }

        public int RetryCount
        {
            get; init;
        }

        public DateTime? NextRetryUtc
        {
            get; init;
        }

        public string? LastErrorMessage
        {
            get; init;
        }

        public DateTime? DeadLetteredUtc
        {
            get; init;
        }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local", Justification = "Dapper materialization.")]
    private sealed class DeadLetterRow
    {
        public Guid OutboxId
        {
            get; init;
        }

        public Guid? RunId
        {
            get; init;
        }

        public Guid TenantId
        {
            get; init;
        }

        public string? EventType
        {
            get; init;
        }

        public DateTime DeadLetteredUtc
        {
            get; init;
        }

        public int RetryCount
        {
            get; init;
        }

        public string? LastErrorMessage
        {
            get; init;
        }
    }
}
