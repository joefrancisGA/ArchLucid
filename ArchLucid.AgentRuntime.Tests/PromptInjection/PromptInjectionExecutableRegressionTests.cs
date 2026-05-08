using System.Text.Json;

using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.PromptInjection;

/// <summary>
///     Executes prompt-injection fixtures against deterministic layers (precheck + redactor).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PromptInjectionExecutableRegressionTests
{
    private static string PromptInjectionFolder()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string sln = Path.Combine(dir.FullName, "ArchLucid.sln");
            if (File.Exists(sln))
            {
                string root = Path.Combine(dir.FullName, "tests", "eval-datasets", "prompt-injection");
                if (Directory.Exists(root))
                    return root;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not resolve tests/eval-datasets/prompt-injection.");
    }

    public static IEnumerable<object[]> FixtureCases()
    {
        string folder = PromptInjectionFolder();

        foreach (string path in Directory.GetFiles(folder, "*.json"))
        {
            string json = File.ReadAllText(path);
            JsonDocument doc = JsonDocument.Parse(json);

            foreach (JsonElement element in doc.RootElement.EnumerateArray())
            {
                string id = element.GetProperty("id").GetString()!;
                string prompt = element.GetProperty("userPrompt").GetString()!;
                string blockedAt = element.TryGetProperty("expectedBlockedAt", out JsonElement b)
                    ? b.GetString() ?? ""
                    : "";

                yield return [$"{Path.GetFileName(path)}::{id}", prompt, blockedAt];
            }
        }
    }

    [Theory]
    [MemberData(nameof(FixtureCases))]
    public async Task Precheck_blocks_expected_prompts(string _, string userPrompt, string expectedBlockedAt)
    {
        if (!string.Equals(expectedBlockedAt, "precheck", StringComparison.OrdinalIgnoreCase))
            return;

        DefaultRequestContentSafetyPrecheck precheck = new();

        ArchitectureRequest request = new()
        {
            RequestId = "req-pi",
            Description = userPrompt,
            SystemName = "Sys",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        RequestContentSafetyResult result = await precheck.EvaluateAsync(request, CancellationToken.None);

        result.IsAllowed.Should().BeFalse();
        result.Reasons.Should().NotBeEmpty();
    }

    [Theory]
    [MemberData(nameof(FixtureCases))]
    public void Redactor_removes_sensitive_tokens(string _, string userPrompt, string expectedBlockedAt)
    {
        if (!string.Equals(expectedBlockedAt, "redactor", StringComparison.OrdinalIgnoreCase))
            return;

        string redacted = PromptFieldRedactor.RedactForPrompt(userPrompt);

        redacted.Should().NotBe(userPrompt);

        bool removedLeak =
            !redacted.Contains("Bearer ", StringComparison.OrdinalIgnoreCase)
            && !redacted.Contains("@example.com", StringComparison.OrdinalIgnoreCase)
            && !redacted.Contains("AKIA", StringComparison.Ordinal)
            && !redacted.Contains("AccountKey=", StringComparison.OrdinalIgnoreCase)
            && !redacted.Contains("sig=", StringComparison.OrdinalIgnoreCase)
            && !redacted.Contains("sk-", StringComparison.OrdinalIgnoreCase);

        removedLeak.Should().BeTrue();
        redacted.Should().MatchRegex("\\[redacted-");
    }
}
