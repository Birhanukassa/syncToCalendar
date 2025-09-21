# Google Calendar Sync Script

This Google Apps Script project automatically syncs data from various third-party services (like Toggl for time tracking and Google Fit for health metrics) to your Google Calendar. It creates and updates calendar events, providing a unified view of your activities.

## Features

-   **Modular Design:** Easily add new data sources by creating a new source class.
-   **Toggl Integration:**
    -   Syncs time entries as calendar events.
    -   Optionally includes project names and tags in event titles.
    -   Supports mapping specific Toggl projects or tags to different Google Calendars.
-   **Google Fit Integration:**
    -   Syncs daily step counts as all-day events.
    -   Syncs sleep sessions and workouts.
-   **
### 2. Create and Link the Apps Script Project
    ```bash
    clasp login

This script requires the `OAuth2 for Apps Script` library to connect to Google Fit.

1.  In the Apps Script editor, go to **Libraries** <img src="https://developers.google.com/apps-script/images/add_library.png" width="20" alt="Add library icon">.
2.  In the "Script ID" field, enter `1B7FSrk57A1B1Ld32VGM559DS31JAZjlJ79993IAPE6EaA2d5hT8PHDG6` and click **Look up**.
3.  Select the latest version, ensure the identifier is `OAuth2`, and click **Add**.

### 4. Set Script Credentials

Open `src/Setup.js` in your local editor. You will run functions from this file to securely store your API keys.

1.  **Toggl:**
    -   In the `setTogglCredentials` function, replace the placeholder values with your Toggl API Token and Workspace ID.
    -   Push the changes to Apps Script: `clasp push`.
    -   In the Apps Script editor, select and run the `setTogglCredentials` function once.
    -   You can now safely remove your credentials from the code in `Setup.js`.

2.  **Google Fit:**
    -   You will need a **Client ID** and **Client Secret** from a Google Cloud Platform project with the **Fitness API** enabled.
    -   In the `setGoogleFitCredentials` function, replace the placeholders with your GCP credentials.
    -   Push the changes: `clasp push`.
    -   In the Apps Script editor, select and run `setGoogleFitCredentials` once.
    -   You can now safely remove your credentials from the code.

### 5. Authorize the Script

1.  From the Apps Script editor, select and run the `authorizeGoogleFit` function.
2.  Check the **Execution log** for an authorization URL.
3.  Open the URL, choose your Google account, and grant the necessary permissions.

### 6. Set Up a Trigger

To make the script run automatically:

1.  In the Apps Script editor, go to **Triggers** (the clock icon ⏰).
2.  Click **Add Trigger**.
3.  Choose `syncAllSources` to run, select "Time-driven" as the event source, and set a schedule (e.g., "Hour timer" every hour).
4.  Save the trigger.

## Configuration

All script behavior can be customized in the `src/Config.js` file. You can enable/disable sources, change event colors, set minimum thresholds for syncing, and more. Make sure to set your primary `CALENDAR_ID` at the top of the file.

## License

This project is licensed under the MIT License. See the LICENSE file for details.