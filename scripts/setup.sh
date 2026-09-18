#!/usr/bin/env bash
# ==============================================================================
# FibrasMX — script de configuración inicial
#
# Prepara el proyecto desde cero en una máquina local:
#   1. Verifica que bun esté instalado (avisa si la versión difiere mucho de la esperada)
#   2. Instala las dependencias (bun install)
#   3. Crea data/app.db aplicando las migraciones drizzle/0001..0009 en orden
#      (usa el CLI sqlite3 si existe; si no, un script inline con bun:sqlite)
#   4. Verifica tipos y compila el servidor (typecheck + build:server).
#      NOTA: el build del cliente está bloqueado por diseño fuera del pipeline
#      oficial de la plataforma; ver el mensaje final del script.
#
# Uso:
#   bash scripts/setup.sh          # configuración normal (idempotente: no duplica migraciones)
#   bash scripts/setup.sh --fresh  # borra data/app.db y empieza la BD desde cero
# ==============================================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB_DIR="$ROOT/data"
DB_FILE="$DB_DIR/app.db"
MIGRATIONS_DIR="$ROOT/drizzle"
EXPECTED_BUN="1.3.10"
JOURNAL_TABLE="__drizzle_migrations"

info() { printf '  %s\n' "$1"; }
step() { printf '\n\033[1m[%s]\033[0m %s\n' "$1" "$2"; }
warn() { printf '\033[33m  ⚠ %s\033[0m\n' "$1"; }
ok()   { printf '\033[32m  ✓ %s\033[0m\n' "$1"; }
fail() { printf '\033[31m  ✗ %s\033[0m\n' "$1"; exit 1; }

FRESH=0
if [ "${1:-}" = "--fresh" ]; then
  FRESH=1
fi

echo "FibrasMX — configuración inicial"
echo "Raíz del proyecto: $ROOT"

# ----------------------------------------------------------------- paso 1: bun
step "1/4" "Verificando bun..."

if ! command -v bun >/dev/null 2>&1; then
  fail "bun no está instalado. Instálalo desde https://bun.sh y vuelve a intentarlo."
fi

BUN_VERSION="$(bun --version)"
ok "bun encontrado (versión $BUN_VERSION)."

# Compara major.minor con la versión declarada en packageManager (bun@1.3.10)
EXPECTED_MM="${EXPECTED_BUN%.*}"
ACTUAL_MM="$(printf '%s' "$BUN_VERSION" | cut -d. -f1-2)"
if [ "$EXPECTED_MM" != "$ACTUAL_MM" ]; then
  warn "Tu versión de bun ($BUN_VERSION) difiere de la declarada en package.json ($EXPECTED_BUN)."
  warn "El proyecto podría comportarse distinto; considera instalar bun@$EXPECTED_BUN."
else
  ok "La versión de bun coincide con la declarada en package.json ($EXPECTED_BUN)."
fi

# -------------------------------------------------------- paso 2: dependencias
step "2/4" "Instalando dependencias (bun install)..."
bun install
ok "Dependencias instaladas."

# ---------------------------------------------------------- paso 3: migraciones
step "3/4" "Preparando la base de datos SQLite (data/app.db)..."

mkdir -p "$DB_DIR"

if [ "$FRESH" -eq 1 ] && [ -f "$DB_FILE" ]; then
  info "Modo --fresh: se elimina la base de datos existente."
  rm -f "$DB_FILE"
fi

# Migraciones en el orden del journal drizzle/meta/_journal.json
MIGRATION_FILES=(
  "0001_initial"
  "0002_create_fibrasmx_data_tables"
  "0003_content_metadata_and_owners"
  "0004_add_auth_accounts"
  "0005_add_account_roles"
  "0006_add_personal_portfolio_tracking"
  "0007_migrate_legacy_portfolio_positions"
  "0008_add_live_ratios_fundamentals"
  "0009_add_sa_tafe_runs"
)

for tag in "${MIGRATION_FILES[@]}"; do
  [ -f "$MIGRATIONS_DIR/$tag.sql" ] || fail "Falta el archivo de migración $tag.sql en $MIGRATIONS_DIR."
