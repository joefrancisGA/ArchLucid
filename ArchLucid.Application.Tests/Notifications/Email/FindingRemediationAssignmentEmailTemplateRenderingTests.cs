using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Notifications.Email.RazorLight;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingRemediationAssignmentEmailTemplateRenderingTests
{
    private readonly RazorLightEmailTemplateRenderer _renderer = new();

    [SkippableFact]
    public async Task FindingRemediationAssignment_html_encodes_finding_title_metacharacters()
    {
        const string maliciousTitle = "<script>alert('x')</script>";

        string html = await _renderer.RenderHtmlAsync(
            FindingRemediationAssignmentEmailDispatcher.TemplateId,
            new FindingRemediationAssignmentEmailModel
            {
                ProductName = "ArchLucid",
                FindingTitle = maliciousTitle,
                FindingInspectUrl = "https://app.example/findings/1",
                AssignedToQueueUrl = "https://app.example/queue",
            },
            CancellationToken.None);

        html.Should().Contain("&lt;script&gt;");
        html.Should().NotContain("<script>alert");
    }
}
