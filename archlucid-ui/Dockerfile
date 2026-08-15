# ── ArchLucid Operator UI ───────────────────────────────────────────
# Multi-stage build: install + build → Alpine runtime with standalone output.
#
# Build context: REPO ROOT (not archlucid-ui/).
# The pricing generator reads docs/go-to-market/PRICING_PHILOSOPHY.md,
# which lives at the repo root and is outside the archlucid-ui/ subtree.
#
#   docker build -t archlucid-ui -f archlucid-ui/Dockerfile .
# ────────────────────────────────────────────────────────────────────

# ── Stage 1: dependencies (layer-cached until package-lock changes) ─
FROM node:22-alpine AS deps

WORKDIR /app

# Paths are relative to the repo-root build context.
COPY archlucid-ui/package.json archlucid-ui/package-lock.json ./
# Workspace packages (`workspace:*` in the lockfile) must exist on disk before `npm ci`, or npm errors with
# EUNSUPPORTEDPROTOCOL for `workspace:*`.
COPY archlucid-ui/packages ./packages
# `npm ci --ignore-scripts` skips sharp's install hook; Next then fails `next build` on Alpine with
# "Module not found" / sharp native resolution (sharp is next's optionalDependency; required for standalone image output).
RUN npm ci --ignore-scripts && npm rebuild sharp

# ── Stage 2: build ──────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Copy the UI source tree (everything in archlucid-ui/ becomes /app/).
COPY archlucid-ui/ .

# Vitest-only file at the UI root used to be typechecked by `next build` on older branches. It is not part
# of the runtime app; remove if present so Docker builds never fail on Vitest RTL mocks (mock lives under `testing/`).
RUN rm -f vitest-setup-rtl-mock.ts

# Synthetic aggregate ROI bulletin sample (read at SSR; canonical file lives under docs/ at repo root).
COPY docs/go-to-market/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md ./go-to-market-samples/SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md

# Public accessibility self-attestation reads root ACCESSIBILITY.md at build time (mirrors monorepo `../ACCESSIBILITY.md`).
COPY ACCESSIBILITY.md ./go-to-market-samples/ACCESSIBILITY.md

# Public Trust Center marketing route reads docs/go-to-market/trust-center.md (mirrors monorepo path).
COPY docs/go-to-market/trust-center.md ./go-to-market-samples/trust-center.md

# TB-168: `src/lib/sponsor-kpi-semantic-contract.ts` imports ../../../docs/library/… from /app/src/lib
# (resolves to /docs/library/ on Linux). Monorepo dev has the file at repo root; Docker must mirror that path.
COPY docs/library/EXECUTIVE_KPI_SEMANTIC_CONTRACT.json /docs/library/EXECUTIVE_KPI_SEMANTIC_CONTRACT.json
# TB-320 / TB-328: run-detail and finding-severity semantic contracts use the same ../../../docs/library import path.
COPY docs/library/RUN_DETAIL_KPI_SEMANTIC_CONTRACT.json /docs/library/RUN_DETAIL_KPI_SEMANTIC_CONTRACT.json
COPY docs/library/FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.json /docs/library/FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.json
# TB-344: onboarding narrative spine contract uses the same ../../../docs/library import path.
COPY docs/library/ONBOARDING_NARRATIVE_SPINE_CONTRACT.json /docs/library/ONBOARDING_NARRATIVE_SPINE_CONTRACT.json

# The pricing generator (plus `pricing_json_checkout_guard.py`) and its
# single-source document must be present at build time. They live outside
# the archlucid-ui/ subtree, so we copy them to /pricing-source/ and invoke
# the generator with --repo-root pointing there.
COPY scripts/ci/generate_pricing_json.py /pricing-source/scripts/ci/generate_pricing_json.py
COPY scripts/ci/pricing_json_checkout_guard.py /pricing-source/scripts/ci/pricing_json_checkout_guard.py
COPY docs/go-to-market/PRICING_PHILOSOPHY.md /pricing-source/docs/go-to-market/PRICING_PHILOSOPHY.md

