using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingLifecycleServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTimeOffset PriorReviewCreatedUtc = new(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);

    private readonly Mock<IFindingReviewTrailRepository> _reviewTrailRepository = new(MockBehavior.Strict);

    private readonly CrossReviewFindingLifecycleService _service;

    public CrossReviewFindingLifecycleServiceTests()
    {
        _service = new CrossReviewFindingLifecycleService(_reviewTrailRepository.Object);
    }

    [Fact]
    public void Constructor_rejects_a_null_repository()
    {
        Action act = () => new CrossReviewFindingLifecycleService(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task BuildAsync_rejects_a_null_request()
    {
        Func<Task> act = () => _service.BuildAsync(null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    /// <summary>
    ///     A strict mock with no setup fails the test if the repository is touched, which is exactly the assertion:
    ///     nothing dropped out, so there is nothing to look up.
    /// </summary>
    [Fact]
    public async Task BuildAsync_skips_the_disposition_query_when_nothing_dropped_out()
    {
        CrossReviewFindingLifecycleRequest request = Request(
            correlation: new CrossReviewFindingCorrelationResult { UnmatchedRightFindingIds = ["current-1"] },
            priorFindings: [],
            currentFindings: [Finding("current-1")]);

        CrossReviewFindingLifecycleResult result = await _service.BuildAsync(request);

        result.Summary.NewlyIdentifiedCount.Should().Be(1);
        _reviewTrailRepository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task BuildAsync_queries_only_the_dropped_out_findings_from_the_prior_review_date()
    {
        CrossReviewFindingLifecycleRequest request = DroppedOutRequest();
        StubReviewTrail();

        await _service.BuildAsync(request);

        _reviewTrailRepository.Verify(
            repository => repository.ListForFindingIdsSinceUtcAsync(
                TenantId,
                It.Is<IReadOnlyCollection<string>>(ids => ids.Count == 1 && ids.Single() == "prior-1"),
                PriorReviewCreatedUtc,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task BuildAsync_confirms_resolution_from_the_review_trail()
    {
        StubReviewTrail(
            new FindingReviewEventRecord
            {
                FindingId = "prior-1",
                Action = FindingReviewAction.RecordDisposition,
                Disposition = FindingDisposition.Remediated,
                OccurredAtUtc = PriorReviewCreatedUtc.AddDays(2),
            });

        CrossReviewFindingLifecycleResult result = await _service.BuildAsync(DroppedOutRequest());

        result.Summary.ConfirmedResolvedCount.Should().Be(1);
        result.Summary.UnverifiedResolvedCount.Should().Be(0);
        result.Records.Single().ResolutionBasis.Should()
            .Be(CrossReviewFindingResolutionBasis.ConfirmedByDisposition);
    }

    [Fact]
    public async Task BuildAsync_reports_an_unexplained_dropout_when_the_trail_is_empty()
    {
        StubReviewTrail();

        CrossReviewFindingLifecycleResult result = await _service.BuildAsync(DroppedOutRequest());

        result.Summary.UnverifiedResolvedCount.Should().Be(1);
        result.Summary.HonestyNote.Should().Contain("unexplained");
    }

    private void StubReviewTrail(params FindingReviewEventRecord[] events)
    {
        _reviewTrailRepository
            .Setup(repository => repository.ListForFindingIdsSinceUtcAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyCollection<string>>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(events);
    }

    private static CrossReviewFindingLifecycleRequest DroppedOutRequest()
    {
        return Request(
            correlation: new CrossReviewFindingCorrelationResult { UnmatchedLeftFindingIds = ["prior-1"] },
            priorFindings: [Finding("prior-1")],
            currentFindings: []);
    }

    private static CrossReviewFindingLifecycleRequest Request(
        CrossReviewFindingCorrelationResult correlation,
        IReadOnlyList<ArchitectureFinding> priorFindings,
        IReadOnlyList<ArchitectureFinding> currentFindings)
    {
        return new CrossReviewFindingLifecycleRequest
        {
            TenantId = TenantId,
            PriorFindings = priorFindings,
            CurrentFindings = currentFindings,
            Correlation = correlation,
            SourceCoverage = new CrossReviewFindingSourceCoverage
            {
                PriorAgentTypes = new HashSet<AgentType> { AgentType.Compliance },
                CurrentAgentTypes = new HashSet<AgentType> { AgentType.Compliance },
            },
            DispositionsSinceUtc = PriorReviewCreatedUtc,
        };
    }

    private static ArchitectureFinding Finding(string findingId)
    {
        return new ArchitectureFinding
        {
            FindingId = findingId,
            SourceAgent = AgentType.Compliance,
            Severity = FindingSeverity.Warning,
            Category = "Network",
            Message = $"Message for {findingId}",
        };
    }
}
