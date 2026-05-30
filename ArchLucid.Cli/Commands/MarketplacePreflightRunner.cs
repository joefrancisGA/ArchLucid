using System.Text;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Static checks mirroring the **automated** portions of
///     <c>docs/go-to-market/MARKETPLACE_PUBLICATION.md</c> + linked billing docs. Owner-only Partner Center
///     steps (seller verification, tax profile, payout) are not machine-verifiable here — see that checklist.
/// </summary>
public static class MarketplacePreflightRunner
{
    /// <summary>
    ///     Copied from <c>PRICING_PHILOSOPHY.md</c> §3 tier overview — keep in sync with
    ///     <c>assert_marketplace_pricing_alignment.py</c>.
    /// </summary>
    public const string CanonicalPackagingRow = "| **Team** | **Professional** | **Enterprise** |";

    /// <summary>Copied from <c>MARKETPLACE_PUBLICATION.md</c> publication step 1.</summary>
    public const string MarketplacePlanTierTriple = "`Team` / `Professional` / `Enterprise`";

    /// <summary>
    ///     Runs all automated checks under <paramref name="repositoryRoot" /> (absolute path to repo root).
    /// </summary>
    public static IReadOnlyList<MarketplacePreflightStepResult> Evaluate(string repositoryRoot)
    {
        if (string.IsNullOrWhiteSpace(repositoryRoot))
            throw new ArgumentException("Repository root is required.", nameof(repositoryRoot));

        string root = Path.GetFullPath(repositoryRoot.Trim());
        List<MarketplacePreflightStepResult> steps = [];

        string? pricing = TryReadUtf8(root, Path.Combine("docs", "go-to-market", "PRICING_PHILOSOPHY.md"));
        steps.Add(
            new MarketplacePreflightStepResult(
                "pricing_philosophy_doc",
                pricing is not null,
                pricing is not null
                    ? "Found docs/go-to-market/PRICING_PHILOSOPHY.md"
                    : "Missing docs/go-to-market/PRICING_PHILOSOPHY.md"));

        if (pricing is not null)

            steps.Add(
                new MarketplacePreflightStepResult(
                    "pricing_canonical_packaging_row",
                    pricing.Contains(CanonicalPackagingRow, StringComparison.Ordinal),
                    pricing.Contains(CanonicalPackagingRow, StringComparison.Ordinal)
                        ? "PRICING_PHILOSOPHY.md contains canonical Team | Professional | Enterprise row"
                        : "PRICING_PHILOSOPHY.md is missing the canonical packaging row (see assert_marketplace_pricing_alignment.py)."));

        string? publication = TryReadUtf8(root, Path.Combine("docs", "go-to-market", "MARKETPLACE_PUBLICATION.md"));
        steps.Add(
            new MarketplacePreflightStepResult(
                "marketplace_publication_doc",
                publication is not null,
                publication is not null
                    ? "Found docs/go-to-market/MARKETPLACE_PUBLICATION.md"
                    : "Missing docs/go-to-market/MARKETPLACE_PUBLICATION.md"));

        if (publication is not null)

            steps.Add(
                new MarketplacePreflightStepResult(
                    "publication_plan_tier_triple",
                    publication.Contains(MarketplacePlanTierTriple, StringComparison.Ordinal),
                    publication.Contains(MarketplacePlanTierTriple, StringComparison.Ordinal)
                        ? "MARKETPLACE_PUBLICATION.md references Team / Professional / Enterprise plan mapping"
                        : $"MARKETPLACE_PUBLICATION.md must include the tier triple: {MarketplacePlanTierTriple}"));

        string? azureSaaS = TryReadUtf8(root, Path.Combine("docs", "go-to-market", "AZURE_MARKETPLACE_SAAS_OFFER.md"));
        steps.Add(
            new MarketplacePreflightStepResult(
                "azure_marketplace_saas_doc",
                azureSaaS is not null,
                azureSaaS is not null
                    ? "Found docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md"
                    : "Missing docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md"));

        if (azureSaaS is not null)
        {
            bool noProSlug = !azureSaaS.Contains("`Pro`", StringComparison.Ordinal);
            steps.Add(
                new MarketplacePreflightStepResult(
                    "azure_no_pro_tier_slug",
                    noProSlug,
                    noProSlug
                        ? "AZURE_MARKETPLACE_SAAS_OFFER.md does not use deprecated `Pro` tier slug"
                        : "AZURE_MARKETPLACE_SAAS_OFFER.md must not use `Pro`; use Professional per PRICING_PHILOSOPHY.md."));

            bool mentionsProfessional = azureSaaS.Contains("Professional", StringComparison.Ordinal);
            steps.Add(
                new MarketplacePreflightStepResult(
                    "azure_mentions_professional",
                    mentionsProfessional,
                    mentionsProfessional
                        ? "AZURE_MARKETPLACE_SAAS_OFFER.md mentions Professional tier"
                        : "AZURE_MARKETPLACE_SAAS_OFFER.md must mention Professional (Partner Center naming)."));
        }

        string? billing = TryReadUtf8(root, Path.Combine("docs", "library", "BILLING.md"));
        steps.Add(
            new MarketplacePreflightStepResult(
                "billing_doc",
                billing is not null,
                billing is not null ? "Found docs/library/BILLING.md" : "Missing docs/library/BILLING.md"));

        if (billing is not null)
        {
            bool stripeRoute = billing.Contains("/v1/billing/webhooks/stripe", StringComparison.Ordinal);
            steps.Add(
                new MarketplacePreflightStepResult(
                    "billing_doc_stripe_webhook_route",
                    stripeRoute,
                    stripeRoute
                        ? "BILLING.md documents POST /v1/billing/webhooks/stripe"
                        : "BILLING.md must document POST /v1/billing/webhooks/stripe"));

            bool marketplaceRoute = billing.Contains("/v1/billing/webhooks/marketplace", StringComparison.Ordinal);
            steps.Add(
                new MarketplacePreflightStepResult(
                    "billing_doc_marketplace_webhook_route",
                    marketplaceRoute,
                    marketplaceRoute
                        ? "BILLING.md documents POST /v1/billing/webhooks/marketplace"
                        : "BILLING.md must document POST /v1/billing/webhooks/marketplace"));
        }

        string? appSettings = TryReadUtf8(root, Path.Combine("ArchLucid.Api", "appsettings.json"));
        steps.Add(
            new MarketplacePreflightStepResult(
                "appsettings_json",
                appSettings is not null,
                appSettings is not null
                    ? "Found ArchLucid.Api/appsettings.json"
                    : "Missing ArchLucid.Api/appsettings.json"));

        if (appSettings is null)
            return steps;

        bool offerKey = appSettings.Contains("\"MarketplaceOfferId\"", StringComparison.Ordinal);
        steps.Add(
            new MarketplacePreflightStepResult(
                "appsettings_marketplace_offer_id_key",
                offerKey,
                offerKey
                    ? "ArchLucid.Api/appsettings.json includes Billing:AzureMarketplace:MarketplaceOfferId"
                    : "ArchLucid.Api/appsettings.json must define MarketplaceOfferId under Billing:AzureMarketplace"));

        AppendStripeCheckoutSteps(root, steps);
        AppendOwnerOnlySteps(steps);

        return steps;
    }

