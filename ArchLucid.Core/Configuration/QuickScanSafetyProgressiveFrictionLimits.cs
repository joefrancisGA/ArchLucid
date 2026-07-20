namespace ArchLucid.Core.Configuration;

/// <summary>Progressive friction before CAPTCHA or sign-in for anonymous Quick Scan.</summary>
public sealed class QuickScanSafetyProgressiveFrictionLimits
{
    public int ScansBeforeCaptchaRequired { get; set; } = 2;

    public int ScansBeforeSignInRequired { get; set; } = 2;

    public bool CaptchaEnabled { get; set; }

    public bool SignInFrictionEnabled { get; set; } = true;
}
