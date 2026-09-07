using System.Text.RegularExpressions;

using ArchLucid.Core.Text;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Detects generic cloud-security checklist phrasing that principal architects dismiss as obvious.
/// </summary>
public static partial class GenericArchitectureAdvicePatterns
{
    private static readonly string[] ObviousPhraseFragments =
    [
        // Provider-neutral
        "enable mfa",
        "enable multi-factor",
        "multi-factor authentication",
        "use https",
        "use tls",
        "enable tls",
        "encrypt data at rest",
        "encryption at rest",
        "implement least privilege",
        "principle of least privilege",
        "use strong password",
        "keep software updated",
        "apply security patches",
        "enable firewall",
        "enable logging",
        "enable diagnostic logging",
        "enable monitoring",
        "add monitoring",
        "ensure scalability",
        "implement backup",
        "disaster recovery plan",
        "use private endpoint",
        "enable rbac",
        "role-based access control",
        "rotate secrets",
        "use managed identit",
        "follow best practice",
        "security best practice",
        "cloud best practice",
        "defense in depth",
        "zero trust posture",
        "ensure compliance",
        "meet compliance requirement",
        // Azure
        "use azure monitor",
        "enable defender",
        "use key vault",
        "azure key vault",
        "well-architected framework",
        // AWS
        "cloudtrail",
        "enable cloudtrail",
        "use cloudtrail",
        "guardduty",
        "enable guardduty",
        "use guardduty",
        "security hub",
        "enable security hub",
        "use security hub",
        "aws kms",
        "use aws kms",
        "enable kms encryption",
        "iam roles",
        "use iam roles",
        "iam policies",
        "use iam policies",
        "security groups",
        "restrict security groups",
        "s3 public access block",
        "enable s3 public access block",
        "block s3 public access",
        "vpc flow logs",
        "enable vpc flow logs",
        "use vpc flow logs",
        "secrets manager",
        "use secrets manager",
        "aws waf",
        "enable aws waf",
        "use aws waf",
        // GCP
        "cloud audit logs",
        "enable cloud audit logs",
        "use cloud audit logs",
        "security command center",
        "enable security command center",
        "use security command center",
        "cloud kms",
        "use cloud kms",
        "enable cloud kms",
        "vpc service controls",
        "use vpc service controls",
        "enable vpc service controls",
        "use iam conditions",
        "enable iam conditions",
        "secret manager",
        "use secret manager",
        "cloud armor",
        "enable cloud armor",
        "use cloud armor",
        // Kubernetes
        "use network policies",
        "enable network policies",
        "implement network policies",
        "use pod security standards",
        "enable pod security admission",
        "implement pod security",
        "enforce rbac",
        "set resource limits",
        "set resource requests",
        "encrypt kubernetes secrets",
        "enable secrets encryption",
        "read-only root filesystem",
        "run as non-root",
        "use non-root user",
        "enable image scanning",
        "scan container images",
        "enable service mesh mtls",
        "use service mesh mtls",
    ];

    /// <summary>
    ///     True when the message reads like generic checklist advice without architecture-specific grounding.
    /// </summary>
    public static bool IsObviousGenericAdvice(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;

        string normalized = message.Trim().ToLowerInvariant();

        foreach (string fragment in ObviousPhraseFragments)
        {
            if (ContainsAffirmativeAdviceFragment(normalized, fragment))
                return true;
        }

        if (ImperativeGenericAdvice().Match(normalized) is { Success: true } imperativeMatch
            && !IsNegatedAdviceFragment(normalized, imperativeMatch.Index)
            && !IsSuffixNegatedAdviceFragment(normalized, imperativeMatch.Index, imperativeMatch.Length))
            return true;

        return false;
    }

