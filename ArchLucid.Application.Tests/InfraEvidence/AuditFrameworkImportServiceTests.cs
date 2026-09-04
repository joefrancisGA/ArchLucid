using ArchLucid.Application.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Suite", "Application")]
public sealed class AuditFrameworkImportServiceTests
{
  private static readonly Guid TenantId = Guid.Parse("f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1");

  [Fact]
  public async Task ImportJson_fixture_with_three_example_controls_succeeds()
  {
    InMemoryAuditFrameworkRepository repository = new();
    AuditFrameworkImportService service = new(repository);

    string json = """
                  {
                    "name": "EXAMPLE audit framework",
                    "version": "2026.09.04-example",
                    "sourceReference": "synthetic-fixture://example",
                    "controls": [
                      { "controlNumber": "EX-01", "title": "Example control one" },
                      { "controlNumber": "EX-02", "title": "Example control two", "parentControlNumber": "EX-01" },
                      { "controlNumber": "EX-03", "title": "Example control three" }
                    ]
                  }
                  """;

    AuditFrameworkImportResult result =
      await service.ImportJsonAsync(TenantId, "test-importer", json, CancellationToken.None);

    result.Succeeded.Should().BeTrue();
    result.FrameworkId.Should().NotBeNull();

    IReadOnlyList<AuditControlRecord> controls =
      await repository.ListControlsAsync(TenantId, result.FrameworkId!.Value, CancellationToken.None);

    controls.Should().HaveCount(3);
    controls.Single(c => c.ControlNumber == "EX-02").ParentControlId.Should().NotBeNull();
  }

  [Fact]
  public async Task ImportJson_same_version_and_hash_is_idempotent()
  {
    InMemoryAuditFrameworkRepository repository = new();
    AuditFrameworkImportService service = new(repository);

    string json = """
                  {
                    "name": "EXAMPLE audit framework",
                    "version": "2026.09.04-example",
                    "sourceReference": "synthetic-fixture://example",
                    "controls": [{ "controlNumber": "EX-01", "title": "Example control one" }]
                  }
                  """;

    AuditFrameworkImportResult first =
      await service.ImportJsonAsync(TenantId, "test-importer", json, CancellationToken.None);

    AuditFrameworkImportResult second =
      await service.ImportJsonAsync(TenantId, "test-importer", json, CancellationToken.None);

    second.Succeeded.Should().BeTrue();
    second.WasIdempotentReplay.Should().BeTrue();
    second.FrameworkId.Should().Be(first.FrameworkId);
  }

  [Fact]
  public async Task ImportJson_different_hash_same_version_is_rejected()
  {
    InMemoryAuditFrameworkRepository repository = new();
    AuditFrameworkImportService service = new(repository);

    string firstJson = """
                       {
                         "name": "EXAMPLE audit framework",
                         "version": "2026.09.04-example",
                         "sourceReference": "synthetic-fixture://example",
                         "controls": [{ "controlNumber": "EX-01", "title": "Example control one" }]
                       }
                       """;

    string secondJson = """
                        {
                          "name": "EXAMPLE audit framework",
                          "version": "2026.09.04-example",
                          "sourceReference": "synthetic-fixture://example",
                          "controls": [{ "controlNumber": "EX-01", "title": "Example control one changed" }]
                        }
                        """;

    await service.ImportJsonAsync(TenantId, "test-importer", firstJson, CancellationToken.None);

    AuditFrameworkImportResult second =
      await service.ImportJsonAsync(TenantId, "test-importer", secondJson, CancellationToken.None);

    second.Succeeded.Should().BeFalse();
    second.ErrorCode.Should().Be("VersionHashConflict");
  }

  [Fact]
  public async Task ImportJson_rejects_missing_version_or_source_reference()
  {
    InMemoryAuditFrameworkRepository repository = new();
    AuditFrameworkImportService service = new(repository);

    AuditFrameworkImportResult result =
      await service.ImportJsonAsync(TenantId, "test-importer", """{"name":"x"}""", CancellationToken.None);

    result.Succeeded.Should().BeFalse();
    result.ErrorCode.Should().Be("MissingVersionOrSource");
  }
}

/// <summary>In-memory audit framework repository for application-layer import tests.</summary>
internal sealed class InMemoryAuditFrameworkRepository : IAuditFrameworkRepository
{
  private readonly Dictionary<Guid, AuditFrameworkRecord> _frameworks = new();
  private readonly Dictionary<Guid, List<AuditControlRecord>> _controls = new();

  public Task<AuditFrameworkImportResult> ImportAsync(
    Guid tenantId,
    AuditFrameworkRecord framework,
    IReadOnlyList<AuditControlRecord> controls,
    IReadOnlyDictionary<Guid, IReadOnlyDictionary<string, string>> metadataByControlId,
    CancellationToken cancellationToken = default)
  {
    AuditFrameworkRecord? sameHash = _frameworks.Values.FirstOrDefault(
      f => f.TenantId == tenantId
           && f.Version == framework.Version
           && f.ContentHashSha256.SequenceEqual(framework.ContentHashSha256));

    if (sameHash is not null)
    {
      return Task.FromResult(new AuditFrameworkImportResult
      {
        Succeeded = true,
        WasIdempotentReplay = true,
        FrameworkId = sameHash.FrameworkId,
      });
    }

    if (_frameworks.Values.Any(f => f.TenantId == tenantId && f.Version == framework.Version))
    {
      return Task.FromResult(new AuditFrameworkImportResult
      {
        Succeeded = false,
        ErrorCode = "VersionHashConflict",
      });
    }

    _frameworks[framework.FrameworkId] = framework;
    _controls[framework.FrameworkId] = controls.ToList();

    return Task.FromResult(new AuditFrameworkImportResult
    {
      Succeeded = true,
      FrameworkId = framework.FrameworkId,
    });
  }

  public Task<AuditFrameworkRecord?> TryGetByIdAsync(
    Guid tenantId,
    Guid frameworkId,
    CancellationToken cancellationToken = default)
  {
    if (_frameworks.TryGetValue(frameworkId, out AuditFrameworkRecord? framework) && framework.TenantId == tenantId)
      return Task.FromResult<AuditFrameworkRecord?>(framework);

    return Task.FromResult<AuditFrameworkRecord?>(null);
  }

  public Task<IReadOnlyList<AuditControlRecord>> ListControlsAsync(
    Guid tenantId,
    Guid frameworkId,
    CancellationToken cancellationToken = default)
  {
    if (_controls.TryGetValue(frameworkId, out List<AuditControlRecord>? controls))
      return Task.FromResult<IReadOnlyList<AuditControlRecord>>(controls.Where(c => c.TenantId == tenantId).ToList());

    return Task.FromResult<IReadOnlyList<AuditControlRecord>>(Array.Empty<AuditControlRecord>());
  }
}
