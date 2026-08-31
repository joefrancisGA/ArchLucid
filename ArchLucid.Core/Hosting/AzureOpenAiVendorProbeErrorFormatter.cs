using System.ClientModel;
using System.Globalization;

namespace ArchLucid.Core.Hosting;

/// <summary>Formats Azure OpenAI probe failures for operator diagnostics (non-secret).</summary>
public static class AzureOpenAiVendorProbeErrorFormatter
{
    public static string Format(Exception exception)
    {
        ArgumentNullException.ThrowIfNull(exception);

        if (exception is ClientResultException clientResultException)
        {
            return string.Format(
                CultureInfo.InvariantCulture,
                "HTTP {0}: {1}",
                clientResultException.Status,
                clientResultException.Message.Trim());
        }

        if (exception is HttpRequestException httpRequestException)
        {
            if (httpRequestException.StatusCode is not null)
            {
                return string.Format(
                    CultureInfo.InvariantCulture,
                    "HTTP {0}: {1}",
                    (int)httpRequestException.StatusCode.Value,
                    httpRequestException.Message.Trim());
            }

            return $"HttpRequestException: {httpRequestException.Message.Trim()}";
        }

        return $"{exception.GetType().Name}: {exception.Message.Trim()}";
    }

    public static string FormatProbeTimedOut(string deploymentName, TimeSpan budget) =>
        string.Format(
            CultureInfo.InvariantCulture,
            "Live completion probe for deployment '{0}' timed out after {1:0.#}s.",
            deploymentName,
            budget.TotalSeconds);
}
