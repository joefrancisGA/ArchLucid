using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Moq helpers for audit CSV export tests.</summary>
internal static class AuditExportRepositoryTestDoubles
{
    public static void SetupFilteredExport(Mock<IAuditRepository> repository, params AuditEvent[] events)
    {
        ArgumentNullException.ThrowIfNull(repository);

        repository
            .Setup(r => r.GetFilteredExportAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(events);
    }
}
