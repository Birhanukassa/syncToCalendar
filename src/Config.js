/**
 * Configuration Manager - Loads, validates, and defaults per-user sync settings
 */
class ConfigurationManager {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig(this.config);
  }

  loadConfig() {
    const props = PropertiesService.getUserProperties();
    const defaults = ConfigurationManager.getDefaultConfig();

    return {
      CALENDAR_ID: props.getProperty('CALENDAR_ID') || defaults.CALENDAR_ID,
      ERROR_EMAIL: props.getProperty('ERROR_EMAIL') || Session.getActiveUser().getEmail(),
      DRY_RUN: props.getProperty('DRY_RUN') === 'true',

      TOGGL: {
        ENABLED: props.getProperty('TOGGL_ENABLED') !== 'false',
        API_TOKEN: props.getProperty('TOGGL_API_TOKEN') || '',
        WORKSPACE_ID: props.getProperty('TOGGL_WORKSPACE_ID') || '',
        TAG_CALENDAR_MAP: this.parseJsonProperty(props.getProperty('TOGGL_TAG_CALENDAR_MAP')),
        PROJECT_CALENDAR_MAP: this.parseJsonProperty(props.getProperty('TOGGL_PROJECT_CALENDAR_MAP')),
      },

      GOOGLE_FIT: {
        ENABLED: props.getProperty('GOOGLE_FIT_ENABLED') !== 'false',
        SOURCE_ID: props.getProperty('GOOGLE_FIT_SOURCE') || '',
      }
    };
  }

  static getDefaultConfig() {
    return {
      CALENDAR_ID: '',
      ERROR_EMAIL: '',
      DRY_RUN: false,
      TOGGL_ENABLED: true,
      GOOGLE_FIT_ENABLED: true,
      TOGGL_TAG_CALENDAR_MAP: '{}',
      TOGGL_PROJECT_CALENDAR_MAP: '{}'
    };
  }

  parseJsonProperty(value) {
    try {
      return value ? JSON.parse(value) : {};
    } catch (e) {
      console.warn('Invalid JSON in config:', value);
      return {};
    }
  }

  validateConfig(config) {
    const missing = [];

    if (!config.CALENDAR_ID) missing.push('CALENDAR_ID');
    if (config.TOGGL.ENABLED && !config.TOGGL.API_TOKEN) missing.push('TOGGL_API_TOKEN');
    if (config.GOOGLE_FIT.ENABLED && !config.GOOGLE_FIT.SOURCE_ID) missing.push('GOOGLE_FIT_SOURCE');

    if (missing.length > 0) {
      console.error('Missing required config fields:', missing.join(', '));
      throw new Error('Missing required config: ' + missing.join(', '));
    }
  }
}

/**
 * Dashboard Integration Helpers
 */
function getUserConfig() {
  const props = PropertiesService.getUserProperties();
  return {
    CALENDAR_ID: props.getProperty('CALENDAR_ID') || '',
    TOGGL_API_TOKEN: props.getProperty('TOGGL_API_TOKEN') || '',
    TOGGL_WORKSPACE_ID: props.getProperty('TOGGL_WORKSPACE_ID') || '',
    GOOGLE_FIT_SOURCE: props.getProperty('GOOGLE_FIT_SOURCE') || '',
    ERROR_EMAIL: props.getProperty('ERROR_EMAIL') || Session.getActiveUser().getEmail(),
    DRY_RUN: props.getProperty('DRY_RUN') || 'false',
    TOGGL_ENABLED: props.getProperty('TOGGL_ENABLED') || 'true',
    GOOGLE_FIT_ENABLED: props.getProperty('GOOGLE_FIT_ENABLED') || 'true',
    TOGGL_TAG_CALENDAR_MAP: props.getProperty('TOGGL_TAG_CALENDAR_MAP') || '{}',
    TOGGL_PROJECT_CALENDAR_MAP: props.getProperty('TOGGL_PROJECT_CALENDAR_MAP') || '{}'
  };
}

function saveUserConfig(config) {
  const props = PropertiesService.getUserProperties();
  Object.keys(config).forEach(key => props.setProperty(key, config[key]));
}

function resetUserConfig() {
  PropertiesService.getUserProperties().deleteAllProperties();
}

function validateCalendarId(id) {
  try {
    const cal = CalendarApp.getCalendarById(id);
    return cal !== null;
  } catch (e) {
    return false;
  }
}
function setupRequiredConfig() {
  const props = PropertiesService.getUserProperties();

  // Calendar ID: usually your Gmail address or a secondary calendar ID
  props.setProperty('CALENDAR_ID', 'your-calendar-id@group.calendar.google.com');

  // Google Fit source: adjust to the data source your GoogleFitSource expects
  props.setProperty(
    'GOOGLE_FIT_SOURCE',
    'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
  );
}

