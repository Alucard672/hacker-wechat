on run {targetBuddy, targetMessage}
    tell application "Messages"
        try
            set targetService to 1st service whose service type is iMessage
            set theBuddy to buddy targetBuddy of targetService
            send targetMessage to theBuddy
            return "SUCCESS"
        on error errMsg
            return "ERROR: " & errMsg
        end try
    end tell
end run