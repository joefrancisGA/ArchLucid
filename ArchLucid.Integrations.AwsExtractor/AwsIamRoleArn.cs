namespace ArchLucid.Integrations.AwsExtractor;

internal static class AwsIamRoleArn
{
    private const string IamRoleArnInfix = ":iam::";

    public static bool TryGetAccountId(string roleArn, out string accountId)
    {
        accountId = string.Empty;

        if (string.IsNullOrWhiteSpace(roleArn))
            return false;

        string trimmed = roleArn.Trim();

        if (!trimmed.StartsWith("arn:", StringComparison.OrdinalIgnoreCase))
            return false;

        int iamInfixIndex = trimmed.IndexOf(IamRoleArnInfix, StringComparison.OrdinalIgnoreCase);

        if (iamInfixIndex < 0)
            return false;

        int accountStart = iamInfixIndex + IamRoleArnInfix.Length;
        int colonAfterAccount = trimmed.IndexOf(':', accountStart);

        if (colonAfterAccount <= accountStart)
            return false;

        accountId = trimmed.Substring(accountStart, colonAfterAccount - accountStart);

        if (accountId.Length != 12)
            return false;

        foreach (char digit in accountId)
        {
            if (!char.IsDigit(digit))
                return false;
        }

        int resourceStart = colonAfterAccount + 1;
        ReadOnlySpan<char> resource = trimmed.AsSpan(resourceStart);

        if (!resource.StartsWith("role/", StringComparison.OrdinalIgnoreCase)
            || resource.Length == "role/".Length)
        {
            accountId = string.Empty;
            return false;
        }

        return true;
    }

    public static void EnsureAccountMatches(string accountId, string roleArn)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accountId);

        if (!TryGetAccountId(roleArn, out string roleAccountId))
            throw new ArgumentException("Role ARN is not a valid IAM role ARN.", nameof(roleArn));

        if (!string.Equals(accountId.Trim(), roleAccountId, StringComparison.Ordinal))
            throw new ArgumentException(
                $"Account ID '{accountId.Trim()}' does not match IAM role ARN account '{roleAccountId}'.",
                nameof(accountId));
    }
}
