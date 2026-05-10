#!/usr/bin/env bash

set -euo pipefail

APP_NAME="项目管理"
PORT="${PORT:-18286}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
APP_DIR="$DIST_DIR/$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
RUNTIME_DIR="$RESOURCES_DIR/runtime"
BIN_DIR="$RESOURCES_DIR/bin"
ICON_SOURCE="$PROJECT_DIR/public/app-icon.svg"
ICON_FILE="$RESOURCES_DIR/AppIcon.icns"

cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is required to build and run the macOS app."
  exit 1
fi

NODE_BIN="$(command -v node)"

if command -v bun >/dev/null 2>&1; then
  RUNNER="bun"
else
  RUNNER="npm"
fi

if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  echo "Installing dependencies with $RUNNER..."
  if [ "$RUNNER" = "bun" ]; then
    bun install
  else
    npm install
  fi
fi

if [ ! -f "$PROJECT_DIR/db/custom.db" ]; then
  echo "ERROR: db/custom.db was not found. The packaged app needs the local SQLite database."
  exit 1
fi

echo "Generating Prisma client for macOS packaging..."
if [ "$RUNNER" = "bun" ]; then
  bun run db:generate
else
  npm run db:generate
fi

echo "Building Next.js standalone app..."
if [ "$RUNNER" = "bun" ]; then
  bun run build
else
  npm run build
fi

if [ ! -f "$PROJECT_DIR/.next/standalone/server.js" ]; then
  echo "ERROR: .next/standalone/server.js was not generated."
  exit 1
fi

echo "Creating $APP_DIR..."
rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR" "$RUNTIME_DIR" "$RESOURCES_DIR/db" "$BIN_DIR"

cp -R "$PROJECT_DIR/.next/standalone/." "$RUNTIME_DIR/"
mkdir -p "$RUNTIME_DIR/.next"
cp -R "$PROJECT_DIR/.next/static" "$RUNTIME_DIR/.next/"

if [ -d "$PROJECT_DIR/public" ]; then
  cp -R "$PROJECT_DIR/public" "$RUNTIME_DIR/"
fi

cp "$PROJECT_DIR/db/custom.db" "$RESOURCES_DIR/db/custom.db"
cp "$NODE_BIN" "$BIN_DIR/node"
chmod +x "$BIN_DIR/node"

if [ -f "$ICON_SOURCE" ]; then
  echo "Creating app icon..."
  node "$PROJECT_DIR/scripts/create-mac-icon.mjs" "$ICON_SOURCE" "$ICON_FILE"
fi

cat > "$CONTENTS_DIR/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>$APP_NAME</string>
  <key>CFBundleDisplayName</key>
  <string>$APP_NAME</string>
  <key>CFBundleIdentifier</key>
  <string>com.local.xmgl2026</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleExecutable</key>
  <string>$APP_NAME</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
PLIST

cat > "$MACOS_DIR/$APP_NAME" <<'LAUNCHER'
#!/usr/bin/env bash

set -euo pipefail

APP_NAME="项目管理"
PORT="${PORT:-18286}"
CONTENTS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
RUNTIME_DIR="$RESOURCES_DIR/runtime"
BUNDLED_NODE="$RESOURCES_DIR/bin/node"
BUNDLED_DB_PATH="$RESOURCES_DIR/db/custom.db"
SUPPORT_DIR="$HOME/Library/Application Support/$APP_NAME"
LOG_DIR="$HOME/Library/Logs"
DB_PATH="$SUPPORT_DIR/custom.db"
PID_FILE="$SUPPORT_DIR/server.pid"
LOG_FILE="$LOG_DIR/$APP_NAME.log"
URL="http://127.0.0.1:$PORT"

show_error() {
  /usr/bin/osascript -e "display dialog \"$1\" buttons {\"知道了\"} default button 1 with icon stop" >/dev/null 2>&1 || true
}

is_ready() {
  /usr/bin/curl -fsS --connect-timeout 1 --max-time 2 "$URL" >/dev/null 2>&1
}

mkdir -p "$SUPPORT_DIR" "$LOG_DIR"

NODE_BIN=""
for candidate in "$BUNDLED_NODE" /usr/local/bin/node /opt/homebrew/bin/node /usr/bin/node; do
  if [ -x "$candidate" ]; then
    NODE_BIN="$candidate"
    break
  fi
done

if [ -z "$NODE_BIN" ]; then
  show_error "未找到 Node.js，无法启动项目管理。请重新打包或先安装 Node.js 后再打开。"
  exit 1
fi

if [ ! -f "$RUNTIME_DIR/server.js" ]; then
  show_error "App 内缺少 server.js，请重新运行打包脚本。"
  exit 1
fi

if [ ! -f "$BUNDLED_DB_PATH" ]; then
  show_error "App 内缺少数据库文件 custom.db，请重新运行打包脚本。"
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  cp "$BUNDLED_DB_PATH" "$DB_PATH"
fi

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" >/dev/null 2>&1 && is_ready; then
    /usr/bin/open "$URL"
    exit 0
  fi
fi

if is_ready; then
  /usr/bin/open "$URL"
  exit 0
fi

(
  cd "$RUNTIME_DIR"
  export NODE_ENV=production
  export HOSTNAME=127.0.0.1
  export PORT="$PORT"
  export DATABASE_URL="file:$DB_PATH"
  exec "$NODE_BIN" server.js
) >> "$LOG_FILE" 2>&1 &

SERVER_PID="$!"
echo "$SERVER_PID" > "$PID_FILE"

for _ in $(seq 1 45); do
  if is_ready; then
    /usr/bin/open "$URL"
    exit 0
  fi

  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    show_error "项目管理启动失败，日志在：$LOG_FILE"
    exit 1
  fi

  sleep 1
done

show_error "项目管理启动超时，日志在：$LOG_FILE"
exit 1
LAUNCHER

chmod +x "$MACOS_DIR/$APP_NAME"

if command -v codesign >/dev/null 2>&1; then
  codesign --force --deep --sign - "$APP_DIR" >/dev/null 2>&1 || true
fi

echo ""
echo "Done: $APP_DIR"
echo "Open it with:"
echo "  open \"$APP_DIR\""