done

# --- Variante A: CLI sqlite3 disponible (ruta preferida) -----------------------
create_journal_sqlite3() {
  sqlite3 "$DB_FILE" \
    "CREATE TABLE IF NOT EXISTS $JOURNAL_TABLE (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT NOT NULL, created_at INTEGER NOT NULL);"
}

migration_applied_sqlite3() { # $1 = tag
  [ "$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM $JOURNAL_TABLE WHERE hash = '$1';")" -gt 0 ]
}

apply_migration_sqlite3() { # $1 = archivo .sql, $2 = tag
  sqlite3 -bail "$DB_FILE" < "$MIGRATIONS_DIR/$1"
  sqlite3 "$DB_FILE" \
    "INSERT INTO $JOURNAL_TABLE (hash, created_at) VALUES ('$2', $(( $(date +%s) * 1000 )));"
}

# --- Variante B: sin sqlite3 -> script inline con bun:sqlite -------------------
apply_with_bun_sqlite() {
  info "El CLI sqlite3 no está disponible; se usará bun:sqlite."
  local tmp
  tmp="$(mktemp /tmp/fibrasmx-migrate.XXXXXX.mjs)"
  cat > "$tmp" <<'MIGRATE_EOF'
import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const [dbPath, migDir] = process.argv.slice(2);
const db = new Database(dbPath, { create: true });
db.exec("CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT NOT NULL, created_at INTEGER NOT NULL);");
const files = readdirSync(migDir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();
let applied = 0, skipped = 0;
for (const f of files) {
  const tag = f.replace(/\.sql$/, "");
  const done = db.query("SELECT 1 AS ok FROM __drizzle_migrations WHERE hash = ?").get(tag);
  if (done) { console.log(`  ○ ${f} — ya aplicada, se omite.`); skipped++; continue; }
  console.log(`  ● ${f} — aplicando...`);
  db.exec(readFileSync(join(migDir, f), "utf8"));
  db.query("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)").run(tag, Date.now());
  console.log(`  ✓ ${f} — aplicada.`);
  applied++;
}
db.close();
console.log(`  ✓ Base de datos lista (${applied} aplicadas, ${skipped} omitidas).`);
MIGRATE_EOF
  bun "$tmp" "$DB_FILE" "$MIGRATIONS_DIR"
  local status=$?
  rm -f "$tmp"
  return $status
}

# --- Ejecución ----------------------------------------------------------------
if command -v sqlite3 >/dev/null 2>&1; then
  info "Método: CLI sqlite3 ($(sqlite3 --version | head -c 20))."
  create_journal_sqlite3
  APPLIED=0
  SKIPPED=0
  for tag in "${MIGRATION_FILES[@]}"; do
    if migration_applied_sqlite3 "$tag"; then
      info "○ $tag.sql — ya aplicada, se omite."
      SKIPPED=$((SKIPPED + 1))
    else
      info "● $tag.sql — aplicando..."
      apply_migration_sqlite3 "$tag.sql" "$tag"
      ok "$tag.sql — aplicada."
      APPLIED=$((APPLIED + 1))
    fi
  done
  ok "Base de datos lista en $DB_FILE ($APPLIED aplicadas, $SKIPPED omitidas)."
else
  info "Método: bun:sqlite (script inline)."
  apply_with_bun_sqlite
fi

# ------------------------------------------------------------------ paso 4: build
step "4/4" "Verificando tipos y compilando el servidor..."
bun run typecheck
ok "Typecheck sin errores (cliente y servidor)."
bun run build:server
ok "Servidor compilado en server/dist/actions.js."

echo ""
echo "NOTA HONESTA: 'bun run build:client' está bloqueado por diseño fuera del"
echo "pipeline oficial de la plataforma (el SDK exige su driver de compilación)."
echo "El código del cliente está sano y compila sin errores, pero la publicación"
echo "oficial requiere las herramientas de la plataforma."
echo ""
echo "Configuración terminada. La base de datos está en data/app.db."
