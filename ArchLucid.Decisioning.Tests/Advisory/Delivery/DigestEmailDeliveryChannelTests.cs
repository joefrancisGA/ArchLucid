using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests.Advisory.Delivery;

[Trait("Category", "Unit")]
public sealed class DigestEmailDeliveryChannelTests
{
    private const string ConnectorName = "Advisory digest email";

    [Fact]
    public void ChannelType_ReturnsEmail()
    {
        Mock<IEmailSender> sender = new();
        DigestEmailDeliveryChannel sut = new(sender.Object);

        sut.ChannelType.Should().Be(DigestDeliveryChannelType.Email);
    }

    [Fact]
    public async Task SendAsync_conformance_routes_destination_to_email_sender_and_supplies_subject_body()
    {
        Mock<IEmailSender> sender = new();
        string? to = null;
        string? subject = null;
        string? body = null;

        sender
            .Setup(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string, CancellationToken>((a, b, c, _) =>
            {
                to = a;
                subject = b;
                body = c;
            })
            .Returns(Task.CompletedTask);

        DigestEmailDeliveryChannel sut = new(sender.Object);
        DigestDeliveryPayload payload = new()
        {
            Digest = new ArchitectureDigest
            {
                DigestId = Guid.NewGuid(),
                Title = "Weekly architecture digest",
                Summary = "Summary line.",
                ContentMarkdown = "## Details\n- item",
            },
            Subscription = new DigestSubscription
            {
                Destination = "team@example.com",
                ChannelType = DigestDeliveryChannelType.Email,
            },
        };

        await sut.SendAsync(payload, CancellationToken.None);

        to.Should().Be("team@example.com", because: $"{ConnectorName}: destination must be the recipient address.");
        subject.Should().Be("Weekly architecture digest", because: $"{ConnectorName}: subject must echo digest title.");
        body.Should().NotBeNullOrWhiteSpace(because: $"{ConnectorName}: body must contain summary and markdown.");
        body.Should().Contain("Summary line.", because: $"{ConnectorName}: summary must appear in plaintext body.");
        body.Should().Contain("## Details", because: $"{ConnectorName}: markdown content must appear in plaintext body.");

        body.Should().NotContain("password=", because: $"{ConnectorName}: email body must not invent secret key material.");
    }

    [Fact]
    public async Task SendAsync_WhenPayloadIsNull_ThrowsArgumentNullException()
    {
        Mock<IEmailSender> sender = new();
        DigestEmailDeliveryChannel sut = new(sender.Object);

        Func<Task> act = async () => await sut.SendAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
