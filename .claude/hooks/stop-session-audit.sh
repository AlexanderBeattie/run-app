#!/usr/bin/env bash
# Stop hook — session-end security audit

REPO=/Users/alexbeattie/Downloads/klub
FINDINGS=()

# Check for uncommitted secret-like files
if git -C "$REPO" diff --name-only HEAD 2>/dev/null | grep -qE '\.env($|\.)'; then
  FINDINGS+=("WARNING: .env file has uncommitted changes")
fi

# Check for console.log left in TypeScript source
if grep -rq 'console\.log' "$REPO/frontend/src" "$REPO/backend/src" 2>/dev/null; then
  FINDINGS+=("INFO: console.log statements found in source — consider removing before deploy")
fi

if [ ${#FINDINGS[@]} -gt 0 ]; then
  MSG=$(printf '%s\n' "${FINDINGS[@]}")
  echo "{\"systemMessage\": \"Session-end audit:\\n$MSG\"}"
fi

exit 0
