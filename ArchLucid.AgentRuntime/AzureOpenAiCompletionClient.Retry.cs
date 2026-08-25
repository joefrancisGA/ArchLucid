using System.ClientModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Azure.AI.OpenAI;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

public sealed partial class AzureOpenAiCompletionClient
{
    private async Task HandleTooManyRequestsAsync(
        ClientResultException ex,
        int tooManyRequestsAttempt,
        CancellationToken cancellationToken)
    {
        TimeSpan wait = AzureOpenAiTooManyRequestsRetry.GetDelayBeforeRetry(
            ex,
            tooManyRequestsAttempt,
            _logger,
            out bool usedRetryAfterHeader);
        TagList rateTags = [];

        rateTags.Add("retry_after", usedRetryAfterHeader ? "header" : "fallback");

        ArchLucidInstrumentation.LlmRateLimitTotal.Add(1, rateTags);

        if (tooManyRequestsAttempt >= AzureOpenAiTooManyRequestsRetry.MaxConsecutiveTooManyRequestsAttempts - 1)
            throw ex;

        await Task.Delay(wait, cancellationToken).ConfigureAwait(false);
    }
}
