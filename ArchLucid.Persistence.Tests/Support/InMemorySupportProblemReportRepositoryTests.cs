using ArchLucid.Core.Support;
using ArchLucid.Persistence.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Support;

[Trait("Suite", "Persistence")]
public sealed class InMemorySupportProblemReportRepositoryTests
{
    [Fact]
    public async Task GetByIdAsync_returns_null_for_other_tenant()
    {
        InMemorySupportProblemReportRepository sut = new();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();

        SupportProblemReportRecord created = await sut.InsertAsync(
            new SupportProblemReportInsert
            {
                TenantId = tenantA,
                WorkspaceId = Guid.NewGuid(),
                SubmittedByActorId = "actor",
                ContextJson = "{}"
            },
            CancellationToken.None);

        SupportProblemReportRecord? otherTenant = await sut.GetByIdAsync(tenantB, created.Id, CancellationToken.None);

        otherTenant.Should().BeNull();
    }
}
