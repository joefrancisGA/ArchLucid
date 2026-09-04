using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAdvisoryTerraformRepresentationService
{
    Task<AdvisoryTerraformRepresentationResult> TryBuildFromSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        bool aztfexportAvailable,
        CancellationToken cancellationToken = default);
}

public sealed class AdvisoryTerraformRepresentationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public byte[] ContentHashSha256
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AdvisoryTerraformResourceMappingRecord> Mappings
    {
        get;
        init;
    } = [];

    public IReadOnlyDictionary<string, string> Files
    {
        get;
        init;
    } = new Dictionary<string, string>();
}