# python3 is only needed in this build stage; it is NOT carried into the
# runtime image.  Run the generator then immediately call next build so we
# do not re-invoke npm run generate:pricing (which assumes the ../scripts/
# path available in local dev but not inside the container).
# NEXT_PUBLIC_* is inlined at build time for client bundles — keep in sync with docker-compose `ui.build.args`.
ARG NEXT_PUBLIC_DOCS_BASE_URL=https://github.com/joefrancisGA/ArchLucid/blob/master
ARG NEXT_PUBLIC_DEMO_URL=
ARG NEXT_PUBLIC_ARCHLUCID_SITE_URL=
ARG NEXT_PUBLIC_BUILD_COMMIT_SHA=
ARG NEXT_PUBLIC_BUILD_TIMESTAMP=
ARG NEXT_PUBLIC_DEPLOY_STAMP=
ARG NEXT_PUBLIC_DEPLOY_ENV=
ARG NEXT_PUBLIC_API_UPSTREAM_HOST=
ARG NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=
ARG NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED=
ARG NEXT_PUBLIC_OIDC_AUTHORITY=
ARG NEXT_PUBLIC_OIDC_CLIENT_ID=
ARG NEXT_PUBLIC_OIDC_SCOPES=
ARG NEXT_PUBLIC_OIDC_REDIRECT_URI=
ARG NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI=
ENV NEXT_PUBLIC_DOCS_BASE_URL=${NEXT_PUBLIC_DOCS_BASE_URL}
ENV NEXT_PUBLIC_DEMO_URL=${NEXT_PUBLIC_DEMO_URL}
ENV NEXT_PUBLIC_ARCHLUCID_SITE_URL=${NEXT_PUBLIC_ARCHLUCID_SITE_URL}
ENV NEXT_PUBLIC_BUILD_COMMIT_SHA=${NEXT_PUBLIC_BUILD_COMMIT_SHA}
ENV NEXT_PUBLIC_BUILD_TIMESTAMP=${NEXT_PUBLIC_BUILD_TIMESTAMP}
ENV NEXT_PUBLIC_DEPLOY_STAMP=${NEXT_PUBLIC_DEPLOY_STAMP}
ENV NEXT_PUBLIC_DEPLOY_ENV=${NEXT_PUBLIC_DEPLOY_ENV}
ENV NEXT_PUBLIC_API_UPSTREAM_HOST=${NEXT_PUBLIC_API_UPSTREAM_HOST}
ENV NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=${NEXT_PUBLIC_ARCHLUCID_AUTH_MODE}
ENV NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED=${NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED}
ENV NEXT_PUBLIC_OIDC_AUTHORITY=${NEXT_PUBLIC_OIDC_AUTHORITY}
ENV NEXT_PUBLIC_OIDC_CLIENT_ID=${NEXT_PUBLIC_OIDC_CLIENT_ID}
ENV NEXT_PUBLIC_OIDC_SCOPES=${NEXT_PUBLIC_OIDC_SCOPES}
ENV NEXT_PUBLIC_OIDC_REDIRECT_URI=${NEXT_PUBLIC_OIDC_REDIRECT_URI}
ENV NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI=${NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI}
ENV NEXT_TELEMETRY_DISABLED=1
# `next build` typechecks `import "@archlucid/api-types"` — that workspace package's `dist/` is not in git; build it first.
# Docker smoke skips `npm run build:docs-pdf`; ensure runtime COPY target exists (empty dir until full PDF build is wired in).
RUN apk add --no-cache python3 \
    && mkdir -p public .build/docs-pdf-customer \
    && python3 /pricing-source/scripts/ci/generate_pricing_json.py --repo-root /pricing-source \
    && npm run build:api-types \
    && npx next build

