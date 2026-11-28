using ArchLucid.Api.Controllers.Marketing;
using ArchLucid.Api.Models.Marketing;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Marketing;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

public sealed class MarketingEarlyAccessRequestNormalizationTests
{
    [Theory]
    [InlineData(198, true)]
    [InlineData(199, false)]
    [InlineData(200, false)]
    public async Task Company_truncation_keeps_complete_unicode_characters(int prefixLength, bool keepsSupplementaryCharacter)
    {
        // Migration 167 caps company names at 200 UTF-16 code units. Include a supplementary
        // character fully if it fits, or omit it if retaining it would exceed that limit.
        const string supplementaryCharacter = "\U00020000";
        const string email = "buyer@example.com";
        string prefix = new('A', prefixLength);
        string expectedCompany = keepsSupplementaryCharacter ? prefix + supplementaryCharacter : prefix;
        MarketingEarlyAccessRequestInsertResult insert = new(
            Guid.NewGuid(), new DateTime(2026, 11, 27, 0, 0, 0, DateTimeKind.Utc));

        Mock<IMarketingEarlyAccessRequestRepository> repository = new();
        repository.Setup(r => r.AppendAsync(
                email, It.IsAny<string?>(), null, null, null, null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(insert);
        Mock<IMarketingEarlyAccessSalesNotifier> notifier = new();
        notifier.Setup(n => n.NotifyAsync(insert, email, It.IsAny<string?>(), null, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        MarketingEarlyAccessRequestController controller = new(
            repository.Object, notifier.Object, NullLogger<MarketingEarlyAccessRequestController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult result = await controller.PostEarlyAccessRequest(
            new MarketingEarlyAccessPostRequest { Email = email, CompanyName = $"  {prefix}{supplementaryCharacter} Ltd  " },
            CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        repository.Verify(r => r.AppendAsync(
            email, expectedCompany, null, null, null, null, null, It.IsAny<CancellationToken>()), Times.Once);
        notifier.Verify(n => n.NotifyAsync(
            insert, email, expectedCompany, null, It.IsAny<CancellationToken>()), Times.Once);
    }
}
