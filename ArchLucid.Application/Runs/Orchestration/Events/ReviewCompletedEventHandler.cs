using Microsoft.Extensions.Logging;
using System.Threading;
using System.Threading.Tasks;

namespace ArchLucid.Application.Runs.Orchestration.Events;

public interface IReviewCompletedEventHandler
{
    Task HandleAsync(ReviewCompletedEvent @event, CancellationToken cancellationToken);
}

public class ReviewCompletedEventHandler(ILogger<ReviewCompletedEventHandler> logger) : IReviewCompletedEventHandler
{
    public Task HandleAsync(ReviewCompletedEvent @event, CancellationToken cancellationToken)
    {
        logger.LogInformation("Intent to send completion email for RunId={RunId}, ProjectId={ProjectId}", @event.RunId, @event.ProjectId);
        return Task.CompletedTask;
    }
}