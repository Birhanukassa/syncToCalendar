/**
 * Configuration Manager - Validates and provides access to configuration
 */
class ConfigurationManager {
    constructor() {
        this.config = this.loadAndValidateConfig();
    }

    loadAndValidateConfig() {
        const config = {
            CALENDAR_ID: 'hirutbelhu@gmail.com',
            DAYS_TO_SYNC: 7,
            MAX_RETRIES: 3,
            RETRY_DELAY_MS: 1000,
            BATCH_SIZE: 50,
            NOTIFY_ON_ERROR: true,
            ERROR_EMAIL: Session.getActiveUser().getEmail(),
            DRY_RUN: false, // Set to true to preview changes without modifying calendar

            TOGGL: {
                ENABLED: true,
                COLOR: CalendarApp.EventColor.ORANGE,
                API_TOKEN: this.getSecureProperty('TOGGL_API_TOKEN'),
                WORKSPACE_ID: this.getSecureProperty('TOGGL_WORKSPACE_ID'),
                INCLUDE_PROJECT_IN_TITLE: true,
                INCLUDE_TAGS_IN_TITLE: true,
                INCLUDE_NOTES_IN_DESCRIPTION: true,
                TAG_CALENDAR_MAP: {}, // e.g., { "urgent": "urgent@group.calendar.google.com" }
                PROJECT_CALENDAR_MAP: {}, // e.g., { "Client Work": "client@group.calendar.google.com" }
                FILTER_BY_TAGS: [], // Only sync entries with these tags if specified
                RATE_LIMIT_MS: 100,
                MIN_DURATION_MINUTES: 0, // Skip entries shorter than this
            },

            GOOGLE_FIT: {
                ENABLED: true,
                COLOR: CalendarApp.EventColor.BLUE,
                RATE_LIMIT_MS: 50,
                SYNC_STEPS: {
                    ENABLED: true,
                    COLOR: CalendarApp.EventColor.BLUE,
                    MIN_STEPS_TO_SYNC: 1000,
                },
                SYNC_SLEEP: {
                    ENABLED: true,
                    COLOR: CalendarApp.EventColor.PALE_BLUE,
                    MIN_DURATION_HOURS: 1, // Skip sleep sessions shorter than this
                },
                SYNC_WORKOUTS: {
                    ENABLED: true,
                    COLOR: CalendarApp.EventColor.GREEN,
                    MIN_DURATION_MINUTES: 5, // Skip workouts shorter than this
                },
                SYNC_HEART_RATE: {
                    ENABLED: true,
                    COLOR: CalendarApp.EventColor.RED,
                    DATA_TYPE_NAME: 'com.google.heart_rate.summary',
                },
                SYNC_WEIGHT: {
                    ENABLED: true,
                    COLOR: CalendarApp.EventColor.GRAY,
                    DATA_TYPE_NAME: 'com.google.weight.summary',
                },
            },
        };

        // Validate critical configuration
        if (!config.CALENDAR_ID) {
            throw new Error('CALENDAR_ID is required');
        }

        // Only validate Toggl credentials if Toggl is enabled
        if (config.TOGGL.ENABLED && (!config.TOGGL.API_TOKEN || !config.TOGGL.WORKSPACE_ID)) {
            console.warn(
                'Toggl is enabled but credentials are missing. Toggl sync will be skipped.'
            );
            config.TOGGL.ENABLED = false;
        }

        return config;
    }

    getSecureProperty(key) {
        try {
            const value = PropertiesService.getUserProperties().getProperty(key);
            if (!value && key.includes('TOKEN')) {
                console.warn(`Missing secure property: ${key}`);
            }
            return value;
        } catch (e) {
            console.error(`Error accessing property ${key}: ${e.toString()}`);
            return null;
        }
    }

    get() {
        return this.config;
    }
}
