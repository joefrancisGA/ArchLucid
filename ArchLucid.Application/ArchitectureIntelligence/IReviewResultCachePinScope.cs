namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IReviewResultCachePinScope : IDisposable
{
    bool IsPinned { get; }
}
