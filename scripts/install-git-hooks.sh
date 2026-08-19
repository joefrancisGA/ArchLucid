#!/usr/bin/env bash
# Installs shared git hooks via core.hooksPath (pre-commit + OpenAPI pre-push).
# Run once after cloning: bash scripts/install-git-hooks.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
GIT_HOOKS_DIR="$REPO_ROOT/scripts/git-hooks"

normalize_lf() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "  skip: $path (missing)"
    return
  fi
  local tmp="${path}.lf"
  tr -d '\r' < "$path" > "$tmp"
  mv "$tmp" "$path"
  chmod +x "$path" 2>/dev/null || true
  echo "  normalized LF: $path"
}

cd "$REPO_ROOT"
git config core.hooksPath scripts/git-hooks

echo "Installing git hooks from $GIT_HOOKS_DIR (core.hooksPath)"
normalize_lf "$GIT_HOOKS_DIR/pre-commit"
normalize_lf "$GIT_HOOKS_DIR/pre-push"
normalize_lf "$GIT_HOOKS_DIR/post-checkout"
normalize_lf "$REPO_ROOT/scripts/hooks/post-checkout"
normalize_lf "$REPO_ROOT/scripts/hooks/resolve-python.sh"

echo "Hooks enabled:"
echo "  pre-commit    — owner-workbook guard + controller audit + route registry sync (when staged paths match)"
echo "  post-checkout — removes resurrected legacy ui_route_traffic_estimates.md after branch switches"
echo "  pre-push      — OpenAPI v1 + buyer snapshot check (when outgoing commits touch API paths)"
echo ""
echo "Skip pre-commit once: ARCHLUCID_SKIP_PRE_COMMIT=1 git commit"
echo "Skip pre-push once:   ARCHLUCID_SKIP_OPENAPI_PRE_PUSH=1 git push"
echo "OpenAPI build cache:  .cache/nuget-packages + incremental Release build under each project obj/bin"
echo "Emergency bypass:     git commit --no-verify / git push --no-verify"
