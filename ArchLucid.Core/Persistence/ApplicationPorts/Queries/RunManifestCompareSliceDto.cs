using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

public sealed class RunManifestCompareSliceDto
{
    public Guid RunId
    {
        get;
        init;
    }

    public RunRecord? Run
    {
        get;
        init;
    }

    public ManifestDocument? GoldenManifest
    {
        get;
        init;
    }
}
