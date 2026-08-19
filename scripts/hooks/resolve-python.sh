#!/bin/bash
# Resolves a Python executable for git hooks. Git for Windows often runs hooks with a
# minimal PATH that omits Python even when your interactive shell has it.
#
# Override order:
#   1. ARCHLUCID_PYTHON env (absolute path or command name)
#   2. git config archlucid.python
#   3. .git/archlucid-python.cache (written after first successful resolve)
#   4. python3, python, py -3, py on PATH
#   5. Common Windows install locations (Git Bash paths)

archlucid_python_cache_file() {
    local root
    root="$(git rev-parse --git-dir 2>/dev/null || echo .git)"
    echo "$root/archlucid-python.cache"
}

archlucid_verify_python_cmd() {
    if [ "$ARCHLUCID_PYTHON_CMD" = 'py -3' ]; then
        py -3 -c "import sys" >/dev/null 2>&1
        return $?
    fi
    "$ARCHLUCID_PYTHON_CMD" -c "import sys" >/dev/null 2>&1
}

archlucid_cache_python_cmd() {
    local cache
    cache="$(archlucid_python_cache_file)"
    printf '%s\n' "$ARCHLUCID_PYTHON_CMD" >"$cache"
}

archlucid_resolve_python() {
    if [ -n "${ARCHLUCID_PYTHON:-}" ]; then
        ARCHLUCID_PYTHON_CMD="$ARCHLUCID_PYTHON"
        return 0
    fi

    local configured cache cached candidate
    configured="$(git config --get archlucid.python 2>/dev/null || true)"
    if [ -n "$configured" ]; then
        ARCHLUCID_PYTHON_CMD="$configured"
        return 0
    fi

    cache="$(archlucid_python_cache_file)"
    if [ -f "$cache" ]; then
        cached="$(head -n 1 "$cache" | tr -d '\r')"
        if [ -n "$cached" ]; then
            ARCHLUCID_PYTHON_CMD="$cached"
            return 0
        fi
    fi

    if command -v python3 >/dev/null 2>&1; then
        ARCHLUCID_PYTHON_CMD=python3
        if archlucid_verify_python_cmd; then
            archlucid_cache_python_cmd
            return 0
        fi
    fi

    if command -v python >/dev/null 2>&1; then
        ARCHLUCID_PYTHON_CMD=python
        if archlucid_verify_python_cmd; then
            archlucid_cache_python_cmd
            return 0
        fi
    fi

    if command -v py >/dev/null 2>&1; then
        ARCHLUCID_PYTHON_CMD='py -3'
        if archlucid_verify_python_cmd; then
            archlucid_cache_python_cmd
            return 0
        fi
    fi

    for candidate in \
        /c/Python313/python.exe \
        /c/Python312/python.exe \
        /c/Python311/python.exe \
        "/c/Program Files/Python313/python.exe" \
        "/c/Program Files/Python312/python.exe"
    do
        if [ -f "$candidate" ]; then
            ARCHLUCID_PYTHON_CMD="$candidate"
            if archlucid_verify_python_cmd; then
                archlucid_cache_python_cmd
                return 0
            fi
        fi
    done

    ARCHLUCID_PYTHON_CMD=""
    return 1
}

archlucid_run_python() {
    if [ -z "${ARCHLUCID_PYTHON_CMD:-}" ]; then
        echo '[pre-commit] ERROR: Python not found for git hook PATH.' >&2
        echo 'Install Python 3, or set one of:' >&2
        echo '  git config --local archlucid.python "C:/Python313/python.exe"' >&2
        echo '  $env:ARCHLUCID_PYTHON = "C:\\Python313\\python.exe"   # PowerShell, current session' >&2
        exit 1
    fi

    if [ "$ARCHLUCID_PYTHON_CMD" = 'py -3' ]; then
        py -3 "$@"
        return $?
    fi

    "$ARCHLUCID_PYTHON_CMD" "$@"
}
