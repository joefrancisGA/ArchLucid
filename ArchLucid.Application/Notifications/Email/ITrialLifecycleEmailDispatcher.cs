namespace ArchLucid.Application.Notifications.Email;

public interface ITrialLifecycleEmailDispatcher
{
    Task DispatchAsync(TrialLifecycleEmailIntegrationEnvelope envelope, CancellationToken cancellationToken);
}
