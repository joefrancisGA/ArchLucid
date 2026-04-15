/*
  ArchLucid — Structurizr DSL (C4). Render with Structurizr Lite or CLI.
  See docs/c4/README.md.
*/
workspace "ArchLucid" "Architecture decision record — system and containers" {

    model {
        operator = person "Operator" "Uses the operator UI and CLI for runs, governance, and forensics."
        integrator = person "Integrator" "Calls the versioned HTTP API with tenant scope and auth."

        archlucid = softwareSystem "ArchLucid" "Authority pipeline: ingest → graph → findings → manifests → SQL persistence." {
            api = container "ArchLucid API" ".NET HTTP host — /v1 routes, health, OpenAPI." "ASP.NET Core" {
                authoritySurface = component "Authority & runs" "Create/execute/commit runs, replay, compare, graph, exports, retrieval reads." "ASP.NET Core MVC"
                governanceSurface = component "Governance & policy" "Approvals, environments, policy packs, pre-commit gate." "ASP.NET Core MVC"
                advisorySurface = component "Advisory & alerts" "Schedules, scans, digests, alert rules and delivery." "ASP.NET Core MVC"
                explainSurface = component "Explain & Ask" "Run explanations, aggregate summaries, conversational Ask." "ASP.NET Core MVC"
                integrationSurface = component "Jobs & integration" "Background job enqueue, webhooks, integration event edges." "ASP.NET Core MVC"
            }

            worker = container "ArchLucid Worker" "Background jobs, outbox, indexing, archival." "ASP.NET Core Worker"
            ui = container "Operator UI" "Next.js operator shell." "JavaScript"
            database = container "SQL Server" "Runs, snapshots, manifests, audit, outbox." "SQL Server"
        }

        operator -> ui "Operates"
        operator -> archlucid.api "HTTPS (API key / JWT)"
        integrator -> archlucid.api "HTTPS JSON / OpenAPI"
        archlucid.ui -> archlucid.api "HTTPS"
        archlucid.api -> archlucid.database "Dapper / transactions"
        archlucid.worker -> archlucid.database "Dapper / transactions"

        archlucid.api.authoritySurface -> archlucid.database "Read/write run artifacts"
        archlucid.api.governanceSurface -> archlucid.database "Governance rows & audit"
        archlucid.api.advisorySurface -> archlucid.database "Advisory & alert persistence"
        archlucid.api.explainSurface -> archlucid.database "Explanation cache inputs"
        archlucid.api.integrationSurface -> archlucid.database "Outbox & job queue"
    }

    views {
        systemContext archlucid "SystemContext" {
            include *
            autolayout lr
        }

        container archlucid "Containers" {
            include *
            autolayout tb
        }

        component archlucid.api "ApiComponents" {
            include *
            autolayout tb
        }

        theme default
    }
}