    private static void AppendStripeCheckoutSteps(string root, List<MarketplacePreflightStepResult> steps)
    {
        string? pricingJson = TryReadUtf8(root, Path.Combine("archlucid-ui", "public", "pricing.json"));

        if (pricingJson is null)
        {
            steps.Add(
                new MarketplacePreflightStepResult(
                    "pricing_json_present",
                    false,
                    "Missing archlucid-ui/public/pricing.json"));

            return;
        }

        steps.Add(
            new MarketplacePreflightStepResult(
                "pricing_json_present",
                true,
                "Found archlucid-ui/public/pricing.json"));

        string? checkoutUrl = TryReadJsonStringProperty(pricingJson, "teamStripeCheckoutUrl");
        string classification = TeamStripeCheckoutPreflightClassifier.Classify(checkoutUrl);

        switch (classification)
        {
            case TeamStripeCheckoutPreflightClassifier.Placeholder:
                steps.Add(
                    new MarketplacePreflightStepResult(
                        "team_stripe_checkout_url",
                        true,
                        "teamStripeCheckoutUrl is a sales-led placeholder — live self-serve remains deferred (expected for V1)."));
                break;

            case TeamStripeCheckoutPreflightClassifier.TestMode:
                steps.Add(
                    new MarketplacePreflightStepResult(
                        "team_stripe_checkout_url",
                        true,
                        "teamStripeCheckoutUrl is Stripe test-mode — production self-serve is not un-held."));
                break;

            case TeamStripeCheckoutPreflightClassifier.LiveCandidate:
                steps.Add(
                    new MarketplacePreflightStepResult(
                        "team_stripe_checkout_url",
                        false,
                        "teamStripeCheckoutUrl looks like a live Stripe checkout URL — verify owner intent before public enablement."));
                break;

            default:
                steps.Add(
                    new MarketplacePreflightStepResult(
                        "team_stripe_checkout_url",
                        true,
                        "teamStripeCheckoutUrl absent or non-Stripe — sales-led quote motion remains default."));
                break;
        }
    }

    private static void AppendOwnerOnlySteps(List<MarketplacePreflightStepResult> steps)
    {
        steps.Add(
            new MarketplacePreflightStepResult(
                "partner_center_seller_verification",
                true,
                "Owner-only — Partner Center seller verification is not machine-verifiable from the repo.",
                NotAutomated: true));

        steps.Add(
            new MarketplacePreflightStepResult(
                "partner_center_tax_and_payout",
                true,
                "Owner-only — tax profile and payout configuration are deferred live-commerce steps.",
                NotAutomated: true));

        steps.Add(
            new MarketplacePreflightStepResult(
                "marketplace_go_live",
                true,
                "Owner-only — Azure Marketplace \"Go live\" and DNS cutover are deferred (WHAT_NOT_TO_PROMISE.md).",
                NotAutomated: true));
    }

    private static string? TryReadJsonStringProperty(string json, string propertyName)
    {
        try
        {
            using System.Text.Json.JsonDocument doc = System.Text.Json.JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty(propertyName, out System.Text.Json.JsonElement value)
                && value.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                return value.GetString();
            }
        }
        catch (System.Text.Json.JsonException)
        {
            return null;
        }

        return null;
    }

    private static string? TryReadUtf8(string repositoryRoot, string relativePath)
    {
        string path = Path.Combine(repositoryRoot, relativePath);

        return !File.Exists(path) ? null : File.ReadAllText(path, Encoding.UTF8);
    }
}
