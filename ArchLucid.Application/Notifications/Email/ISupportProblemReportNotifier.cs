using ArchLucid.Core.Support;

namespace ArchLucid.Application.Notifications.Email;

public interface ISupportProblemReportNotifier
{
    Task NotifySupportInboxAsync(
        SupportProblemReportRecord report,
        string submittedByActorId,
        bool supportBundleAttached,
        CancellationToken cancellationToken);

    Task NotifySubmitterAsync(
        SupportProblemReportRecord report,
        string submitterMailbox,
        CancellationToken cancellationToken);
}
