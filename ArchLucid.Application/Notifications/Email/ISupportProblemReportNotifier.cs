using ArchLucid.Core.Support;

namespace ArchLucid.Application.Notifications.Email;

public interface ISupportProblemReportNotifier
{
    Task NotifySupportInboxAsync(
        SupportProblemReportRecord report,
        string submittedByActorId,
        CancellationToken cancellationToken);
}
