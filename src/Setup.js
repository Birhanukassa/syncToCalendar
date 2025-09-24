/**
 * =================================================================
 *  SETUP & AUTHORIZATION FUNCTIONS
 *  Run these functions manually from the Apps Script editor.
 * =================================================================
 */

/**
 * Seed all required per-user config in one go.
 * Replace placeholder values before running.
 */
function setupRequiredConfig() {
  const props = PropertiesService.getUserProperties();

  props.setProperties({
    // Calendar: usually your Gmail address or a secondary calendar ID
    CALENDAR_ID: 'your-calendar-id@group.calendar.google.com',

    // Error handling
    ERROR_EMAIL: Session.getActiveUser().getEmail(),
    DRY_RUN: 'false',

    // Toggl
    TOGGL_API_TOKEN: 'PASTE_YOUR_TOGGL_API_TOKEN_HERE',
    TOGGL_WORKSPACE_ID: 'PASTE_YOUR_TOGGL_WORKSPACE_ID_HERE',
    TOGGL_ENABLED: 'true',
    TOGGL_TAG_CALENDAR_MAP: '{}',
    TOGGL_PROJECT_CALENDAR_MAP: '{}',

    // Google Fit
    GOOGLE_FIT_SOURCE: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
    GOOGLE_FIT_ENABLED: 'true'
  });

  console.log('✅ Required config seeded into UserProperties.');
}

/**
 * Reset per-user config to defaults.
 */
function resetToDefaults() {
  const props = PropertiesService.getUserProperties();
  props.setProperties({
    CALENDAR_ID: CalendarApp.getDefaultCalendar().getId(),
    ERROR_EMAIL: Session.getActiveUser().getEmail(),
    DRY_RUN: 'false',
    TOGGL_API_TOKEN: '',
    TOGGL_WORKSPACE_ID: '',
    TOGGL_ENABLED: 'true',
    TOGGL_TAG_CALENDAR_MAP: '{}',
    TOGGL_PROJECT_CALENDAR_MAP: '{}',
    GOOGLE_FIT_SOURCE: '',
    GOOGLE_FIT_ENABLED: 'true'
  });
  console.log('🔄 UserProperties reset to defaults.');
}

/**
 * Store global Google Fit OAuth client credentials (project-wide).
 * Run once with your GCP client ID/secret.
 */
function setGoogleFitCredentials() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('GOOGLE_FIT_CLIENT_ID', 'PASTE_YOUR_GOOGLE_FIT_CLIENT_ID_HERE');
  props.setProperty('GOOGLE_FIT_CLIENT_SECRET', 'PASTE_YOUR_GOOGLE_FIT_CLIENT_SECRET_HERE');
  console.log('🔑 Google Fit client credentials stored in ScriptProperties.');
}

/**
 * Begin Google Fit OAuth flow.
 */
function authorizeGoogleFit() {
  const fitSource = new GoogleFitSource(new ConfigurationManager().get(), null, null, null);
  const fitService = fitSource.getGoogleFitService();
  if (!fitService) {
    console.error('❌ Could not create Google Fit service. Did you run setGoogleFitCredentials()?');
    return;
  }

  fitService.reset(); // ensure fresh auth
  if (fitService.hasAccess()) {
    console.log('✅ Authorization successful! Script can access Google Fit.');
  } else {
    console.log('🌐 Open this URL to authorize Google Fit:\n\n%s', fitService.getAuthorizationUrl());
  }
}

/**
 * OAuth2 callback for Google Fit.
 */
function authCallback(request) {
  const fitSource = new GoogleFitSource(new ConfigurationManager().get(), null, null, null);
  const fitService = fitSource.getGoogleFitService();
  const isAuthorized = fitService.handleCallback(request);
  return HtmlService.createHtmlOutput(
    isAuthorized
      ? '✅ Google Fit authorization successful! You may now close this tab.'
      : '❌ Authorization denied. You may close this tab.'
  );
}

/**
 * Reset Google Fit authorization.
 */
function resetGoogleFitAuth() {
  const fitSource = new GoogleFitSource(new ConfigurationManager().get(), null, null, null);
  const fitService = fitSource.getGoogleFitService();
  fitService.reset();
  console.log('🔄 Google Fit authorization reset.');
}

/**
 * Utility: validate a Calendar ID.
 */
function validateCalendarId(email) {
  try {
    return CalendarApp.getCalendarById(email) !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Utility: environment detection.
 */
function getEnvironment() {
  const email = Session.getActiveUser().getEmail();
  return email.endsWith('@yourcompany.com') ? 'prod' : 'dev';
}

/**
 * Expose Config Dashboard UI.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('ConfigDashboard')
    .setTitle('Sync Setup')
    .setWidth(400);
}
