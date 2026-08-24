using ArchLucid.Core.DevTesting;
using ArchLucid.Host.Core.Configuration;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.DevTesting;

/// <summary>
///     Honors <see cref="DevAgentExecutionModeHeaderNames.Header" /> in Development when
///     <see cref="DeveloperExperienceOptions.AllowAgentExecutionModeHeaderOverride" /> is enabled.
///     Defaults to Real when the header is absent so local UI testing starts on live Azure OpenAI.
/// </summary>
public sealed class EffectiveAgentExecutionModeAccessor(
    IHttpContextAccessor httpContextAccessor,
    IConfiguration configuration,
    IHostEnvironment hostEnvironment) : IEffectiveAgentExecutionModeAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor =
        httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    /// <inheritdoc />
    public string GetEffectiveMode()
    {
        if (!IsHeaderOverrideEnabled())
        {
            return ResolveConfiguredMode();
        }

        string? headerValue = _httpContextAccessor.HttpContext?.Request.Headers[DevAgentExecutionModeHeaderNames.Header]
            .FirstOrDefault();

        if (TryParseMode(headerValue, out string parsed))
        {
            return parsed;
        }

        return DevAgentExecutionModeHeaderNames.Real;
    }

    private bool IsHeaderOverrideEnabled()
    {
        return _hostEnvironment.IsDevelopment()
               && _configuration.GetValue(
                   $"{DeveloperExperienceOptions.SectionName}:{nameof(DeveloperExperienceOptions.AllowAgentExecutionModeHeaderOverride)}",
                   false);
    }

    private string ResolveConfiguredMode()
    {
        string? raw = _configuration["AgentExecution:Mode"]?.Trim();

        if (TryParseMode(raw, out string parsed))
        {
            return parsed;
        }

        return DevAgentExecutionModeHeaderNames.Simulator;
    }

    private static bool TryParseMode(string? raw, out string mode)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            mode = string.Empty;

            return false;
        }

        string trimmed = raw.Trim();

        if (string.Equals(trimmed, DevAgentExecutionModeHeaderNames.Real, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "Live", StringComparison.OrdinalIgnoreCase))
        {
            mode = DevAgentExecutionModeHeaderNames.Real;

            return true;
        }

        if (string.Equals(trimmed, DevAgentExecutionModeHeaderNames.Simulator, StringComparison.OrdinalIgnoreCase))
        {
            mode = DevAgentExecutionModeHeaderNames.Simulator;

            return true;
        }

        mode = string.Empty;

        return false;
    }
}
