using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Core.Audit;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;

using Moq;

namespace ArchLucid.Application.Tests.Governance.FindingDisposition.Support;

internal static class FindingDispositionServiceTestFactory
{
    internal static FindingDispositionService Create(
        ConcurrentFindingReviewTrailRepository trailRepository,
        bool isWorkingDesk = false)
    {
        IFindingDispositionConcurrencyRepository concurrencyRepository =
            new InMemoryFindingDispositionConcurrencyRepository(trailRepository);
        FindingReviewTrailAppendService appendService = new(trailRepository, Mock.Of<IAuditService>());
        Mock<IUserWorkspaceModeReader> workspaceModeReader = new();
        workspaceModeReader
            .Setup(reader => reader.IsWorkingDeskAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(isWorkingDesk);

        return new FindingDispositionService(
            concurrencyRepository,
            trailRepository,
            appendService,
            workspaceModeReader.Object);
    }
}
