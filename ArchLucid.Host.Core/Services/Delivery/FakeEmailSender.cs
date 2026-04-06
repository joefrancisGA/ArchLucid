using ArchLucid.Decisioning.Advisory.Delivery;

namespace ArchLucid.Host.Core.Services.Delivery;

public sealed class FakeEmailSender(ILogger<FakeEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string to, string subject, string body, CancellationToken ct)
    {
        _ = ct;
        logger.LogInformation(
            "[FakeEmail] To={To} Subject={Subject} BodyLength={Length}",
            to,
            subject,
            body.Length);
        return Task.CompletedTask;
    }
}
