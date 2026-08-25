using System.Data;
using System.Diagnostics.CodeAnalysis;
using System.Net;

using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

using Microsoft.Azure.Cosmos;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Cosmos-backed <see cref="IAuditRepository" />.</summary>
/// <remarks>
///     Implementation lives in <c>CosmosAuditRepository.{Query|Export}.cs</c> partials.
///     Filter SQL is <see cref="CosmosAuditFilterPredicateBuilder" />; document mapping is
///     <see cref="CosmosAuditDocumentMapper" />. The type remains one
///     <see cref="IAuditRepository" /> implementation and DI registration.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "Requires Cosmos account or emulator.")]
public sealed partial class CosmosAuditRepository(CosmosClientFactory clientFactory) : IAuditRepository
{
    private const string ContainerId = "audit-events";

    private readonly CosmosClientFactory _clientFactory =
        clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));

    /// <inheritdoc />
    public async Task AppendAsync(
        AuditEvent auditEvent,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = connection;
        _ = transaction;
        ArgumentNullException.ThrowIfNull(auditEvent);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, ct);
        AuditEventDocument doc = CosmosAuditDocumentMapper.ToDocument(auditEvent);

        try
        {
            await container.CreateItemAsync(doc, new PartitionKey(doc.TenantId), cancellationToken: ct);
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.Conflict)
        {
            // Idempotent append when EventId is replayed.
        }
    }
}
