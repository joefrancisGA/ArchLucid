using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tests.Support;
using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlAuditFrameworkEffectiveDateTests(SqlServerPersistenceFixture fixture)
{
    [SkippableTheory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Framework_import_accepts_null_and_populated_DateOnly(bool populated)
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlAuditFrameworkRepository repository = new(new SqlConnectionFactory(fixture.ConnectionString));
        Guid tenantId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        DateOnly? effectiveDate = populated ? new DateOnly(2026, 10, 28) : null;
        AuditFrameworkImportResult result = await repository.ImportAsync(
            tenantId,
            new AuditFrameworkRecord
            {
                FrameworkId = frameworkId,
                TenantId = tenantId,
                Name = "DateOnly import contract " + frameworkId.ToString("N"),
                Version = frameworkId.ToString("N"),
                SourceReference = "integration-test",
                EffectiveDate = effectiveDate,
                ContentHashSha256 = System.Security.Cryptography.SHA256.HashData(frameworkId.ToByteArray()),
                SpecBlob = [1],
                CreatedUtc = DateTime.UtcNow,
            },
            [],
            new Dictionary<Guid, IReadOnlyDictionary<string, string>>(),
            []);

        result.Succeeded.Should().BeTrue();
        result.FrameworkId.Should().Be(frameworkId);
        AuditFrameworkRecord? loaded = await repository.TryGetByIdAsync(tenantId, frameworkId);
        loaded.Should().NotBeNull();
        loaded!.EffectiveDate.Should().Be(effectiveDate);
    }
}
