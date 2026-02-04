#!/bin/bash
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <recipient> <message>"
    exit 1
fi
RECIPIENT=$1
shift
MESSAGE="$*"
osascript "$(dirname "$0")/send_imessage.scpt" "$RECIPIENT" "$MESSAGE"