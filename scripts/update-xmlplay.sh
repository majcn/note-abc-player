#!/bin/bash

# Update script for xmlplay
# Downloads the latest version from https://wim.vree.org/js3/xmlplay_index.html

set -e  # Exit on error

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/src/lib/vendor/xmlplay"
TMP_DIR="$ROOT_DIR/.tmp-xmlplay-update"
BASE_URL="https://wim.vree.org/js3"
INDEX_URL="$BASE_URL/xmlplay_index.html"

echo "=== xmlplay Update Script ==="
echo ""

# Clean up function
cleanup() {
  if [ -d "$TMP_DIR" ]; then
    echo "Cleaning up temporary files..."
    rm -rf "$TMP_DIR"
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Create temporary directory
if [ -d "$TMP_DIR" ]; then
  rm -rf "$TMP_DIR"
fi
mkdir -p "$TMP_DIR"

# Find the latest version from the index page
echo "Finding latest version..."
ZIP_FILE=$(curl -s "$INDEX_URL" | grep -o 'xmlplay_[0-9]*\.zip' | head -1)

if [ -z "$ZIP_FILE" ]; then
  echo "Error: Could not find xmlplay zip file on $INDEX_URL"
  exit 1
fi

VERSION=$(echo "$ZIP_FILE" | grep -o '[0-9]*')
echo "Found version: $VERSION ($ZIP_FILE)"
echo ""

# Download zip file
ZIP_URL="$BASE_URL/$ZIP_FILE"
ZIP_PATH="$TMP_DIR/$ZIP_FILE"

echo "Downloading from $ZIP_URL..."
curl -L -o "$ZIP_PATH" "$ZIP_URL"
echo "✓ Download complete"
echo ""

# Extract zip file
echo "Extracting $ZIP_FILE to $TMP_DIR..."
unzip -q "$ZIP_PATH" -d "$TMP_DIR"
echo "✓ Extraction complete"
echo ""

# Find the extracted directory (xmlplay_NNN)
EXTRACTED_DIR=$(find "$TMP_DIR" -maxdepth 1 -type d -name "xmlplay_*" | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
  echo "Error: Could not find xmlplay_* directory"
  ls -la "$TMP_DIR"
  exit 1
fi

SOURCE_DIR="$EXTRACTED_DIR/full_source"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Could not find full_source directory in $EXTRACTED_DIR"
  ls -la "$EXTRACTED_DIR"
  exit 1
fi

echo "Found source directory: $SOURCE_DIR"
echo ""

# Refresh pristine upstream copies in $VENDOR_DIR. Only the two modules we
# actually use (_lib and _syn) are vendored. The forked copies under
# src/lib/xmlplay/ are kept up to date manually after reviewing the vendor diff.
mkdir -p "$VENDOR_DIR"
echo "Copying upstream files to $VENDOR_DIR..."
for filename in xmlplay_lib.js xmlplay_syn.js; do
  cp "$SOURCE_DIR/$filename" "$VENDOR_DIR/"
done
echo "✓ Copied xmlplay_lib.js, xmlplay_syn.js"

echo ""
echo "✓ Update complete! Updated to xmlplay version $VERSION"
echo "  Next: diff $VENDOR_DIR against src/lib/xmlplay/ and port changes manually."
