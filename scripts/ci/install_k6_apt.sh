#!/usr/bin/env bash
# Install k6 from its signed Debian/Ubuntu APT repository on disposable CI runners.
# APT signed-by requires a dearmored public key, not GnuPG's keybox database.
set -euo pipefail

sudo apt-get update
sudo apt-get install -y --no-install-recommends ca-certificates curl gnupg

keydir="$(mktemp -d)"
trap 'rm -rf "$keydir"' EXIT
curl -fsSL https://dl.k6.io/key.gpg -o "$keydir/key.gpg"
gpg --batch --yes --dearmor -o "$keydir/k6-archive-keyring.gpg" "$keydir/key.gpg"
sudo install -D -m 0644 "$keydir/k6-archive-keyring.gpg" /usr/share/keyrings/k6-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list

sudo apt-get update
sudo apt-get install -y k6

k6 version
