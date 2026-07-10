#!/usr/bin/env bash
# SessionStart 훅: 프로젝트 컨텍스트 문서를 세션 컨텍스트에 주입한다.
# (stdout 이 세션 컨텍스트로 추가됨)
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
DOC="$ROOT/docs/PROJECT_CONTEXT.md"
LEDGER="$ROOT/.claude/session-ledger.local.md"

if [ -f "$DOC" ]; then
  echo "# 📄 프로젝트 컨텍스트 (docs/PROJECT_CONTEXT.md) — 작업 전 반드시 숙지하세요"
  echo
  cat "$DOC"
fi

if [ -f "$LEDGER" ]; then
  echo
  echo "---"
  echo "## ⚠️ 아직 문서에 정리되지 않은 지난 세션 흔적 — \`/session-log\` 로 반영하세요"
  cat "$LEDGER"
fi

exit 0
