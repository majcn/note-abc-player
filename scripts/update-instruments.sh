#!/bin/bash

# Update script for xmlplay instrument files
# Downloads all instrument files from https://wim.vree.org/js3/

set -e  # Exit on error

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_DIR="$ROOT_DIR/static/js3"
BASE_URL="https://wim.vree.org/js3"

# List of all available instruments
INSTRUMENTS=("instr0mp3.js" "instr14mp3.js" "instr25mp3.js" "instr32mp3.js")

echo "=== Instrument Files Update Script ==="
echo "Updating all instrument files..."
echo ""

# Function to update a single instrument
update_instrument() {
  local instrument_file="$1"
  local main_url="$BASE_URL/$instrument_file"
  local fallback_url="$BASE_URL/jssf_files/$instrument_file"

  echo "Updating $instrument_file..."

  # Try main URL first, fallback to jssf_files/
  if curl -L -f -k -o "$STATIC_DIR/$instrument_file" "$main_url"; then
    echo "✓ Downloaded from main URL"
  else
    echo "⚠ Main URL failed, trying fallback: $fallback_url"
    if ! curl -L -f -k -o "$STATIC_DIR/$instrument_file" "$fallback_url"; then
      echo "❌ Error: Failed to download $instrument_file"
      return 1
    fi
    echo "✓ Downloaded from fallback URL"
  fi

  echo ""
  return 0
}

mkdir -p "$STATIC_DIR"

UPDATED_COUNT=0
FAILED_COUNT=0

for instr in "${INSTRUMENTS[@]}"; do
  if update_instrument "$instr"; then
    ((UPDATED_COUNT++))
  else
    ((FAILED_COUNT++))
  fi
done

echo "=== Summary ==="
echo "✓ Successfully updated: $UPDATED_COUNT file(s)"
if [ $FAILED_COUNT -gt 0 ]; then
  echo "❌ Failed to update: $FAILED_COUNT file(s)"
  exit 1
fi

echo ""
echo "✓ All instrument files updated successfully!"
