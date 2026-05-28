using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "CLI prints static explainer text only.")]
internal static class ExplainOperatorModelCommand
{
    public static Task<int> RunAsync()
    {
        const string text = """
                            ArchLucid operator model (plain language)
                            ------------------------------------------

                            • **Run** — one architecture review effort from structured request through execution to (optional) commit.
                            • **Golden manifest** — the committed, authoritative snapshot of decisions and findings you can export and govern.
                            • **Authority pipeline** — on SQL hosts, server-side stages after `POST /v1/architecture/request` (ingestion → graph → findings → decisioning → artifacts). May commit without a separate coordinator execute loop.
                            • **Legacy coordinator** — optional `execute` / `result` / `commit` loop for external agent tasks when that path is in use.
                            • **Audit log** — append-only record of important actions (exports, governance, alerts); supports CSV/CEF export for SIEMs.
                            • **Governance gates** — optional rules that can block commit when severity thresholds are exceeded.

                            Integrator decision table (authority vs coordinator):
                            | Situation | Next step |
                            | --- | --- |
                            | After create on SQL; manifest already present on `GET /v1/architecture/run/{runId}` | Do **not** call execute/result to "finish"; attach exports or retry idempotent `commit` only when docs say so |
                            | Run waiting for external agent tasks (legacy coordinator) | Submit `result`, then `commit` when ReadyForCommit |
                            | `POST …/commit` returns 409 | Inspect run status and problem type — Failed, not ready, or governance gate (not a successful prior commit) |
                            | Unsure which path applies | `GET /v1/architecture/run/{runId}` then read ARCHITECTURE_FLOWS Flow A1 |

                            Happy path (Core Pilot UI): configure SQL + auth → create run → wait for pipeline → finalize/commit in UI → review artifacts.

                            Full API detail: docs/library/API_CONTRACTS.md § "Authority pipeline vs coordinator".

                            For scope boundaries (V1 vs deferred V1.1/V2 items), see docs/library/V1_SCOPE.md and docs/library/V1_DEFERRED.md.

                            _From `archlucid explain-operator-model`._
                            """;

        Console.WriteLine(text);

        return Task.FromResult(CliExitCode.Success);
    }
}
