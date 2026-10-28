using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Suite", "Persistence")]
[Trait("Category", "Unit")]
public sealed class SqlAuditFrameworkImportAuthorityTests
{
    [Theory]
    [InlineData(0, "framework tenant")]
    [InlineData(1, "controls must belong")]
    [InlineData(2, "controls must belong")]
    [InlineData(3, "requirements must reference")]
    [InlineData(4, "requirements must reference")]
    [InlineData(5, "requirements must reference")]
    [InlineData(6, "metadata must reference")]
    public async Task Import_rejects_mismatched_authority_before_connecting_to_sql(
        int scenario, string errorFragment)
    {
        Guid tenant = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        AuditFrameworkRecord framework = new()
        {
            FrameworkId = frameworkId, TenantId = scenario == 0 ? Guid.NewGuid() : tenant,
            Name = "Authority test", Version = "1",
            ContentHashSha256 = new byte[32], SpecBlob = [1],
        };
        AuditControlRecord control = new()
        {
            ControlId = controlId,
            TenantId = scenario == 1 ? Guid.NewGuid() : tenant,
            FrameworkId = scenario == 2 ? Guid.NewGuid() : frameworkId,
            ControlNumber = "AC-1", Title = "Identity",
        };
        AuditEvidenceRequirementRecord requirement = new()
        {
            RequirementId = requirementId,
            TenantId = scenario == 3 ? Guid.NewGuid() : tenant,
            FrameworkId = scenario == 4 ? Guid.NewGuid() : frameworkId,
            ControlId = scenario == 5 ? Guid.NewGuid() : controlId,
            Name = "Evidence", EvidenceType = "manual",
        };
        IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> metadata =
            scenario == 6
                ? new Dictionary<Guid, IReadOnlyDictionary<string, string>>
                {
                    [Guid.NewGuid()] = new Dictionary<string, string> { ["source"] = "invalid" },
                }
                : new Dictionary<Guid, IReadOnlyDictionary<string, string>>();

        // The connection factory is intentionally null: any attempted DB I/O
        // instead of validation-first produces a different exception.
        SqlAuditFrameworkRepository repository = new(null!);
        Func<Task> action = () => repository.ImportAsync(
            tenant, framework, [control], metadata, [requirement]);

        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*" + errorFragment + "*");
    }

    [Fact]
    public async Task Import_rejects_null_requirement_collection_before_connecting()
    {
        SqlAuditFrameworkRepository repository = new(null!);
        AuditFrameworkRecord framework = new()
        {
            FrameworkId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
        };
        Func<Task> action = () => repository.ImportAsync(
            framework.TenantId, framework, [],
            new Dictionary<Guid, IReadOnlyDictionary<string, string>>(),
            null!);
        await action.Should().ThrowAsync<ArgumentNullException>();
    }
}
