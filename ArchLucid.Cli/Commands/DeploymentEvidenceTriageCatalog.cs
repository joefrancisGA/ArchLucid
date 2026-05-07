namespace ArchLucid.Cli.Commands;

/// <summary>Short, actionable next-step lines paired with failed deployment probes (no secrets).</summary>
internal static class DeploymentEvidenceTriageCatalog
{
    internal static IReadOnlyList<string> LiveFailure(string apiBaseUrlRedacted)
    {
        return
        [
            "Confirm the API Container App (or host) is running and ingress routes `/health/live` to ArchLucid.Api.",
            $"From a shell: `curl -fsS --max-time 30 \"{apiBaseUrlRedacted}/health/live\"` — fix TLS/DNS or Front Door routing if connection fails.",
            "See docs/library/DEPLOYMENT_RUNBOOK.md (health / post-deploy validation)."
        ];
    }

    internal static IReadOnlyList<string> ReadyFailure()
    {
        return
        [
            "Open `/health/ready` JSON: identify `entries[]` with status Degraded/Unhealthy (SQL, blob, schema, compliance pack, etc.).",
            "Align connection strings / Key Vault / private endpoints with this environment; see docs/TROUBLESHOOTING.md.",
            "When dependencies recover, redeploy or restart the revision — then re-run this command."
        ];
    }

    internal static IReadOnlyList<string> OpenApiFailure(string apiBaseUrlRedacted)
    {
        return
        [
            "Production-like hosts may hide OpenAPI; point `SMOKE_TEST_BASE_URL` at a host that exposes `/openapi/v1.json`, or enable OpenAPI for this slice.",
            "If policy forbids exposing the contract publicly, use break-glass only: `archlucid deployment-evidence ... --allow-missing-openapi` and record the override in change management (not the default in CD).",
            $"Verify locally: `curl -fsS -o /dev/null -w \"%{{http_code}}\\n\" \"{apiBaseUrlRedacted}/openapi/v1.json\"`."
        ];
    }

    internal static IReadOnlyList<string> VersionFailure()
    {
        return
        [
            "Ensure `/version` is routed to the same API revision you intend (not a stale Front Door backend).",
            "Check API logs for startup exceptions; container may be running but request pipeline failing.",
            "Compare with git SHA from this report and with `az containerapp revision list` image/digest."
        ];
    }

    internal static IReadOnlyList<string> SyntheticFailure(string path)
    {
        return
        [
            $"Synthetic path `{path}` must return HTTP 200 for the CD gate — adjust `SMOKE_SYNTHETIC_PATH` or the route.",
            "If you only need `/version`, set `--synthetic-path /version` (duplicate GET is skipped)."
        ];
    }

    internal static IReadOnlyList<string> TransportFailure(string verbLabel)
    {
        return
        [
            $"{verbLabel}: network/TLS timeout or reset — verify outbound path, corporate proxy, and DNS from the runner.",
            "Retry after cold start using repository variables `CD_POST_DEPLOY_MAX_ATTEMPTS` and `CD_POST_DEPLOY_RETRY_WAIT_SECONDS` when running in GitHub Actions."
        ];
    }
}
