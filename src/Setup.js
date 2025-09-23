/**
 * =================================================================
 *  SETUP & AUTHORIZATION FUNCTIONS
 *  Run these functions manually from the Apps Script editor.
 * =================================================================
 */

/**
 * Run this function ONCE to store your secret Toggl credentials securely.
 * Replace the placeholder values before running.
 */
function setTogglCredentials() {
    const properties = PropertiesService.getUserProperties();
    properties.setProperty('TOGGL_API_TOKEN', 'PASTE_YOUR_TOGGL_API_TOKEN_HERE');
    properties.setProperty('TOGGL_WORKSPACE_ID', 'PASTE_YOUR_TOGGL_WORKSPACE_ID_HERE');
    console.log(
        'Toggl credentials have been set. You can now delete the placeholder values from this function.'
    );
}

/**
 * Run this function ONCE to store your secret Google Fit OAuth credentials securely.
 * Get these from your Google Cloud Platform project.
 * Replace the placeholder values before running.
 */
function setGoogleFitCredentials() {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('GOOGLE_FIT_CLIENT_ID', 'PASTE_YOUR_GOOGLE_FIT_CLIENT_ID_HERE');
    properties.setProperty('GOOGLE_FIT_CLIENT_SECRET', 'PASTE_YOUR_GOOGLE_FIT_CLIENT_SECRET_HERE');
    console.log(
        'Google Fit credentials have been set. You can now delete the placeholder values from this function.'
    );
}

/**
 * Creates the OAuth2 service for Google Fit.
 * Run this function once from the editor to start the authorization process.
 * Follow the instructions in the logs.
 */
function authorizeGoogleFit() {
    // We instantiate the source class just to get access to the service creation method.
    const fitSource = new GoogleFitSource(new ConfigurationManager().get(), null, null, null);
    const fitService = fitSource.getGoogleFitService();
    if (!fitService) {
        console.error(
            'Could not create Google Fit service. Have you run setGoogleFitCredentials()?'
        );
        return;
    }

    fitService.reset(); // Nuke stale credentials to ensure a fresh authorization.
    if (fitService.hasAccess()) {
        console.log('Authorization successful! The script can now access your Google Fit data.');
    } else {
        const authorizationUrl = fitService.getAuthorizationUrl();
        console.log('Open this URL to authorize Google Fit:\n\n%s', authorizationUrl);
    }
}

/**
 * This is the callback function that must be registered with the OAuth2 service.
 * It will be called automatically after you complete the authorization flow.
 */
function authCallback(request) {
    const fitSource = new GoogleFitSource(new ConfigurationManager().get(), null, null, null);
    const fitService = fitSource.getGoogleFitService();
    const isAuthorized = fitService.handleCallback(request);
    if (isAuthorized) {
        return HtmlService.createHtmlOutput(
            '✅ Google Fit authorization successful! You may now close this tab.'
        );
    } else {
        return HtmlService.createHtmlOutput('❌ Authorization denied. You may close this tab.');
    }
}

/** Resets the authorization, in case you need to re-authorize. */
function resetGoogleFitAuth() {
    const fitSource = new GoogleFitSource(new ConfigurationManager().get(), null, null, null);
    const fitService = fitSource.getGoogleFitService();
    fitService.reset();
    console.log('Google Fit authorization has been reset.');
}
