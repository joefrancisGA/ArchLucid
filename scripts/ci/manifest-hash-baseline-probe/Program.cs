using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Services;

ManifestDocument manifest = new()
{
    ManifestId = new Guid("aaaaaaaa-0000-0000-0000-000000000001"),
    RunId = new Guid("bbbbbbbb-0000-0000-0000-000000000002"),
    TenantId = new Guid("cccccccc-0000-0000-0000-000000000003"),
    WorkspaceId = new Guid("dddddddd-0000-0000-0000-000000000004"),
    ProjectId = new Guid("eeeeeeee-0000-0000-0000-000000000005"),
    RuleSetId = "default-v1",
    RuleSetVersion = "1.0",
    RuleSetHash = "abc123",
    Policy = new PolicySection(),
    Provenance = new ManifestProvenance()
};

ManifestHashService sut = new();
Console.WriteLine(sut.ComputeHash(manifest));
