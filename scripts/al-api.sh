#!/usr/bin/env bash
# Start a Cursor Cloud Agent via the v1 API (Composer 2.5 standard, not Fast).
set -euo pipefail

TEXT="${1:-}"
IMAGE_PATH="${2:-}"

if [[ -z "$TEXT" ]]; then
  echo "Usage: scripts/al-api.sh \"<task text>\" [absolute_image_path]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_PATH="$REPO_ROOT/.cursor/al-api.config.json"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Config not found at '$CONFIG_PATH'. Copy .cursor/al-api.config.example.json to .cursor/al-api.config.json." >&2
  exit 1
fi

export AL_API_TEXT="$TEXT"
export AL_API_IMAGE_PATH="$IMAGE_PATH"
export AL_API_CONFIG_PATH="$CONFIG_PATH"
export AL_API_REPO_ROOT="$REPO_ROOT"

python3 <<'PY'
import base64
import json
import mimetypes
import os
import pathlib
import subprocess
import urllib.request

text = os.environ["AL_API_TEXT"]
image_path = os.environ.get("AL_API_IMAGE_PATH", "").strip()
config_path = os.environ["AL_API_CONFIG_PATH"]
repo_root = os.environ["AL_API_REPO_ROOT"]

with open(config_path, encoding="utf-8") as f:
    config = json.load(f)

api_key = os.environ.get("CURSOR_API_KEY", "").strip() or str(config.get("apiKey", "")).strip()
if not api_key:
    raise SystemExit("Missing API key. Set CURSOR_API_KEY or apiKey in .cursor/al-api.config.json.")

repo_url = str(config.get("repoUrl", "")).strip()
if not repo_url:
    try:
        remote = subprocess.check_output(
            ["git", "-C", repo_root, "remote", "get-url", "origin"],
            text=True,
        ).strip()
    except subprocess.CalledProcessError:
        remote = ""
    if remote.endswith(".git"):
        remote = remote[:-4]
    if remote.startswith("git@") and ":" in remote:
        host, path = remote[4:].split(":", 1)
        repo_url = f"https://{host}/{path}"
    else:
        repo_url = remote

if not repo_url:
    raise SystemExit("repoUrl is not set in config and could not be detected from git origin.")

starting_ref = str(config.get("startingRef", "master")).strip() or "master"
auto_create_pr = bool(config.get("autoCreatePR", False))

prompt = {"text": text}
if image_path:
    path = pathlib.Path(image_path)
    mime, _ = mimetypes.guess_type(path.name)
    allowed = {"image/png", "image/jpeg", "image/gif", "image/webp"}
    if mime not in allowed:
        raise SystemExit(f"Unsupported image type: {path}")
    prompt["images"] = [{
        "data": base64.b64encode(path.read_bytes()).decode("ascii"),
        "mimeType": mime,
    }]

body = {
    "prompt": prompt,
    "model": {
        "id": "composer-2.5",
        "params": [{"id": "fast", "value": "false"}],
    },
    "repos": [{"url": repo_url, "startingRef": starting_ref}],
    "autoCreatePR": auto_create_pr,
    "workOnCurrentBranch": False,
}

payload = json.dumps(body).encode("utf-8")
request = urllib.request.Request(
    "https://api.cursor.com/v1/agents",
    data=payload,
    method="POST",
    headers={
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": f"Basic {__import__('base64').b64encode(f'{api_key}:'.encode()).decode()}",
    },
)

with urllib.request.urlopen(request) as response:
    result = json.load(response)

agent = result["agent"]
run = result["run"]
print()
print("Cloud agent started")
print(f"  Agent: {agent['id']}")
print(f"  Run:   {run['id']}")
print(f"  URL:   {agent['url']}")
print("  Model: composer-2.5 (fast=false)")
print()
PY
