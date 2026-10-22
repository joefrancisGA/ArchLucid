using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Moq helpers for streaming audit CSV export tests.</summary>
internal static class AuditExportRepositoryTestDoubles
{
    public static void SetupStreamFilteredExport(Mock<IAuditRepository> repository, params AuditEvent[] events)
    {
        ArgumentNullException.ThrowIfNull(repository);

        repository
            .Setup(r => r.StreamFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .Returns(ToAsyncEnumerable(events));
    }

    private static async IAsyncEnumerable<AuditEvent> ToAsyncEnumerable(IReadOnlyList<AuditEvent> events)
    {
        foreach (AuditEvent auditEvent in events)
            yield return auditEvent;
    }
}
