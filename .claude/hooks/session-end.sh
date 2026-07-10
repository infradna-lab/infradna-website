#!/usr/bin/env bash
# SessionEnd 훅: 세션 종료 시 자동으로 타임스탬프 흔적을 로컬 원장에 남긴다.
# (지능적 요약이 아니라 안전망 — 다음 세션 SessionStart가 이 흔적을 보여주고,
#  /session-log 스킬로 문서에 정식 반영한다. 이 파일은 gitignore 됨.)
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
LEDGER="$ROOT/.claude/session-ledger.local.md"
mkdir -p "$ROOT/.claude"

STAMP="$(date '+%Y-%m-%d %H:%M')"
HEAD_SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo '-')"
SUBJECT="$(git -C "$ROOT" log -1 --pretty=%s 2>/dev/null || echo '-')"
DIRTY="$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

printf -- '- %s · HEAD %s "%s" · 미커밋 %s건\n' "$STAMP" "$HEAD_SHA" "$SUBJECT" "$DIRTY" >> "$LEDGER"

exit 0