    private static bool ContainsAffirmativeAdviceFragment(string normalized, string fragment)
    {
        int index = 0;

        while (index < normalized.Length)
        {
            index = normalized.IndexOf(fragment, index, StringComparison.Ordinal);

            if (index < 0)
                return false;

            if (!IsNegatedAdviceFragment(normalized, index)
                && !IsSuffixNegatedAdviceFragment(normalized, index, fragment.Length)
                && !IsEmbeddedAdviceFragment(normalized, index))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsEmbeddedAdviceFragment(string normalized, int fragmentIndex)
    {
        if (fragmentIndex > 0 && char.IsLetter(normalized[fragmentIndex - 1]))
            return true;

        return false;
    }

    private static bool IsNegatedAdviceFragment(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex).TrimEnd();

        if (before.Length < 2)
            return false;

        return EnglishNegationTokenizer.ContainsNegation(before);
    }

    private static bool IsSuffixNegatedAdviceFragment(string normalized, int fragmentIndex, int fragmentLength)
    {
        ReadOnlySpan<char> after = normalized.AsSpan(fragmentIndex + fragmentLength).TrimStart();

        if (after.Length < 2)
            return false;

        return after.StartsWith("not required", StringComparison.Ordinal)
            || after.StartsWith("not needed", StringComparison.Ordinal)
            || after.StartsWith("is not required", StringComparison.Ordinal)
            || after.StartsWith("is not needed", StringComparison.Ordinal)
            || after.StartsWith("not necessary", StringComparison.Ordinal)
            || after.StartsWith("is not necessary", StringComparison.Ordinal)
            || after.StartsWith("is unnecessary", StringComparison.Ordinal)
            || after.StartsWith("isn't required", StringComparison.Ordinal)
            || after.StartsWith("isn't needed", StringComparison.Ordinal)
            || after.StartsWith("is optional", StringComparison.Ordinal)
            || after.StartsWith("won't need to", StringComparison.Ordinal)
            || after.StartsWith("must not be required", StringComparison.Ordinal)
            || after.StartsWith("must not be needed", StringComparison.Ordinal)
            || after.StartsWith("need not be", StringComparison.Ordinal)
            || after.StartsWith("need not", StringComparison.Ordinal)
            || after.StartsWith("should not require", StringComparison.Ordinal)
            || after.StartsWith("should not need", StringComparison.Ordinal)
            || after.StartsWith("shall not require", StringComparison.Ordinal)
            || after.StartsWith("shall not need", StringComparison.Ordinal)
            || after.StartsWith("will not require", StringComparison.Ordinal)
            || after.StartsWith("would not require", StringComparison.Ordinal)
            || after.StartsWith("ought not require", StringComparison.Ordinal)
            || after.StartsWith("ought not need", StringComparison.Ordinal)
            || after.StartsWith("is not required for", StringComparison.Ordinal)
            || after.StartsWith("need not adopt", StringComparison.Ordinal)
            || after.StartsWith("does not require", StringComparison.Ordinal)
            || after.StartsWith("does not need", StringComparison.Ordinal)
            || after.StartsWith("does not mandate", StringComparison.Ordinal)
            || after.StartsWith("does not enforce", StringComparison.Ordinal)
            || after.StartsWith("does not configure", StringComparison.Ordinal)
            || after.StartsWith("would not need", StringComparison.Ordinal)
            || after.StartsWith("will not need", StringComparison.Ordinal)
            || after.StartsWith("will not mandate", StringComparison.Ordinal)
            || after.StartsWith("would not mandate", StringComparison.Ordinal)
            || after.StartsWith("shall not mandate", StringComparison.Ordinal)
            || after.StartsWith("should not mandate", StringComparison.Ordinal)
            || after.StartsWith("does not apply", StringComparison.Ordinal)
            || after.StartsWith("does not provision", StringComparison.Ordinal)
            || after.StartsWith("ought not mandate", StringComparison.Ordinal)
            || after.StartsWith("will not enforce", StringComparison.Ordinal)
            || after.StartsWith("would not enforce", StringComparison.Ordinal)
            || after.StartsWith("does not ensure", StringComparison.Ordinal)
            || after.StartsWith("shall not enforce", StringComparison.Ordinal)
            || after.StartsWith("should not enforce", StringComparison.Ordinal)
            || after.StartsWith("shall not configure", StringComparison.Ordinal)
            || after.StartsWith("should not configure", StringComparison.Ordinal)
            || after.StartsWith("ought not enforce", StringComparison.Ordinal)
            || after.StartsWith("will not configure", StringComparison.Ordinal)
            || after.StartsWith("would not configure", StringComparison.Ordinal)
            || after.StartsWith("does not maintain", StringComparison.Ordinal)
            || after.StartsWith("ought not configure", StringComparison.Ordinal)
            || after.StartsWith("shall not apply", StringComparison.Ordinal)
            || after.StartsWith("should not apply", StringComparison.Ordinal)
            || after.StartsWith("cannot mandate", StringComparison.Ordinal)
            || after.StartsWith("shall not provision", StringComparison.Ordinal)
            || after.StartsWith("should not provision", StringComparison.Ordinal)
            || after.StartsWith("cannot configure", StringComparison.Ordinal)
            || after.StartsWith("need not maintain", StringComparison.Ordinal)
            || after.StartsWith("would not provision", StringComparison.Ordinal)
            || after.StartsWith("cannot provision", StringComparison.Ordinal)
            || after.StartsWith("cannot enforce", StringComparison.Ordinal)
            || after.StartsWith("need not ensure", StringComparison.Ordinal)
            || after.StartsWith("will not apply", StringComparison.Ordinal)
            || after.StartsWith("cannot apply", StringComparison.Ordinal)
            || after.StartsWith("shall not maintain", StringComparison.Ordinal)
            || after.StartsWith("should not maintain", StringComparison.Ordinal)
            || after.StartsWith("will not ensure", StringComparison.Ordinal)
            || after.StartsWith("would not ensure", StringComparison.Ordinal)
            || after.StartsWith("shall not ensure", StringComparison.Ordinal)
            || after.StartsWith("cannot ensure", StringComparison.Ordinal)
            || after.StartsWith("should not ensure", StringComparison.Ordinal)
            || after.StartsWith("ought not ensure", StringComparison.Ordinal)
            || after.StartsWith("would not apply", StringComparison.Ordinal)
            || after.StartsWith("ought not apply", StringComparison.Ordinal)
            || after.StartsWith("will not maintain", StringComparison.Ordinal)
            || after.StartsWith("would not maintain", StringComparison.Ordinal)
            || after.StartsWith("cannot maintain", StringComparison.Ordinal)
            || after.StartsWith("ought not maintain", StringComparison.Ordinal)
            || after.StartsWith("will not provision", StringComparison.Ordinal)
            || after.StartsWith("ought not provision", StringComparison.Ordinal)
            || after.StartsWith("do not apply", StringComparison.Ordinal)
            || after.StartsWith("do not provision", StringComparison.Ordinal)
            || after.StartsWith("do not configure", StringComparison.Ordinal)
            || after.StartsWith("do not enforce", StringComparison.Ordinal)
            || after.StartsWith("do not maintain", StringComparison.Ordinal)
            || after.StartsWith("do not ensure", StringComparison.Ordinal)
            || after.StartsWith("do not mandate", StringComparison.Ordinal)
            || after.StartsWith("do not require", StringComparison.Ordinal)
            || after.StartsWith("do not need", StringComparison.Ordinal)
            || after.StartsWith("do not adopt", StringComparison.Ordinal)
            || after.StartsWith("do not deploy", StringComparison.Ordinal)
            || after.StartsWith("do not implement", StringComparison.Ordinal)
            || after.StartsWith("do not enable", StringComparison.Ordinal)
            || after.StartsWith("do not use", StringComparison.Ordinal)
            || after.StartsWith("do not have", StringComparison.Ordinal)
            || after.StartsWith("shouldn't require", StringComparison.Ordinal)
            || after.StartsWith("won't require", StringComparison.Ordinal)
            || after.StartsWith("shouldn't need", StringComparison.Ordinal)
            || after.StartsWith("won't need", StringComparison.Ordinal)
            || after.StartsWith("shouldn't enforce", StringComparison.Ordinal)
            || after.StartsWith("won't enforce", StringComparison.Ordinal)
            || after.StartsWith("shouldn't apply", StringComparison.Ordinal)
            || after.StartsWith("won't apply", StringComparison.Ordinal)
            || after.StartsWith("shouldn't configure", StringComparison.Ordinal)
            || after.StartsWith("won't configure", StringComparison.Ordinal)
            || after.StartsWith("shouldn't mandate", StringComparison.Ordinal)
            || after.StartsWith("won't mandate", StringComparison.Ordinal)
            || after.StartsWith("shouldn't maintain", StringComparison.Ordinal)
            || after.StartsWith("won't maintain", StringComparison.Ordinal)
            || after.StartsWith("shouldn't ensure", StringComparison.Ordinal)
            || after.StartsWith("won't ensure", StringComparison.Ordinal)
            || after.StartsWith("shouldn't provision", StringComparison.Ordinal)
            || after.StartsWith("won't provision", StringComparison.Ordinal)
            || after.StartsWith("doesn't require", StringComparison.Ordinal)
            || after.StartsWith("shouldn't deploy", StringComparison.Ordinal)
            || after.StartsWith("won't deploy", StringComparison.Ordinal)
            || after.StartsWith("shouldn't adopt", StringComparison.Ordinal)
            || after.StartsWith("won't adopt", StringComparison.Ordinal)
            || after.StartsWith("doesn't need", StringComparison.Ordinal)
            || after.StartsWith("shouldn't implement", StringComparison.Ordinal)
            || after.StartsWith("won't implement", StringComparison.Ordinal)
            || after.StartsWith("shouldn't enable", StringComparison.Ordinal)
            || after.StartsWith("won't enable", StringComparison.Ordinal)
            || after.StartsWith("shouldn't use", StringComparison.Ordinal)
            || after.StartsWith("won't use", StringComparison.Ordinal)
            || after.StartsWith("shouldn't have", StringComparison.Ordinal)
            || after.StartsWith("won't have", StringComparison.Ordinal)
            || after.StartsWith("doesn't use", StringComparison.Ordinal)
            || after.StartsWith("doesn't have", StringComparison.Ordinal)
            || after.StartsWith("doesn't implement", StringComparison.Ordinal)
            || after.StartsWith("doesn't enable", StringComparison.Ordinal)
            || after.StartsWith("doesn't deploy", StringComparison.Ordinal)
            || after.StartsWith("doesn't adopt", StringComparison.Ordinal)
            || after.StartsWith("didn't use", StringComparison.Ordinal)
            || after.StartsWith("didn't have", StringComparison.Ordinal)
            || after.StartsWith("didn't adopt", StringComparison.Ordinal)
            || after.StartsWith("didn't enable", StringComparison.Ordinal)
            || after.StartsWith("didn't implement", StringComparison.Ordinal)
            || after.StartsWith("didn't deploy", StringComparison.Ordinal)
            || after.StartsWith("didn't require", StringComparison.Ordinal)
            || after.StartsWith("didn't configure", StringComparison.Ordinal)
            || after.StartsWith("didn't mandate", StringComparison.Ordinal)
            || after.StartsWith("didn't apply", StringComparison.Ordinal)
            || after.StartsWith("didn't enforce", StringComparison.Ordinal)
            || after.StartsWith("didn't maintain", StringComparison.Ordinal)
            || after.StartsWith("didn't ensure", StringComparison.Ordinal)
            || after.StartsWith("wasn't use", StringComparison.Ordinal)
            || after.StartsWith("wasn't have", StringComparison.Ordinal)
            || after.StartsWith("wasn't adopt", StringComparison.Ordinal)
            || after.StartsWith("wasn't enable", StringComparison.Ordinal)
            || after.StartsWith("wasn't implement", StringComparison.Ordinal)
            || after.StartsWith("wasn't deploy", StringComparison.Ordinal)
            || after.StartsWith("wasn't require", StringComparison.Ordinal)
            || after.StartsWith("wasn't configure", StringComparison.Ordinal)
            || after.StartsWith("wasn't mandate", StringComparison.Ordinal)
            || after.StartsWith("wasn't apply", StringComparison.Ordinal)
            || after.StartsWith("wasn't enforce", StringComparison.Ordinal)
            || after.StartsWith("wasn't maintain", StringComparison.Ordinal)
            || after.StartsWith("wasn't ensure", StringComparison.Ordinal)
            || after.StartsWith("wasn't provision", StringComparison.Ordinal)
            || after.StartsWith("wasn't need", StringComparison.Ordinal)
            || after.StartsWith("didn't provision", StringComparison.Ordinal)
            || after.StartsWith("didn't need", StringComparison.Ordinal)
            || after.StartsWith("mightn't configure", StringComparison.Ordinal)
            || after.StartsWith("mightn't mandate", StringComparison.Ordinal)
            || after.StartsWith("mightn't apply", StringComparison.Ordinal)
            || after.StartsWith("mightn't enforce", StringComparison.Ordinal)
            || after.StartsWith("mightn't maintain", StringComparison.Ordinal)
            || after.StartsWith("mightn't ensure", StringComparison.Ordinal)
            || after.StartsWith("mightn't provision", StringComparison.Ordinal)
            || after.StartsWith("mightn't require", StringComparison.Ordinal)
            || after.StartsWith("mightn't need", StringComparison.Ordinal)
            || after.StartsWith("shan't configure", StringComparison.Ordinal)
            || after.StartsWith("shan't mandate", StringComparison.Ordinal)
            || after.StartsWith("shan't apply", StringComparison.Ordinal)
            || after.StartsWith("shan't enforce", StringComparison.Ordinal)
            || after.StartsWith("shan't maintain", StringComparison.Ordinal)
            || after.StartsWith("shan't ensure", StringComparison.Ordinal)
            || after.StartsWith("shan't provision", StringComparison.Ordinal)
            || after.StartsWith("shan't require", StringComparison.Ordinal)
            || after.StartsWith("shan't need", StringComparison.Ordinal)
            || after.StartsWith("daren't configure", StringComparison.Ordinal)
            || after.StartsWith("daren't mandate", StringComparison.Ordinal)
            || after.StartsWith("daren't apply", StringComparison.Ordinal)
            || after.StartsWith("daren't enforce", StringComparison.Ordinal)
            || after.StartsWith("daren't maintain", StringComparison.Ordinal)
            || after.StartsWith("daren't ensure", StringComparison.Ordinal)
            || after.StartsWith("daren't provision", StringComparison.Ordinal)
            || after.StartsWith("daren't require", StringComparison.Ordinal)
            || after.StartsWith("daren't need", StringComparison.Ordinal)
            || after.StartsWith("ain't configure", StringComparison.Ordinal)
            || after.StartsWith("ain't mandate", StringComparison.Ordinal)
            || after.StartsWith("ain't apply", StringComparison.Ordinal)
            || after.StartsWith("ain't enforce", StringComparison.Ordinal)
            || after.StartsWith("ain't maintain", StringComparison.Ordinal)
            || after.StartsWith("ain't ensure", StringComparison.Ordinal)
            || after.StartsWith("ain't provision", StringComparison.Ordinal)
            || after.StartsWith("ain't require", StringComparison.Ordinal)
            || after.StartsWith("ain't need", StringComparison.Ordinal)
            || after.StartsWith("mayn't configure", StringComparison.Ordinal)
            || after.StartsWith("mayn't mandate", StringComparison.Ordinal)
            || after.StartsWith("mayn't apply", StringComparison.Ordinal)
            || after.StartsWith("mayn't enforce", StringComparison.Ordinal)
            || after.StartsWith("mayn't maintain", StringComparison.Ordinal)
            || after.StartsWith("mayn't ensure", StringComparison.Ordinal)
            || after.StartsWith("mayn't provision", StringComparison.Ordinal)
            || after.StartsWith("mayn't require", StringComparison.Ordinal)
            || after.StartsWith("mayn't need", StringComparison.Ordinal)
            || after.StartsWith("oughtn't configure", StringComparison.Ordinal)
            || after.StartsWith("oughtn't mandate", StringComparison.Ordinal)
            || after.StartsWith("oughtn't apply", StringComparison.Ordinal)
            || after.StartsWith("oughtn't enforce", StringComparison.Ordinal)
            || after.StartsWith("oughtn't maintain", StringComparison.Ordinal)
            || after.StartsWith("oughtn't ensure", StringComparison.Ordinal)
            || after.StartsWith("oughtn't provision", StringComparison.Ordinal)
            || after.StartsWith("oughtn't require", StringComparison.Ordinal)
            || after.StartsWith("oughtn't need", StringComparison.Ordinal)
            || after.StartsWith("needn't configure", StringComparison.Ordinal)
            || after.StartsWith("needn't mandate", StringComparison.Ordinal)
            || after.StartsWith("needn't apply", StringComparison.Ordinal)
            || after.StartsWith("needn't enforce", StringComparison.Ordinal)
            || after.StartsWith("needn't maintain", StringComparison.Ordinal)
            || after.StartsWith("needn't ensure", StringComparison.Ordinal)
            || after.StartsWith("needn't provision", StringComparison.Ordinal)
            || after.StartsWith("needn't require", StringComparison.Ordinal)
            || after.StartsWith("needn't need", StringComparison.Ordinal)
            || after.StartsWith("mustn't configure", StringComparison.Ordinal)
            || after.StartsWith("mustn't mandate", StringComparison.Ordinal)
            || after.StartsWith("mustn't apply", StringComparison.Ordinal)
            || after.StartsWith("mustn't enforce", StringComparison.Ordinal)
            || after.StartsWith("mustn't maintain", StringComparison.Ordinal)
            || after.StartsWith("mustn't ensure", StringComparison.Ordinal)
            || after.StartsWith("mustn't provision", StringComparison.Ordinal)
            || after.StartsWith("mustn't require", StringComparison.Ordinal)
            || after.StartsWith("mustn't need", StringComparison.Ordinal)
            || after.StartsWith("couldn't configure", StringComparison.Ordinal)
            || after.StartsWith("couldn't mandate", StringComparison.Ordinal)
            || after.StartsWith("couldn't apply", StringComparison.Ordinal)
            || after.StartsWith("couldn't enforce", StringComparison.Ordinal)
            || after.StartsWith("couldn't maintain", StringComparison.Ordinal)
            || after.StartsWith("couldn't ensure", StringComparison.Ordinal)
            || after.StartsWith("couldn't provision", StringComparison.Ordinal)
            || after.StartsWith("couldn't require", StringComparison.Ordinal)
            || after.StartsWith("couldn't need", StringComparison.Ordinal)
            || after.StartsWith("wouldn't configure", StringComparison.Ordinal)
            || after.StartsWith("wouldn't mandate", StringComparison.Ordinal)
            || after.StartsWith("wouldn't apply", StringComparison.Ordinal)
            || after.StartsWith("wouldn't enforce", StringComparison.Ordinal)
            || after.StartsWith("wouldn't maintain", StringComparison.Ordinal)
            || after.StartsWith("wouldn't ensure", StringComparison.Ordinal)
            || after.StartsWith("wouldn't provision", StringComparison.Ordinal)
            || after.StartsWith("wouldn't require", StringComparison.Ordinal)
            || after.StartsWith("wouldn't need", StringComparison.Ordinal)
            || after.StartsWith("can't configure", StringComparison.Ordinal)
            || after.StartsWith("can't mandate", StringComparison.Ordinal)
            || after.StartsWith("can't apply", StringComparison.Ordinal)
            || after.StartsWith("can't enforce", StringComparison.Ordinal)
            || after.StartsWith("can't maintain", StringComparison.Ordinal)
            || after.StartsWith("can't ensure", StringComparison.Ordinal)
            || after.StartsWith("can't provision", StringComparison.Ordinal)
            || after.StartsWith("can't require", StringComparison.Ordinal)
            || after.StartsWith("can't need", StringComparison.Ordinal)
            || after.StartsWith("isn't configure", StringComparison.Ordinal)
            || after.StartsWith("isn't mandate", StringComparison.Ordinal)
            || after.StartsWith("isn't apply", StringComparison.Ordinal)
            || after.StartsWith("isn't enforce", StringComparison.Ordinal)
            || after.StartsWith("isn't maintain", StringComparison.Ordinal)
            || after.StartsWith("isn't ensure", StringComparison.Ordinal)
            || after.StartsWith("isn't provision", StringComparison.Ordinal)
            || after.StartsWith("isn't require", StringComparison.Ordinal)
            || after.StartsWith("isn't need", StringComparison.Ordinal)
            || after.StartsWith("aren't configure", StringComparison.Ordinal)
            || after.StartsWith("aren't mandate", StringComparison.Ordinal)
            || after.StartsWith("aren't apply", StringComparison.Ordinal)
            || after.StartsWith("aren't enforce", StringComparison.Ordinal)
            || after.StartsWith("aren't maintain", StringComparison.Ordinal)
            || after.StartsWith("aren't ensure", StringComparison.Ordinal)
            || after.StartsWith("aren't provision", StringComparison.Ordinal)
            || after.StartsWith("aren't require", StringComparison.Ordinal)
            || after.StartsWith("aren't need", StringComparison.Ordinal)
            || after.StartsWith("haven't configure", StringComparison.Ordinal)
            || after.StartsWith("haven't mandate", StringComparison.Ordinal)
            || after.StartsWith("haven't apply", StringComparison.Ordinal)
            || after.StartsWith("haven't enforce", StringComparison.Ordinal)
            || after.StartsWith("haven't maintain", StringComparison.Ordinal)
            || after.StartsWith("haven't ensure", StringComparison.Ordinal)
            || after.StartsWith("haven't provision", StringComparison.Ordinal)
            || after.StartsWith("haven't require", StringComparison.Ordinal)
            || after.StartsWith("haven't need", StringComparison.Ordinal)
            || after.StartsWith("hasn't configure", StringComparison.Ordinal)
            || after.StartsWith("hasn't mandate", StringComparison.Ordinal)
            || after.StartsWith("hasn't apply", StringComparison.Ordinal)
            || after.StartsWith("hasn't enforce", StringComparison.Ordinal)
            || after.StartsWith("hasn't maintain", StringComparison.Ordinal)
            || after.StartsWith("hasn't ensure", StringComparison.Ordinal)
            || after.StartsWith("hasn't provision", StringComparison.Ordinal)
            || after.StartsWith("hasn't require", StringComparison.Ordinal)
            || after.StartsWith("hasn't need", StringComparison.Ordinal)
            || after.StartsWith("hadn't configure", StringComparison.Ordinal)
            || after.StartsWith("hadn't mandate", StringComparison.Ordinal)
            || after.StartsWith("hadn't apply", StringComparison.Ordinal)
            || after.StartsWith("hadn't enforce", StringComparison.Ordinal)
            || after.StartsWith("hadn't maintain", StringComparison.Ordinal)
            || after.StartsWith("hadn't ensure", StringComparison.Ordinal)
            || after.StartsWith("hadn't provision", StringComparison.Ordinal)
            || after.StartsWith("hadn't require", StringComparison.Ordinal)
            || after.StartsWith("hadn't need", StringComparison.Ordinal)
            || after.StartsWith("weren't configure", StringComparison.Ordinal)
            || after.StartsWith("weren't mandate", StringComparison.Ordinal)
            || after.StartsWith("weren't apply", StringComparison.Ordinal)
            || after.StartsWith("weren't enforce", StringComparison.Ordinal)
            || after.StartsWith("weren't maintain", StringComparison.Ordinal)
            || after.StartsWith("weren't ensure", StringComparison.Ordinal)
            || after.StartsWith("weren't provision", StringComparison.Ordinal)
            || after.StartsWith("weren't require", StringComparison.Ordinal)
            || after.StartsWith("weren't need", StringComparison.Ordinal)
            || after.StartsWith("could not configure", StringComparison.Ordinal)
            || after.StartsWith("could not mandate", StringComparison.Ordinal)
            || after.StartsWith("could not apply", StringComparison.Ordinal)
            || after.StartsWith("could not enforce", StringComparison.Ordinal)
            || after.StartsWith("could not maintain", StringComparison.Ordinal)
            || after.StartsWith("could not ensure", StringComparison.Ordinal)
            || after.StartsWith("could not provision", StringComparison.Ordinal)
            || after.StartsWith("could not require", StringComparison.Ordinal)
            || after.StartsWith("could not need", StringComparison.Ordinal)
            || after.StartsWith("can not configure", StringComparison.Ordinal)
            || after.StartsWith("can not mandate", StringComparison.Ordinal)
            || after.StartsWith("can not apply", StringComparison.Ordinal)
            || after.StartsWith("can not enforce", StringComparison.Ordinal)
            || after.StartsWith("can not maintain", StringComparison.Ordinal)
            || after.StartsWith("can not ensure", StringComparison.Ordinal)
            || after.StartsWith("can not provision", StringComparison.Ordinal)
            || after.StartsWith("can not require", StringComparison.Ordinal)
            || after.StartsWith("can not need", StringComparison.Ordinal)
            || after.StartsWith("might not configure", StringComparison.Ordinal)
            || after.StartsWith("might not mandate", StringComparison.Ordinal)
            || after.StartsWith("might not apply", StringComparison.Ordinal)
            || after.StartsWith("might not enforce", StringComparison.Ordinal)
            || after.StartsWith("might not maintain", StringComparison.Ordinal)
            || after.StartsWith("might not ensure", StringComparison.Ordinal)
            || after.StartsWith("might not provision", StringComparison.Ordinal)
            || after.StartsWith("might not require", StringComparison.Ordinal)
            || after.StartsWith("might not need", StringComparison.Ordinal)
            || after.StartsWith("may not configure", StringComparison.Ordinal)
            || after.StartsWith("may not mandate", StringComparison.Ordinal)
            || after.StartsWith("may not apply", StringComparison.Ordinal)
            || after.StartsWith("may not enforce", StringComparison.Ordinal)
            || after.StartsWith("may not maintain", StringComparison.Ordinal)
            || after.StartsWith("may not ensure", StringComparison.Ordinal)
            || after.StartsWith("may not provision", StringComparison.Ordinal)
            || after.StartsWith("may not require", StringComparison.Ordinal)
            || after.StartsWith("may not need", StringComparison.Ordinal)
            || after.StartsWith("dare not configure", StringComparison.Ordinal)
            || after.StartsWith("dare not mandate", StringComparison.Ordinal)
            || after.StartsWith("dare not apply", StringComparison.Ordinal)
            || after.StartsWith("dare not enforce", StringComparison.Ordinal)
            || after.StartsWith("dare not maintain", StringComparison.Ordinal)
            || after.StartsWith("dare not ensure", StringComparison.Ordinal)
            || after.StartsWith("dare not provision", StringComparison.Ordinal)
            || after.StartsWith("dare not require", StringComparison.Ordinal)
            || after.StartsWith("dare not need", StringComparison.Ordinal)
            || after.StartsWith("is not configure", StringComparison.Ordinal)
            || after.StartsWith("is not mandate", StringComparison.Ordinal)
            || after.StartsWith("is not apply", StringComparison.Ordinal)
            || after.StartsWith("is not enforce", StringComparison.Ordinal)
            || after.StartsWith("is not maintain", StringComparison.Ordinal)
            || after.StartsWith("is not ensure", StringComparison.Ordinal)
            || after.StartsWith("is not provision", StringComparison.Ordinal)
            || after.StartsWith("is not require", StringComparison.Ordinal)
            || after.StartsWith("is not need", StringComparison.Ordinal)
            || after.StartsWith("was not configure", StringComparison.Ordinal)
            || after.StartsWith("was not mandate", StringComparison.Ordinal)
            || after.StartsWith("was not apply", StringComparison.Ordinal)
            || after.StartsWith("was not enforce", StringComparison.Ordinal)
            || after.StartsWith("was not maintain", StringComparison.Ordinal)
            || after.StartsWith("was not ensure", StringComparison.Ordinal)
            || after.StartsWith("was not provision", StringComparison.Ordinal)
            || after.StartsWith("was not require", StringComparison.Ordinal)
            || after.StartsWith("was not need", StringComparison.Ordinal)
            || after.StartsWith("are not configure", StringComparison.Ordinal)
            || after.StartsWith("are not mandate", StringComparison.Ordinal)
            || after.StartsWith("are not apply", StringComparison.Ordinal)
            || after.StartsWith("are not enforce", StringComparison.Ordinal)
            || after.StartsWith("are not maintain", StringComparison.Ordinal)
            || after.StartsWith("are not ensure", StringComparison.Ordinal)
            || after.StartsWith("are not provision", StringComparison.Ordinal)
            || after.StartsWith("are not require", StringComparison.Ordinal)
            || after.StartsWith("are not need", StringComparison.Ordinal)
            || after.StartsWith("were not configure", StringComparison.Ordinal)
            || after.StartsWith("were not mandate", StringComparison.Ordinal)
            || after.StartsWith("were not apply", StringComparison.Ordinal)
            || after.StartsWith("were not enforce", StringComparison.Ordinal)
            || after.StartsWith("were not maintain", StringComparison.Ordinal)
            || after.StartsWith("were not ensure", StringComparison.Ordinal)
            || after.StartsWith("were not provision", StringComparison.Ordinal)
            || after.StartsWith("were not require", StringComparison.Ordinal)
            || after.StartsWith("were not need", StringComparison.Ordinal)
            || after.StartsWith("has not configure", StringComparison.Ordinal)
            || after.StartsWith("has not mandate", StringComparison.Ordinal)
            || after.StartsWith("has not apply", StringComparison.Ordinal)
            || after.StartsWith("has not enforce", StringComparison.Ordinal)
            || after.StartsWith("has not maintain", StringComparison.Ordinal)
            || after.StartsWith("has not ensure", StringComparison.Ordinal)
            || after.StartsWith("has not provision", StringComparison.Ordinal)
            || after.StartsWith("has not require", StringComparison.Ordinal)
            || after.StartsWith("has not need", StringComparison.Ordinal)
            || after.StartsWith("have not configure", StringComparison.Ordinal)
            || after.StartsWith("have not mandate", StringComparison.Ordinal)
            || after.StartsWith("have not apply", StringComparison.Ordinal)
            || after.StartsWith("have not enforce", StringComparison.Ordinal)
            || after.StartsWith("have not maintain", StringComparison.Ordinal)
            || after.StartsWith("have not ensure", StringComparison.Ordinal)
            || after.StartsWith("have not provision", StringComparison.Ordinal)
            || after.StartsWith("have not require", StringComparison.Ordinal)
            || after.StartsWith("have not need", StringComparison.Ordinal)
            || after.StartsWith("had not configure", StringComparison.Ordinal)
            || after.StartsWith("had not mandate", StringComparison.Ordinal)
            || after.StartsWith("had not apply", StringComparison.Ordinal)
            || after.StartsWith("had not enforce", StringComparison.Ordinal)
            || after.StartsWith("had not maintain", StringComparison.Ordinal)
            || after.StartsWith("had not ensure", StringComparison.Ordinal)
            || after.StartsWith("had not provision", StringComparison.Ordinal)
            || after.StartsWith("had not require", StringComparison.Ordinal)
            || after.StartsWith("had not need", StringComparison.Ordinal)
            || after.StartsWith("did not configure", StringComparison.Ordinal)
            || after.StartsWith("did not mandate", StringComparison.Ordinal)
            || after.StartsWith("did not apply", StringComparison.Ordinal)
            || after.StartsWith("did not enforce", StringComparison.Ordinal)
            || after.StartsWith("did not maintain", StringComparison.Ordinal)
            || after.StartsWith("did not ensure", StringComparison.Ordinal)
            || after.StartsWith("did not provision", StringComparison.Ordinal)
            || after.StartsWith("did not require", StringComparison.Ordinal)
            || after.StartsWith("did not need", StringComparison.Ordinal)
            || after.StartsWith("don't configure", StringComparison.Ordinal)
            || after.StartsWith("don't mandate", StringComparison.Ordinal)
            || after.StartsWith("don't apply", StringComparison.Ordinal)
            || after.StartsWith("don't enforce", StringComparison.Ordinal)
            || after.StartsWith("don't maintain", StringComparison.Ordinal)
            || after.StartsWith("don't ensure", StringComparison.Ordinal)
            || after.StartsWith("don't provision", StringComparison.Ordinal)
            || after.StartsWith("don't require", StringComparison.Ordinal)
            || after.StartsWith("don't need", StringComparison.Ordinal)
            || after.StartsWith("wont configure", StringComparison.Ordinal)
            || after.StartsWith("wont mandate", StringComparison.Ordinal)
            || after.StartsWith("wont apply", StringComparison.Ordinal)
            || after.StartsWith("wont enforce", StringComparison.Ordinal)
            || after.StartsWith("wont maintain", StringComparison.Ordinal)
            || after.StartsWith("wont ensure", StringComparison.Ordinal)
            || after.StartsWith("wont provision", StringComparison.Ordinal)
            || after.StartsWith("wont require", StringComparison.Ordinal)
            || after.StartsWith("wont need", StringComparison.Ordinal)
            || after.StartsWith("dont configure", StringComparison.Ordinal)
            || after.StartsWith("dont mandate", StringComparison.Ordinal)
            || after.StartsWith("dont apply", StringComparison.Ordinal)
            || after.StartsWith("dont enforce", StringComparison.Ordinal)
            || after.StartsWith("dont maintain", StringComparison.Ordinal)
            || after.StartsWith("dont ensure", StringComparison.Ordinal)
            || after.StartsWith("dont provision", StringComparison.Ordinal)
            || after.StartsWith("dont require", StringComparison.Ordinal)
            || after.StartsWith("dont need", StringComparison.Ordinal)
            || after.StartsWith("doesnt configure", StringComparison.Ordinal)
            || after.StartsWith("doesnt mandate", StringComparison.Ordinal)
            || after.StartsWith("doesnt apply", StringComparison.Ordinal)
            || after.StartsWith("doesnt enforce", StringComparison.Ordinal)
            || after.StartsWith("doesnt maintain", StringComparison.Ordinal)
            || after.StartsWith("doesnt ensure", StringComparison.Ordinal)
            || after.StartsWith("doesnt provision", StringComparison.Ordinal)
            || after.StartsWith("doesnt require", StringComparison.Ordinal)
            || after.StartsWith("doesnt need", StringComparison.Ordinal)
            || after.StartsWith("cant configure", StringComparison.Ordinal)
            || after.StartsWith("cant mandate", StringComparison.Ordinal)
            || after.StartsWith("cant apply", StringComparison.Ordinal)
            || after.StartsWith("cant enforce", StringComparison.Ordinal)
            || after.StartsWith("cant maintain", StringComparison.Ordinal)
            || after.StartsWith("cant ensure", StringComparison.Ordinal)
            || after.StartsWith("cant provision", StringComparison.Ordinal)
            || after.StartsWith("cant require", StringComparison.Ordinal)
            || after.StartsWith("cant need", StringComparison.Ordinal)
            || after.StartsWith("isnt configure", StringComparison.Ordinal)
            || after.StartsWith("isnt mandate", StringComparison.Ordinal)
            || after.StartsWith("isnt apply", StringComparison.Ordinal)
            || after.StartsWith("isnt enforce", StringComparison.Ordinal)
            || after.StartsWith("isnt maintain", StringComparison.Ordinal)
            || after.StartsWith("isnt ensure", StringComparison.Ordinal)
            || after.StartsWith("isnt provision", StringComparison.Ordinal)
            || after.StartsWith("isnt require", StringComparison.Ordinal)
            || after.StartsWith("isnt need", StringComparison.Ordinal)
            || after.StartsWith("wasnt configure", StringComparison.Ordinal)
            || after.StartsWith("wasnt mandate", StringComparison.Ordinal)
            || after.StartsWith("wasnt apply", StringComparison.Ordinal)
            || after.StartsWith("wasnt enforce", StringComparison.Ordinal)
            || after.StartsWith("wasnt maintain", StringComparison.Ordinal)
            || after.StartsWith("wasnt ensure", StringComparison.Ordinal)
            || after.StartsWith("wasnt provision", StringComparison.Ordinal)
            || after.StartsWith("wasnt require", StringComparison.Ordinal)
            || after.StartsWith("wasnt need", StringComparison.Ordinal)
            || after.StartsWith("hasnt configure", StringComparison.Ordinal)
            || after.StartsWith("hasnt mandate", StringComparison.Ordinal)
            || after.StartsWith("hasnt apply", StringComparison.Ordinal)
            || after.StartsWith("hasnt enforce", StringComparison.Ordinal)
            || after.StartsWith("hasnt maintain", StringComparison.Ordinal)
            || after.StartsWith("hasnt ensure", StringComparison.Ordinal)
            || after.StartsWith("hasnt provision", StringComparison.Ordinal)
            || after.StartsWith("hasnt require", StringComparison.Ordinal)
            || after.StartsWith("hasnt need", StringComparison.Ordinal)
            || after.StartsWith("couldnt configure", StringComparison.Ordinal)
            || after.StartsWith("couldnt mandate", StringComparison.Ordinal)
            || after.StartsWith("couldnt apply", StringComparison.Ordinal)
            || after.StartsWith("couldnt enforce", StringComparison.Ordinal)
            || after.StartsWith("couldnt maintain", StringComparison.Ordinal)
            || after.StartsWith("couldnt ensure", StringComparison.Ordinal)
            || after.StartsWith("couldnt provision", StringComparison.Ordinal)
            || after.StartsWith("couldnt require", StringComparison.Ordinal)
            || after.StartsWith("couldnt need", StringComparison.Ordinal)
            || after.StartsWith("wouldnt configure", StringComparison.Ordinal)
            || after.StartsWith("wouldnt mandate", StringComparison.Ordinal)
            || after.StartsWith("wouldnt apply", StringComparison.Ordinal)
            || after.StartsWith("wouldnt enforce", StringComparison.Ordinal)
            || after.StartsWith("wouldnt maintain", StringComparison.Ordinal)
            || after.StartsWith("wouldnt ensure", StringComparison.Ordinal)
            || after.StartsWith("wouldnt provision", StringComparison.Ordinal)
            || after.StartsWith("wouldnt require", StringComparison.Ordinal)
            || after.StartsWith("wouldnt need", StringComparison.Ordinal)
            || after.StartsWith("shouldnt configure", StringComparison.Ordinal)
            || after.StartsWith("shouldnt mandate", StringComparison.Ordinal)
            || after.StartsWith("shouldnt apply", StringComparison.Ordinal)
            || after.StartsWith("shouldnt enforce", StringComparison.Ordinal)
            || after.StartsWith("shouldnt maintain", StringComparison.Ordinal)
            || after.StartsWith("shouldnt ensure", StringComparison.Ordinal)
            || after.StartsWith("shouldnt provision", StringComparison.Ordinal)
            || after.StartsWith("shouldnt require", StringComparison.Ordinal)
            || after.StartsWith("shouldnt need", StringComparison.Ordinal)
            || after.StartsWith("mightnt configure", StringComparison.Ordinal)
            || after.StartsWith("mightnt mandate", StringComparison.Ordinal)
            || after.StartsWith("mightnt apply", StringComparison.Ordinal)
            || after.StartsWith("mightnt enforce", StringComparison.Ordinal)
            || after.StartsWith("mightnt maintain", StringComparison.Ordinal)
            || after.StartsWith("mightnt ensure", StringComparison.Ordinal)
            || after.StartsWith("mightnt provision", StringComparison.Ordinal)
            || after.StartsWith("mightnt require", StringComparison.Ordinal)
            || after.StartsWith("mightnt need", StringComparison.Ordinal)
            || after.StartsWith("shant configure", StringComparison.Ordinal)
            || after.StartsWith("shant mandate", StringComparison.Ordinal)
            || after.StartsWith("shant apply", StringComparison.Ordinal)
            || after.StartsWith("shant enforce", StringComparison.Ordinal)
            || after.StartsWith("shant maintain", StringComparison.Ordinal)
            || after.StartsWith("shant ensure", StringComparison.Ordinal)
            || after.StartsWith("shant provision", StringComparison.Ordinal)
            || after.StartsWith("shant require", StringComparison.Ordinal)
            || after.StartsWith("shant need", StringComparison.Ordinal)
            || after.StartsWith("didnt configure", StringComparison.Ordinal)
            || after.StartsWith("didnt mandate", StringComparison.Ordinal)
            || after.StartsWith("didnt apply", StringComparison.Ordinal)
            || after.StartsWith("didnt enforce", StringComparison.Ordinal)
            || after.StartsWith("didnt maintain", StringComparison.Ordinal)
            || after.StartsWith("didnt ensure", StringComparison.Ordinal)
            || after.StartsWith("didnt provision", StringComparison.Ordinal)
            || after.StartsWith("didnt require", StringComparison.Ordinal)
            || after.StartsWith("didnt need", StringComparison.Ordinal)
            || after.StartsWith("aint configure", StringComparison.Ordinal)
            || after.StartsWith("aint mandate", StringComparison.Ordinal)
            || after.StartsWith("aint apply", StringComparison.Ordinal)
            || after.StartsWith("aint enforce", StringComparison.Ordinal)
            || after.StartsWith("aint maintain", StringComparison.Ordinal)
            || after.StartsWith("aint ensure", StringComparison.Ordinal)
            || after.StartsWith("aint provision", StringComparison.Ordinal)
            || after.StartsWith("aint require", StringComparison.Ordinal)
            || after.StartsWith("aint need", StringComparison.Ordinal)
            || after.StartsWith("mustnt configure", StringComparison.Ordinal)
            || after.StartsWith("mustnt mandate", StringComparison.Ordinal)
            || after.StartsWith("mustnt apply", StringComparison.Ordinal)
            || after.StartsWith("mustnt enforce", StringComparison.Ordinal)
            || after.StartsWith("mustnt maintain", StringComparison.Ordinal)
            || after.StartsWith("mustnt ensure", StringComparison.Ordinal)
            || after.StartsWith("mustnt provision", StringComparison.Ordinal)
            || after.StartsWith("mustnt require", StringComparison.Ordinal)
            || after.StartsWith("mustnt need", StringComparison.Ordinal)
            || after.StartsWith("neednt configure", StringComparison.Ordinal)
            || after.StartsWith("neednt mandate", StringComparison.Ordinal)
            || after.StartsWith("neednt apply", StringComparison.Ordinal)
            || after.StartsWith("neednt enforce", StringComparison.Ordinal)
            || after.StartsWith("neednt maintain", StringComparison.Ordinal)
            || after.StartsWith("neednt ensure", StringComparison.Ordinal)
            || after.StartsWith("neednt provision", StringComparison.Ordinal)
            || after.StartsWith("neednt require", StringComparison.Ordinal)
            || after.StartsWith("neednt need", StringComparison.Ordinal)
            || after.StartsWith("havent configure", StringComparison.Ordinal)
            || after.StartsWith("havent mandate", StringComparison.Ordinal)
            || after.StartsWith("havent apply", StringComparison.Ordinal)
            || after.StartsWith("havent enforce", StringComparison.Ordinal)
            || after.StartsWith("havent maintain", StringComparison.Ordinal)
            || after.StartsWith("havent ensure", StringComparison.Ordinal)
            || after.StartsWith("havent provision", StringComparison.Ordinal)
            || after.StartsWith("havent require", StringComparison.Ordinal)
            || after.StartsWith("havent need", StringComparison.Ordinal)
            || after.StartsWith("werent configure", StringComparison.Ordinal)
            || after.StartsWith("werent mandate", StringComparison.Ordinal)
            || after.StartsWith("werent apply", StringComparison.Ordinal)
            || after.StartsWith("werent enforce", StringComparison.Ordinal)
            || after.StartsWith("werent maintain", StringComparison.Ordinal)
            || after.StartsWith("werent ensure", StringComparison.Ordinal)
            || after.StartsWith("werent provision", StringComparison.Ordinal)
            || after.StartsWith("werent require", StringComparison.Ordinal)
            || after.StartsWith("werent need", StringComparison.Ordinal)
            || after.StartsWith("arent configure", StringComparison.Ordinal)
            || after.StartsWith("arent mandate", StringComparison.Ordinal)
            || after.StartsWith("arent apply", StringComparison.Ordinal)
            || after.StartsWith("arent enforce", StringComparison.Ordinal)
            || after.StartsWith("arent maintain", StringComparison.Ordinal)
            || after.StartsWith("arent ensure", StringComparison.Ordinal)
            || after.StartsWith("arent provision", StringComparison.Ordinal)
            || after.StartsWith("arent require", StringComparison.Ordinal)
            || after.StartsWith("arent need", StringComparison.Ordinal)
            || after.StartsWith("darent configure", StringComparison.Ordinal)
            || after.StartsWith("darent mandate", StringComparison.Ordinal)
            || after.StartsWith("darent apply", StringComparison.Ordinal)
            || after.StartsWith("darent enforce", StringComparison.Ordinal)
            || after.StartsWith("darent maintain", StringComparison.Ordinal)
            || after.StartsWith("darent ensure", StringComparison.Ordinal)
            || after.StartsWith("darent provision", StringComparison.Ordinal)
            || after.StartsWith("darent require", StringComparison.Ordinal)
            || after.StartsWith("darent need", StringComparison.Ordinal)
            || after.StartsWith("maynt configure", StringComparison.Ordinal)
            || after.StartsWith("maynt mandate", StringComparison.Ordinal)
            || after.StartsWith("maynt apply", StringComparison.Ordinal)
            || after.StartsWith("maynt enforce", StringComparison.Ordinal)
            || after.StartsWith("maynt maintain", StringComparison.Ordinal)
            || after.StartsWith("maynt ensure", StringComparison.Ordinal)
            || after.StartsWith("maynt provision", StringComparison.Ordinal)
            || after.StartsWith("maynt require", StringComparison.Ordinal)
            || after.StartsWith("maynt need", StringComparison.Ordinal)
            || after.StartsWith("oughtnt configure", StringComparison.Ordinal)
            || after.StartsWith("oughtnt mandate", StringComparison.Ordinal)
            || after.StartsWith("oughtnt apply", StringComparison.Ordinal)
            || after.StartsWith("oughtnt enforce", StringComparison.Ordinal)
            || after.StartsWith("oughtnt maintain", StringComparison.Ordinal)
            || after.StartsWith("oughtnt ensure", StringComparison.Ordinal)
            || after.StartsWith("oughtnt provision", StringComparison.Ordinal)
            || after.StartsWith("oughtnt require", StringComparison.Ordinal)
            || after.StartsWith("oughtnt need", StringComparison.Ordinal)
            || after.StartsWith("hadnt configure", StringComparison.Ordinal)
            || after.StartsWith("hadnt mandate", StringComparison.Ordinal)
            || after.StartsWith("hadnt apply", StringComparison.Ordinal)
            || after.StartsWith("hadnt enforce", StringComparison.Ordinal)
            || after.StartsWith("hadnt maintain", StringComparison.Ordinal)
            || after.StartsWith("hadnt ensure", StringComparison.Ordinal)
            || after.StartsWith("hadnt provision", StringComparison.Ordinal)
            || after.StartsWith("hadnt require", StringComparison.Ordinal)
            || after.StartsWith("hadnt need", StringComparison.Ordinal)
            || after.StartsWith("neednot configure", StringComparison.Ordinal)
            || after.StartsWith("neednot mandate", StringComparison.Ordinal)
            || after.StartsWith("neednot apply", StringComparison.Ordinal)
            || after.StartsWith("neednot enforce", StringComparison.Ordinal)
            || after.StartsWith("neednot maintain", StringComparison.Ordinal)
            || after.StartsWith("neednot ensure", StringComparison.Ordinal)
            || after.StartsWith("neednot provision", StringComparison.Ordinal)
            || after.StartsWith("neednot require", StringComparison.Ordinal)
            || after.StartsWith("neednot need", StringComparison.Ordinal)
            || after.StartsWith("mustnot configure", StringComparison.Ordinal)
            || after.StartsWith("mustnot mandate", StringComparison.Ordinal)
            || after.StartsWith("mustnot apply", StringComparison.Ordinal)
            || after.StartsWith("mustnot enforce", StringComparison.Ordinal)
            || after.StartsWith("mustnot maintain", StringComparison.Ordinal)
            || after.StartsWith("mustnot ensure", StringComparison.Ordinal)
            || after.StartsWith("mustnot provision", StringComparison.Ordinal)
            || after.StartsWith("mustnot require", StringComparison.Ordinal)
            || after.StartsWith("mustnot need", StringComparison.Ordinal)
            || after.StartsWith("donot configure", StringComparison.Ordinal)
            || after.StartsWith("donot mandate", StringComparison.Ordinal)
            || after.StartsWith("donot apply", StringComparison.Ordinal)
            || after.StartsWith("donot enforce", StringComparison.Ordinal)
            || after.StartsWith("donot maintain", StringComparison.Ordinal)
            || after.StartsWith("donot ensure", StringComparison.Ordinal)
            || after.StartsWith("donot provision", StringComparison.Ordinal)
            || after.StartsWith("donot require", StringComparison.Ordinal)
            || after.StartsWith("donot need", StringComparison.Ordinal)
            || after.StartsWith("didnot configure", StringComparison.Ordinal)
            || after.StartsWith("didnot mandate", StringComparison.Ordinal)
            || after.StartsWith("didnot apply", StringComparison.Ordinal)
            || after.StartsWith("didnot enforce", StringComparison.Ordinal)
            || after.StartsWith("didnot maintain", StringComparison.Ordinal)
            || after.StartsWith("didnot ensure", StringComparison.Ordinal)
            || after.StartsWith("didnot provision", StringComparison.Ordinal)
            || after.StartsWith("didnot require", StringComparison.Ordinal)
            || after.StartsWith("didnot need", StringComparison.Ordinal)
            || after.StartsWith("hadnot configure", StringComparison.Ordinal)
            || after.StartsWith("hadnot mandate", StringComparison.Ordinal)
            || after.StartsWith("hadnot apply", StringComparison.Ordinal)
            || after.StartsWith("hadnot enforce", StringComparison.Ordinal)
            || after.StartsWith("hadnot maintain", StringComparison.Ordinal)
            || after.StartsWith("hadnot ensure", StringComparison.Ordinal)
            || after.StartsWith("hadnot provision", StringComparison.Ordinal)
            || after.StartsWith("hadnot require", StringComparison.Ordinal)
            || after.StartsWith("hadnot need", StringComparison.Ordinal)
            || after.StartsWith("hasnot configure", StringComparison.Ordinal)
            || after.StartsWith("hasnot mandate", StringComparison.Ordinal)
            || after.StartsWith("hasnot apply", StringComparison.Ordinal)
            || after.StartsWith("hasnot enforce", StringComparison.Ordinal)
            || after.StartsWith("hasnot maintain", StringComparison.Ordinal)
            || after.StartsWith("hasnot ensure", StringComparison.Ordinal)
            || after.StartsWith("hasnot provision", StringComparison.Ordinal)
            || after.StartsWith("hasnot require", StringComparison.Ordinal)
            || after.StartsWith("hasnot need", StringComparison.Ordinal)
            || after.StartsWith("wasnot configure", StringComparison.Ordinal)
            || after.StartsWith("wasnot mandate", StringComparison.Ordinal)
            || after.StartsWith("wasnot apply", StringComparison.Ordinal)
            || after.StartsWith("wasnot enforce", StringComparison.Ordinal)
            || after.StartsWith("wasnot maintain", StringComparison.Ordinal)
            || after.StartsWith("wasnot ensure", StringComparison.Ordinal)
            || after.StartsWith("wasnot provision", StringComparison.Ordinal)
            || after.StartsWith("wasnot require", StringComparison.Ordinal)
            || after.StartsWith("wasnot need", StringComparison.Ordinal)
            || after.StartsWith("isnot configure", StringComparison.Ordinal)
            || after.StartsWith("isnot mandate", StringComparison.Ordinal)
            || after.StartsWith("isnot apply", StringComparison.Ordinal)
            || after.StartsWith("isnot enforce", StringComparison.Ordinal)
            || after.StartsWith("isnot maintain", StringComparison.Ordinal)
            || after.StartsWith("isnot ensure", StringComparison.Ordinal)
            || after.StartsWith("isnot provision", StringComparison.Ordinal)
            || after.StartsWith("isnot require", StringComparison.Ordinal)
            || after.StartsWith("isnot need", StringComparison.Ordinal)
            || after.StartsWith("arenot configure", StringComparison.Ordinal)
            || after.StartsWith("arenot mandate", StringComparison.Ordinal)
            || after.StartsWith("arenot apply", StringComparison.Ordinal)
            || after.StartsWith("arenot enforce", StringComparison.Ordinal)
            || after.StartsWith("arenot maintain", StringComparison.Ordinal)
            || after.StartsWith("arenot ensure", StringComparison.Ordinal)
            || after.StartsWith("arenot provision", StringComparison.Ordinal)
            || after.StartsWith("arenot require", StringComparison.Ordinal)
            || after.StartsWith("arenot need", StringComparison.Ordinal)
            || after.StartsWith("werenot configure", StringComparison.Ordinal)
            || after.StartsWith("werenot mandate", StringComparison.Ordinal)
            || after.StartsWith("werenot apply", StringComparison.Ordinal)
            || after.StartsWith("werenot enforce", StringComparison.Ordinal)
            || after.StartsWith("werenot maintain", StringComparison.Ordinal)
            || after.StartsWith("werenot ensure", StringComparison.Ordinal)
            || after.StartsWith("werenot provision", StringComparison.Ordinal)
            || after.StartsWith("werenot require", StringComparison.Ordinal)
            || after.StartsWith("werenot need", StringComparison.Ordinal)
            || after.StartsWith("couldnot configure", StringComparison.Ordinal)
            || after.StartsWith("couldnot mandate", StringComparison.Ordinal)
            || after.StartsWith("couldnot apply", StringComparison.Ordinal)
            || after.StartsWith("couldnot enforce", StringComparison.Ordinal)
            || after.StartsWith("couldnot maintain", StringComparison.Ordinal)
            || after.StartsWith("couldnot ensure", StringComparison.Ordinal)
            || after.StartsWith("couldnot provision", StringComparison.Ordinal)
            || after.StartsWith("couldnot require", StringComparison.Ordinal)
            || after.StartsWith("couldnot need", StringComparison.Ordinal)
            || after.StartsWith("willnot configure", StringComparison.Ordinal)
            || after.StartsWith("willnot mandate", StringComparison.Ordinal)
            || after.StartsWith("willnot apply", StringComparison.Ordinal)
            || after.StartsWith("willnot enforce", StringComparison.Ordinal)
            || after.StartsWith("willnot maintain", StringComparison.Ordinal)
            || after.StartsWith("willnot ensure", StringComparison.Ordinal)
            || after.StartsWith("willnot provision", StringComparison.Ordinal)
            || after.StartsWith("willnot require", StringComparison.Ordinal)
            || after.StartsWith("willnot need", StringComparison.Ordinal)
            || after.StartsWith("shallnot configure", StringComparison.Ordinal)
            || after.StartsWith("shallnot mandate", StringComparison.Ordinal)
            || after.StartsWith("shallnot apply", StringComparison.Ordinal)
            || after.StartsWith("shallnot enforce", StringComparison.Ordinal)
            || after.StartsWith("shallnot maintain", StringComparison.Ordinal)
            || after.StartsWith("shallnot ensure", StringComparison.Ordinal)
            || after.StartsWith("shallnot provision", StringComparison.Ordinal)
            || after.StartsWith("shallnot require", StringComparison.Ordinal)
            || after.StartsWith("shallnot need", StringComparison.Ordinal)
            || after.StartsWith("shouldnot configure", StringComparison.Ordinal)
            || after.StartsWith("shouldnot mandate", StringComparison.Ordinal)
            || after.StartsWith("shouldnot apply", StringComparison.Ordinal)
            || after.StartsWith("shouldnot enforce", StringComparison.Ordinal)
            || after.StartsWith("shouldnot maintain", StringComparison.Ordinal)
            || after.StartsWith("shouldnot ensure", StringComparison.Ordinal)
            || after.StartsWith("shouldnot provision", StringComparison.Ordinal)
            || after.StartsWith("shouldnot require", StringComparison.Ordinal)
            || after.StartsWith("shouldnot need", StringComparison.Ordinal)
            || after.StartsWith("wouldnot configure", StringComparison.Ordinal)
            || after.StartsWith("wouldnot mandate", StringComparison.Ordinal)
            || after.StartsWith("wouldnot apply", StringComparison.Ordinal)
            || after.StartsWith("wouldnot enforce", StringComparison.Ordinal)
            || after.StartsWith("wouldnot maintain", StringComparison.Ordinal)
            || after.StartsWith("wouldnot ensure", StringComparison.Ordinal)
            || after.StartsWith("wouldnot provision", StringComparison.Ordinal)
            || after.StartsWith("wouldnot require", StringComparison.Ordinal)
            || after.StartsWith("wouldnot need", StringComparison.Ordinal)
            || after.StartsWith("doesnot configure", StringComparison.Ordinal)
            || after.StartsWith("doesnot mandate", StringComparison.Ordinal)
            || after.StartsWith("doesnot apply", StringComparison.Ordinal)
            || after.StartsWith("doesnot enforce", StringComparison.Ordinal)
            || after.StartsWith("doesnot maintain", StringComparison.Ordinal)
            || after.StartsWith("doesnot ensure", StringComparison.Ordinal)
            || after.StartsWith("doesnot provision", StringComparison.Ordinal)
            || after.StartsWith("doesnot require", StringComparison.Ordinal)
            || after.StartsWith("doesnot need", StringComparison.Ordinal)
            || after.StartsWith("oughtnot configure", StringComparison.Ordinal)
            || after.StartsWith("oughtnot mandate", StringComparison.Ordinal)
            || after.StartsWith("oughtnot apply", StringComparison.Ordinal)
            || after.StartsWith("oughtnot enforce", StringComparison.Ordinal)
            || after.StartsWith("oughtnot maintain", StringComparison.Ordinal)
            || after.StartsWith("oughtnot ensure", StringComparison.Ordinal)
            || after.StartsWith("oughtnot provision", StringComparison.Ordinal)
            || after.StartsWith("oughtnot require", StringComparison.Ordinal)
            || after.StartsWith("oughtnot need", StringComparison.Ordinal)
            || after.StartsWith("mightnot configure", StringComparison.Ordinal)
            || after.StartsWith("mightnot mandate", StringComparison.Ordinal)
            || after.StartsWith("mightnot apply", StringComparison.Ordinal)
            || after.StartsWith("mightnot enforce", StringComparison.Ordinal)
            || after.StartsWith("mightnot maintain", StringComparison.Ordinal)
            || after.StartsWith("mightnot ensure", StringComparison.Ordinal)
            || after.StartsWith("mightnot provision", StringComparison.Ordinal)
            || after.StartsWith("mightnot require", StringComparison.Ordinal)
            || after.StartsWith("mightnot need", StringComparison.Ordinal)
            || after.StartsWith("maynot configure", StringComparison.Ordinal)
            || after.StartsWith("maynot mandate", StringComparison.Ordinal)
            || after.StartsWith("maynot apply", StringComparison.Ordinal)
            || after.StartsWith("maynot enforce", StringComparison.Ordinal)
            || after.StartsWith("maynot maintain", StringComparison.Ordinal)
            || after.StartsWith("maynot ensure", StringComparison.Ordinal)
            || after.StartsWith("maynot provision", StringComparison.Ordinal)
            || after.StartsWith("maynot require", StringComparison.Ordinal)
            || after.StartsWith("maynot need", StringComparison.Ordinal)
            || after.StartsWith("havenot configure", StringComparison.Ordinal)
            || after.StartsWith("havenot mandate", StringComparison.Ordinal)
            || after.StartsWith("havenot apply", StringComparison.Ordinal)
            || after.StartsWith("havenot enforce", StringComparison.Ordinal)
            || after.StartsWith("havenot maintain", StringComparison.Ordinal)
            || after.StartsWith("havenot ensure", StringComparison.Ordinal)
            || after.StartsWith("havenot provision", StringComparison.Ordinal)
            || after.StartsWith("havenot require", StringComparison.Ordinal)
            || after.StartsWith("havenot need", StringComparison.Ordinal)
            || after.StartsWith("aintnot configure", StringComparison.Ordinal)
            || after.StartsWith("aintnot mandate", StringComparison.Ordinal)
            || after.StartsWith("aintnot apply", StringComparison.Ordinal)
            || after.StartsWith("aintnot enforce", StringComparison.Ordinal)
            || after.StartsWith("aintnot maintain", StringComparison.Ordinal)
            || after.StartsWith("aintnot ensure", StringComparison.Ordinal)
            || after.StartsWith("aintnot provision", StringComparison.Ordinal)
            || after.StartsWith("aintnot require", StringComparison.Ordinal)
            || after.StartsWith("aintnot need", StringComparison.Ordinal)
            || after.StartsWith("darentnot configure", StringComparison.Ordinal)
            || after.StartsWith("darentnot mandate", StringComparison.Ordinal)
            || after.StartsWith("darentnot apply", StringComparison.Ordinal)
            || after.StartsWith("darentnot enforce", StringComparison.Ordinal)
            || after.StartsWith("darentnot maintain", StringComparison.Ordinal)
            || after.StartsWith("darentnot ensure", StringComparison.Ordinal)
            || after.StartsWith("darentnot provision", StringComparison.Ordinal)
            || after.StartsWith("darentnot require", StringComparison.Ordinal)
            || after.StartsWith("darentnot need", StringComparison.Ordinal)
            || after.StartsWith("arentnot configure", StringComparison.Ordinal)
            || after.StartsWith("arentnot mandate", StringComparison.Ordinal)
            || after.StartsWith("arentnot apply", StringComparison.Ordinal)
            || after.StartsWith("arentnot enforce", StringComparison.Ordinal)
            || after.StartsWith("arentnot maintain", StringComparison.Ordinal)
            || after.StartsWith("arentnot ensure", StringComparison.Ordinal)
            || after.StartsWith("arentnot provision", StringComparison.Ordinal)
            || after.StartsWith("arentnot require", StringComparison.Ordinal)
            || after.StartsWith("arentnot need", StringComparison.Ordinal)
            || after.StartsWith("isntnot configure", StringComparison.Ordinal)
            || after.StartsWith("isntnot mandate", StringComparison.Ordinal)
            || after.StartsWith("isntnot apply", StringComparison.Ordinal)
            || after.StartsWith("isntnot enforce", StringComparison.Ordinal)
            || after.StartsWith("isntnot maintain", StringComparison.Ordinal)
            || after.StartsWith("isntnot ensure", StringComparison.Ordinal)
            || after.StartsWith("isntnot provision", StringComparison.Ordinal)
            || after.StartsWith("isntnot require", StringComparison.Ordinal)
            || after.StartsWith("isntnot need", StringComparison.Ordinal)
            || after.StartsWith("wasntnot configure", StringComparison.Ordinal)
            || after.StartsWith("wasntnot mandate", StringComparison.Ordinal)
            || after.StartsWith("wasntnot apply", StringComparison.Ordinal)
            || after.StartsWith("wasntnot enforce", StringComparison.Ordinal)
            || after.StartsWith("wasntnot maintain", StringComparison.Ordinal)
            || after.StartsWith("wasntnot ensure", StringComparison.Ordinal)
            || after.StartsWith("wasntnot provision", StringComparison.Ordinal)
            || after.StartsWith("wasntnot require", StringComparison.Ordinal)
            || after.StartsWith("wasntnot need", StringComparison.Ordinal)
            || after.StartsWith("werentnot configure", StringComparison.Ordinal)
            || after.StartsWith("werentnot mandate", StringComparison.Ordinal)
            || after.StartsWith("werentnot apply", StringComparison.Ordinal)
            || after.StartsWith("werentnot enforce", StringComparison.Ordinal)
            || after.StartsWith("werentnot maintain", StringComparison.Ordinal)
            || after.StartsWith("werentnot ensure", StringComparison.Ordinal)
            || after.StartsWith("werentnot provision", StringComparison.Ordinal)
            || after.StartsWith("werentnot require", StringComparison.Ordinal)
            || after.StartsWith("werentnot need", StringComparison.Ordinal)
            || after.StartsWith("haventnot configure", StringComparison.Ordinal)
            || after.StartsWith("haventnot mandate", StringComparison.Ordinal)
            || after.StartsWith("haventnot apply", StringComparison.Ordinal)
            || after.StartsWith("haventnot enforce", StringComparison.Ordinal)
            || after.StartsWith("haventnot maintain", StringComparison.Ordinal)
            || after.StartsWith("haventnot ensure", StringComparison.Ordinal)
            || after.StartsWith("haventnot provision", StringComparison.Ordinal)
            || after.StartsWith("haventnot require", StringComparison.Ordinal)
            || after.StartsWith("haventnot need", StringComparison.Ordinal)
            || after.StartsWith("hasntnot configure", StringComparison.Ordinal)
            || after.StartsWith("hasntnot mandate", StringComparison.Ordinal)
            || after.StartsWith("hasntnot apply", StringComparison.Ordinal)
            || after.StartsWith("hasntnot enforce", StringComparison.Ordinal)
            || after.StartsWith("hasntnot maintain", StringComparison.Ordinal)
            || after.StartsWith("hasntnot ensure", StringComparison.Ordinal)
            || after.StartsWith("hasntnot provision", StringComparison.Ordinal)
            || after.StartsWith("hasntnot require", StringComparison.Ordinal)
            || after.StartsWith("hasntnot need", StringComparison.Ordinal)
            || after.StartsWith("hadntnot configure", StringComparison.Ordinal)
            || after.StartsWith("hadntnot mandate", StringComparison.Ordinal)
            || after.StartsWith("hadntnot apply", StringComparison.Ordinal)
            || after.StartsWith("hadntnot enforce", StringComparison.Ordinal)
            || after.StartsWith("hadntnot maintain", StringComparison.Ordinal)
            || after.StartsWith("hadntnot ensure", StringComparison.Ordinal)
            || after.StartsWith("hadntnot provision", StringComparison.Ordinal)
            || after.StartsWith("hadntnot require", StringComparison.Ordinal)
            || after.StartsWith("hadntnot need", StringComparison.Ordinal)
            || after.StartsWith("didntnot configure", StringComparison.Ordinal)
            || after.StartsWith("didntnot mandate", StringComparison.Ordinal)
            || after.StartsWith("didntnot apply", StringComparison.Ordinal)
            || after.StartsWith("didntnot enforce", StringComparison.Ordinal)
            || after.StartsWith("didntnot maintain", StringComparison.Ordinal)
            || after.StartsWith("didntnot ensure", StringComparison.Ordinal)
            || after.StartsWith("didntnot provision", StringComparison.Ordinal)
            || after.StartsWith("didntnot require", StringComparison.Ordinal)
            || after.StartsWith("didntnot need", StringComparison.Ordinal)
            || after.StartsWith("doesntnot configure", StringComparison.Ordinal)
            || after.StartsWith("doesntnot mandate", StringComparison.Ordinal)
            || after.StartsWith("doesntnot apply", StringComparison.Ordinal)
            || after.StartsWith("doesntnot enforce", StringComparison.Ordinal)
            || after.StartsWith("doesntnot maintain", StringComparison.Ordinal)
            || after.StartsWith("doesntnot ensure", StringComparison.Ordinal)
            || after.StartsWith("doesntnot provision", StringComparison.Ordinal)
            || after.StartsWith("doesntnot require", StringComparison.Ordinal)
            || after.StartsWith("doesntnot need", StringComparison.Ordinal)
            || after.StartsWith("doesn't configure", StringComparison.Ordinal)
            || after.StartsWith("doesn't apply", StringComparison.Ordinal)
            || after.StartsWith("doesn't mandate", StringComparison.Ordinal)
            || after.StartsWith("doesn't maintain", StringComparison.Ordinal)
            || after.StartsWith("doesn't ensure", StringComparison.Ordinal)
            || after.StartsWith("doesn't provision", StringComparison.Ordinal)
            || after.StartsWith("doesn't enforce", StringComparison.Ordinal)
            || after.StartsWith("need not enforce", StringComparison.Ordinal)
            || after.StartsWith("need not apply", StringComparison.Ordinal)
            || after.StartsWith("need not mandate", StringComparison.Ordinal)
            || after.StartsWith("need not provision", StringComparison.Ordinal)
            || after.StartsWith("need not configure", StringComparison.Ordinal)
            || after.StartsWith("need not require", StringComparison.Ordinal)
            || after.StartsWith("need not implement", StringComparison.Ordinal)
            || after.StartsWith("need not enable", StringComparison.Ordinal)
            || after.StartsWith("need not use", StringComparison.Ordinal)
            || after.StartsWith("need not have", StringComparison.Ordinal)
            || after.StartsWith("need not deploy", StringComparison.Ordinal)
            || after.StartsWith("need not need", StringComparison.Ordinal)
            || after.StartsWith("does not implement", StringComparison.Ordinal)
            || after.StartsWith("does not enable", StringComparison.Ordinal)
            || after.StartsWith("does not deploy", StringComparison.Ordinal)
            || after.StartsWith("does not adopt", StringComparison.Ordinal)
            || after.StartsWith("does not use", StringComparison.Ordinal)
            || after.StartsWith("does not have", StringComparison.Ordinal)
            || after.StartsWith("cannot implement", StringComparison.Ordinal)
            || after.StartsWith("cannot enable", StringComparison.Ordinal)
            || after.StartsWith("cannot deploy", StringComparison.Ordinal)
            || after.StartsWith("cannot adopt", StringComparison.Ordinal)
            || after.StartsWith("cannot use", StringComparison.Ordinal)
            || after.StartsWith("cannot have", StringComparison.Ordinal)
            || after.StartsWith("will not implement", StringComparison.Ordinal)
            || after.StartsWith("will not enable", StringComparison.Ordinal)
            || after.StartsWith("will not deploy", StringComparison.Ordinal)
            || after.StartsWith("will not adopt", StringComparison.Ordinal)
            || after.StartsWith("will not use", StringComparison.Ordinal)
            || after.StartsWith("will not have", StringComparison.Ordinal)
            || after.StartsWith("would not implement", StringComparison.Ordinal)
            || after.StartsWith("would not enable", StringComparison.Ordinal)
            || after.StartsWith("would not deploy", StringComparison.Ordinal)
            || after.StartsWith("would not adopt", StringComparison.Ordinal)
            || after.StartsWith("would not use", StringComparison.Ordinal)
            || after.StartsWith("would not have", StringComparison.Ordinal)
            || after.StartsWith("ought not implement", StringComparison.Ordinal)
            || after.StartsWith("ought not enable", StringComparison.Ordinal)
            || after.StartsWith("ought not deploy", StringComparison.Ordinal)
            || after.StartsWith("ought not adopt", StringComparison.Ordinal)
            || after.StartsWith("ought not use", StringComparison.Ordinal)
            || after.StartsWith("ought not have", StringComparison.Ordinal)
            || after.StartsWith("should not implement", StringComparison.Ordinal)
            || after.StartsWith("should not enable", StringComparison.Ordinal)
            || after.StartsWith("should not deploy", StringComparison.Ordinal)
            || after.StartsWith("should not adopt", StringComparison.Ordinal)
            || after.StartsWith("should not use", StringComparison.Ordinal)
            || after.StartsWith("should not have", StringComparison.Ordinal)
            || after.StartsWith("shall not implement", StringComparison.Ordinal)
            || after.StartsWith("shall not enable", StringComparison.Ordinal)
            || after.StartsWith("shall not deploy", StringComparison.Ordinal)
            || after.StartsWith("shall not adopt", StringComparison.Ordinal)
            || after.StartsWith("shall not use", StringComparison.Ordinal)
            || after.StartsWith("shall not have", StringComparison.Ordinal)
            || after.StartsWith("must not implement", StringComparison.Ordinal)
            || after.StartsWith("must not enable", StringComparison.Ordinal)
            || after.StartsWith("must not deploy", StringComparison.Ordinal)
            || after.StartsWith("must not adopt", StringComparison.Ordinal)
            || after.StartsWith("must not use", StringComparison.Ordinal)
            || after.StartsWith("must not have", StringComparison.Ordinal)
            || after.StartsWith("must not maintain", StringComparison.Ordinal)
            || after.StartsWith("must not provision", StringComparison.Ordinal)
            || after.StartsWith("must not apply", StringComparison.Ordinal)
            || after.StartsWith("must not configure", StringComparison.Ordinal)
            || after.StartsWith("must not enforce", StringComparison.Ordinal)
            || after.StartsWith("must not mandate", StringComparison.Ordinal)
            || after.StartsWith("must not require", StringComparison.Ordinal)
            || after.StartsWith("must not need", StringComparison.Ordinal)
            || after.StartsWith("must not ensure", StringComparison.Ordinal)
            || after.StartsWith("cannot require", StringComparison.Ordinal)
            || after.StartsWith("cannot need", StringComparison.Ordinal);
    }

    /// <summary>
    ///     True when the finding message anchors to a specific uploaded element, not generic posture.
    /// </summary>
    public static bool HasArchitectureSpecificAnchor(string? message, IReadOnlyList<string> evidenceRefs)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;

        string trimmed = message.Trim();

        if (UnderSpecifiedFindingPattern().IsMatch(trimmed) || ConflictFindingPattern().IsMatch(trimmed))
        {
            if (HasConcreteEvidenceCitation(evidenceRefs))
                return true;

            return HasQuotedResourceNameInEvidence(trimmed, evidenceRefs);
        }

        if (!ArchitectureAnchorPattern().IsMatch(trimmed))
            return false;

        if (IsGenericImperativeWithPascalCaseServiceOnly(trimmed))
            return false;

        return true;
    }

