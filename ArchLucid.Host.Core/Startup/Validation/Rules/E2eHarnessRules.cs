using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

internal static class E2EHarnessRules
{
    public static void Collect(IConfiguration configuration, IWebHostEnvironment environment, List<string> errors)
    {
        E2EHarnessOptions o = configuration.GetSection(E2EHarnessOptions.SectionName).Get<E2EHarnessOptions>() ?? new E2EHarnessOptions();

        if (!o.Enabled)
            return;

        if (HostEnvironmentClassification.IsProductionOrStagingLike(environment, configuration))
        {
            errors.Add("ArchLucid:E2eHarness:Enabled must be false when the host is Production or Staging.");

            return;
        }

        if (string.IsNullOrWhiteSpace(o.SharedSecret) || o.SharedSecret.Trim().Length < 16)

            errors.Add("ArchLucid:E2eHarness:SharedSecret must be set to a strong value (>= 16 chars) when E2eHarness is enabled.");
    }
}