# ── Stage 3: runtime ───────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone server needs only `node`; the official Node base still ships npm/yarn trees that Trivy flags (e.g. picomatch
# under npm) even though the app never invokes them. Refresh Alpine index, upgrade OS packages, then pin OpenSSL ≥ 3.5.6-r0
# (CVE-2026-28390) so cached layers cannot keep libssl3/libcrypto3 on an older revision. Then drop npm/yarn.
RUN apk update --no-cache \
    && apk upgrade --no-cache \
    && apk add --no-cache --upgrade \
         "openssl>=3.5.6-r0" \
         "libssl3>=3.5.6-r0" \
         "libcrypto3>=3.5.6-r0" \
    && rm -rf /usr/local/lib/node_modules/npm \
    && ( [ ! -d /opt ] || find /opt -maxdepth 1 -type d -name 'yarn-v*' -exec rm -rf {} + ) \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg

RUN addgroup -S archlucid && adduser -S archlucid -G archlucid

# Standalone output includes a minimal node_modules and server.js.
COPY --from=build --chown=archlucid:archlucid /app/.next/standalone ./
# Static assets and public folder must be copied separately.
COPY --from=build --chown=archlucid:archlucid /app/.next/static ./.next/static
COPY --from=build --chown=archlucid:archlucid /app/public ./public
COPY --from=build --chown=archlucid:archlucid /app/.build/docs-pdf-customer ./.build/docs-pdf-customer
COPY --from=build --chown=archlucid:archlucid /app/go-to-market-samples ./go-to-market-samples

# In-app `/help/{topic}` markdown (tryLoadProductDocumentation). Loader resolves `/docs/...`
# when cwd is `/app` (join(cwd, "..", "docs", "library") → `/docs/library`).
# Without these, registry-backed help topics 404 in Container Apps after CD.
COPY --chown=archlucid:archlucid docs/library/customer-facing /docs/library/customer-facing
COPY --chown=archlucid:archlucid docs/library/walkthroughs /docs/library/walkthroughs
COPY --chown=archlucid:archlucid docs/go-to-market /docs/go-to-market
COPY --chown=archlucid:archlucid docs/security /docs/security
COPY --chown=archlucid:archlucid docs/runbooks /docs/runbooks
COPY --chown=archlucid:archlucid docs/onboarding /docs/onboarding
COPY --chown=archlucid:archlucid docs/CORE_PILOT.md /docs/CORE_PILOT.md
COPY --chown=archlucid:archlucid docs/library/operator-shell.md /docs/library/operator-shell.md
COPY --chown=archlucid:archlucid docs/library/FIRST_HOUR_OPERATOR_PATH.md /docs/library/FIRST_HOUR_OPERATOR_PATH.md
COPY --chown=archlucid:archlucid docs/library/AUDIT_COVERAGE_MATRIX.md /docs/library/AUDIT_COVERAGE_MATRIX.md
COPY --chown=archlucid:archlucid docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md /docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md
COPY --chown=archlucid:archlucid docs/library/PILOT_ROI_MODEL.md /docs/library/PILOT_ROI_MODEL.md
COPY --chown=archlucid:archlucid docs/library/CLI_USAGE.md /docs/library/CLI_USAGE.md
COPY --chown=archlucid:archlucid docs/library/CONFIGURATION_REFERENCE.md /docs/library/CONFIGURATION_REFERENCE.md
COPY --chown=archlucid:archlucid docs/library/ACCELERATOR_CHOOSER.md /docs/library/ACCELERATOR_CHOOSER.md
COPY --chown=archlucid:archlucid docs/library/COMPARISON_REPLAY.md /docs/library/COMPARISON_REPLAY.md
COPY --chown=archlucid:archlucid docs/library/REPEAT_REVIEW_LOOP.md /docs/library/REPEAT_REVIEW_LOOP.md
COPY --chown=archlucid:archlucid docs/library/API_CONTRACTS.md /docs/library/API_CONTRACTS.md
COPY --chown=archlucid:archlucid docs/library/PRODUCT_LEARNING.md /docs/library/PRODUCT_LEARNING.md

USER archlucid

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