    /// <summary>
    ///     True when the message encodes a falsifiable architecture signal (under-specified or conflict wording).
    /// </summary>
    public static bool HasFalsifiabilitySignal(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return false;
        }

        string trimmed = message.Trim();

        if (UnderSpecifiedFindingPattern().IsMatch(trimmed))
        {
            return true;
        }

        if (ConflictFindingPattern().IsMatch(trimmed))
        {
            return true;
        }

        return false;
    }

    public static bool HasConcreteEvidenceCitation(IReadOnlyList<string> evidenceRefs)
    {
        if (evidenceRefs.Count == 0)
            return false;

        foreach (string evidenceRef in evidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(evidenceRef))
                continue;

            string trimmed = evidenceRef.Trim();

            if (IsGenericEvidenceRef(trimmed))
                continue;

            if (IsResolvableEvidenceRef(trimmed))
                return true;
        }

        return false;
    }

    private static bool IsResolvableEvidenceRef(string trimmed)
    {
        if (trimmed.StartsWith("doc:", StringComparison.OrdinalIgnoreCase))
            return trimmed.Length > "doc:".Length;

        if (trimmed.StartsWith("policy-rule:", StringComparison.OrdinalIgnoreCase))
        {
            string ruleId = trimmed["policy-rule:".Length..].Trim();

            return !string.IsNullOrWhiteSpace(ruleId);
        }

        if (trimmed.StartsWith("graph-node:", StringComparison.OrdinalIgnoreCase))
        {
            string nodeId = trimmed["graph-node:".Length..].Trim();

            return IsProductShapedGraphNodeId(nodeId);
        }

        if (trimmed.StartsWith("finding:", StringComparison.OrdinalIgnoreCase))
        {
            string findingId = trimmed["finding:".Length..].Trim();

            return !string.IsNullOrWhiteSpace(findingId);
        }

        if (trimmed.StartsWith("aws:arn:", StringComparison.OrdinalIgnoreCase))
            return trimmed.Length > "aws:arn:".Length;

        if (trimmed.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            && trimmed.Contains("resourceGroups/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (trimmed.Contains("projects/", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static bool IsProductShapedGraphNodeId(string nodeId)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
            return false;

        // Bare GUIDs in graph-node: refs are not resolvable package evidence.
        if (Guid.TryParse(nodeId, out _))
            return false;

        return nodeId.Length >= 3;
    }

    private static bool HasQuotedResourceNameInEvidence(string message, IReadOnlyList<string> evidenceRefs)
    {
        foreach (string evidenceRef in evidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(evidenceRef))
                continue;

            string trimmed = evidenceRef.Trim();

            if (IsGenericEvidenceRef(trimmed))
                continue;

            string unquoted = trimmed.Trim('`', '\'');

            if (string.IsNullOrWhiteSpace(unquoted))
                continue;

            if (message.Contains("`" + unquoted + "`", StringComparison.Ordinal))
                return true;

            if (message.Contains("'" + unquoted + "'", StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static bool IsGenericImperativeWithPascalCaseServiceOnly(string message)
    {
        if (!ImperativeGenericAdvice().IsMatch(message))
            return false;

        if (message.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || message.Contains("resourceGroups/", StringComparison.OrdinalIgnoreCase)
            || message.Contains("doc:", StringComparison.OrdinalIgnoreCase)
            || message.Contains('`'))
            return false;

        return PascalCaseServiceTokenPattern().IsMatch(message);
    }

    private static bool IsGenericEvidenceRef(string normalized)
    {
        return normalized.Equals("request", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("critic-checklist", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("architecture-request", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex(
        @"(\/subscriptions\/|resourceGroups\/|doc:[^\s]+(?:#L\d+)?|services\[\]|datastores\[\]|`[^`]+`|'[^']+')",
        RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex ArchitectureAnchorPattern();

    [GeneratedRegex(
        @"\b[A-Z][a-zA-Z0-9]+(?:Api|Svc|Service|Gateway|Worker|Function|Queue|Store|Db|Sql)\b",
        RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex PascalCaseServiceTokenPattern();

    [GeneratedRegex(
        @"(\b(UnderSpecified|Under-Specified|NotSpecified|Missing[A-Z][a-zA-Z]+)\b|[A-Za-z]+UnderSpecified\b)",
        RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex UnderSpecifiedFindingPattern();

    [GeneratedRegex(@"\b(conflicts? with|contradicts?|violates? constraint)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex ConflictFindingPattern();

    [GeneratedRegex(
        @"^(enable|use|implement|ensure|consider|apply|adopt|configure|turn on|set up)\s+("
        + "mfa|https|tls|ssl|encryption|logging|monitoring|firewall|rbac|backups?|key vault|private endpoints?|managed identit"
        + "|cloudtrail|guardduty|security hub|kms|iam roles?|iam policies?|security groups?|secrets manager|secret manager"
        + "|waf|cloud armor|network polic|pod security|resource limits?|resource requests?|image scanning|service mesh mtls"
        + ")",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex ImperativeGenericAdvice();
}
