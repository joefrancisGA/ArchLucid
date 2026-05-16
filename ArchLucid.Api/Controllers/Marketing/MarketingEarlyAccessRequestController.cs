using System.Net;
using System.Security.Cryptography;
using System.Text;

using ArchLucid.Api.Models.Marketing;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Marketing;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Marketing;

/// <summary>Anonymous early-access capture for buyers who are not ready for self-serve signup.</summary>
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/marketing/early-access")]
[EnableRateLimiting("fixed")]
[AllowAnonymous]
public sealed class MarketingEarlyAccessRequestController(
    IMarketingEarlyAccessRequestRepository earlyAccessRepository,
    IMarketingEarlyAccessSalesNotifier salesNotifier,
    ILogger<MarketingEarlyAccessRequestController> logger) : ControllerBase
{
    private const int MaxEmailChars = 320;
    private const int MaxCompanyChars = 200;
    private const int MaxRoleChars = 120;
    private const int MaxUtmChars = 120;

    private readonly ILogger<MarketingEarlyAccessRequestController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IMarketingEarlyAccessRequestRepository _earlyAccessRepository =
        earlyAccessRepository ?? throw new ArgumentNullException(nameof(earlyAccessRepository));

    private readonly IMarketingEarlyAccessSalesNotifier _salesNotifier =
        salesNotifier ?? throw new ArgumentNullException(nameof(salesNotifier));

    /// <summary>Append-only early-access request (honeypot + rate limit).</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostEarlyAccessRequest(
        [FromBody] MarketingEarlyAccessPostRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (!string.IsNullOrWhiteSpace(body.WebsiteUrl))
            return NoContent();

        string emailTrim = body.Email.Trim();

        if (string.IsNullOrWhiteSpace(emailTrim) || !emailTrim.Contains('@', StringComparison.Ordinal) || emailTrim.Length > MaxEmailChars)
            return this.BadRequestProblem("A valid email is required.", ProblemTypes.ValidationFailed);

        string? company = NormalizeOptional(body.CompanyName, MaxCompanyChars);
        string? role = NormalizeOptional(body.Role, MaxRoleChars);
        string? utmSource = NormalizeOptional(body.UtmSource, MaxUtmChars);
        string? utmMedium = NormalizeOptional(body.UtmMedium, MaxUtmChars);
        string? utmCampaign = NormalizeOptional(body.UtmCampaign, MaxUtmChars);

        byte[]? ipHash = TryHashRemoteIp(HttpContext);

        MarketingEarlyAccessRequestInsertResult? insert = await _earlyAccessRepository.AppendAsync(
            emailTrim,
            company,
            role,
            utmSource,
            utmMedium,
            utmCampaign,
            ipHash,
            cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Marketing early-access request stored.");

        if (insert.HasValue)
        {
            await _salesNotifier.NotifyAsync(insert.Value, emailTrim, company, role, cancellationToken);
        }
        else if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
                "Marketing early-access sales notification skipped (row not persisted — in-memory storage).");

        return NoContent();
    }

    private static string? NormalizeOptional(string? value, int maxChars)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string t = value.Trim();

        return t.Length > maxChars ? t[..maxChars] : t;
    }

    private static byte[]? TryHashRemoteIp(HttpContext httpContext)
    {
        IPAddress? ip = httpContext.Connection.RemoteIpAddress;

        if (ip is null)
            return null;

        byte[] utf8 = Encoding.UTF8.GetBytes(ip.ToString());
        return SHA256.HashData(utf8);
    }
}
