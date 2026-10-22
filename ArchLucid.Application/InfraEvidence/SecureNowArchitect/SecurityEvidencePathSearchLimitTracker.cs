using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Records which enumerator caps fired during one search.</summary>
internal sealed class SecurityEvidencePathSearchLimitTracker
{
    private bool _maxPaths;

    private bool _maxDepth;

    private bool _maxFanOut;

    private int _pathsEmitted;

    public void RecordMaxPaths()
    {
        _maxPaths = true;
    }

    public void RecordMaxDepth()
    {
        _maxDepth = true;
    }

    public void RecordMaxFanOut()
    {
        _maxFanOut = true;
    }

    public void SetPathsEmitted(int pathsEmitted)
    {
        _pathsEmitted = pathsEmitted;
    }

    public IReadOnlyList<SecurityEvidencePathSearchLimitHit> ToHits(PrivilegePathEngineOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        List<SecurityEvidencePathSearchLimitHit> hits = [];

        if (_maxPaths)
        {
            hits.Add(Create(SecurityEvidencePathSearchLimitKind.MaxPaths, options.MaxPaths));
        }

        if (_maxDepth)
        {
            hits.Add(Create(SecurityEvidencePathSearchLimitKind.MaxDepth, options.MaxDepth));
        }

        if (_maxFanOut)
        {
            hits.Add(Create(SecurityEvidencePathSearchLimitKind.MaxFanOut, options.MaxFanOutPerNode));
        }

        return hits;
    }

    private SecurityEvidencePathSearchLimitHit Create(SecurityEvidencePathSearchLimitKind kind, int limitValue) =>
        new()
        {
            Kind = kind,
            LimitValue = limitValue,
            PathsEmitted = _pathsEmitted,
        };
}
