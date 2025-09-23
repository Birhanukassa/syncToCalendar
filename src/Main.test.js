/**
 * Node.js Test Version of Main.js
 * This version mocks Google Apps Script APIs for testing
 */

// Mock Google Apps Script APIs
global.CalendarApp = {
    getCalendarById: id => ({
        getId: () => id,
        getEvents: () => [],
        createEvent: (title, start, end, options) => ({
            setTitle: () => {},
            setTime: () => {},
            setColor: () => {},
            setDescription: () => {},
            getTitle: () => title,
            getDescription: () => options?.description || '',
            getStartTime: () => start,
            getEndTime: () => end,
            isAllDayEvent: () => false,
            getAllDayStartDate: () => start,
            deleteEvent: () => {},
        }),
        createAllDayEvent: (title, date, options) => ({
            setTitle: () => {},
            setColor: () => {},
            setDescription: () => {},
            getTitle: () => title,
            getDescription: () => options?.description || '',
            isAllDayEvent: () => true,
            getAllDayStartDate: () => date,
            deleteEvent: () => {},
        }),
    }),
    EventColor: {
        ORANGE: 'orange',
        BLUE: 'blue',
        PALE_BLUE: 'pale_blue',
        GREEN: 'green',
        RED: 'red',
        GRAY: 'gray',
    },
};

global.PropertiesService = {
    getUserProperties: () => ({
        getProperty: key => {
            const mockProps = {
                TOGGL_API_TOKEN: 'mock_token',
                TOGGL_WORKSPACE_ID: 'mock_workspace',
            };
            return mockProps[key] || null;
        },
    }),
    getScriptProperties: () => ({
        getProperty: key => {
            const mockProps = {
                GOOGLE_FIT_CLIENT_ID: 'mock_client_id',
                GOOGLE_FIT_CLIENT_SECRET: 'mock_client_secret',
            };
            return mockProps[key] || null;
        },
    }),
};

global.Session = {
    getActiveUser: () => ({
        getEmail: () => 'test@example.com',
    }),
};

global.Utilities = {
    base64Encode: str => Buffer.from(str).toString('base64'),
    sleep: ms => {
        // In Node.js, we can't actually sleep synchronously, so we'll just log
        console.log(`[MOCK] Sleeping for ${ms}ms`);
    },
};

global.MailApp = {
    sendEmail: (to, subject, body) => {
        console.log(`[MOCK] Email sent to ${to}: ${subject}`);
    },
};

global.UrlFetchApp = {
    fetch: (url, options) => ({
        getResponseCode: () => 200,
        getContentText: () => '{"mock": "response"}',
    }),
};

// Mock OAuth2 (simplified)
global.OAuth2 = {
    createService: name => ({
        setAuthorizationBaseUrl: () => {},
        setTokenUrl: () => {},
        setClientId: () => {},
        setClientSecret: () => {},
        setCallbackFunction: () => {},
        setPropertyStore: () => {},
        setScope: () => {},
        setParam: () => {},
        hasAccess: () => false,
        getAccessToken: () => 'mock_token',
    }),
};

// Import the classes (we'll need to make them Node.js compatible)
const fs = require('fs');
const path = require('path');

// Simple class loader for Node.js
function loadClass(className) {
    const filePath = path.join(__dirname, `${className}.js`);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Remove Google Apps Script specific code and make it Node.js compatible
        const nodeContent = content
            .replace(/class\s+(\w+)/g, 'class $1')
            .replace(/\/\*\*[\s\S]*?\*\//g, ''); // Remove JSDoc comments

        // Create a temporary module
        const Module = require('module');
        const tempModule = new Module();
        tempModule._compile(nodeContent, filePath);
        return tempModule.exports[className] || eval(`(${nodeContent}); ${className}`);
    }
    return null;
}

// Define mock classes directly
class ConfigurationManager {
    constructor() {
        this.config = {
            CALENDAR_ID: 'test@example.com',
            DAYS_TO_SYNC: 7,
            MAX_RETRIES: 3,
            RETRY_DELAY_MS: 1000,
            BATCH_SIZE: 50,
            NOTIFY_ON_ERROR: true,
            ERROR_EMAIL: 'test@example.com',
            DRY_RUN: true,
            TOGGL: { ENABLED: false },
            GOOGLE_FIT: { ENABLED: false },
        };
    }
    get() {
        return this.config;
    }
}

class ErrorHandler {
    constructor(config) {
        this.config = config;
        this.errors = [];
    }
    recordError(error, context) {
        this.errors.push({ error, context, timestamp: new Date() });
        console.error(`[ERROR] ${context}: ${error.message || error}`);
    }
    hasErrors() {
        return this.errors.length > 0;
    }
    sendErrorNotification() {
        console.log('[MOCK] Error notification sent');
    }
}

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.startTime = Date.now();
    }
    startOperation(name) {
        this.metrics[name] = { startTime: Date.now(), operations: 0, errors: 0 };
    }
    endOperation(name) {
        if (this.metrics[name]) {
            this.metrics[name].duration = Date.now() - this.metrics[name].startTime;
        }
    }
    incrementCounter(name) {
        if (this.metrics[name]) this.metrics[name].operations++;
    }
    incrementError(name) {
        if (this.metrics[name]) this.metrics[name].errors++;
    }
    logReport() {
        console.log('Performance Report:');
        console.log('==================');
        Object.keys(this.metrics).forEach(key => {
            const metric = this.metrics[key];
            console.log(`${key}: ${metric.operations} operations, ${metric.errors} errors`);
        });
    }
}

// Mock source classes
class MockTogglSource {
    constructor(config, calendarManager, errorHandler, monitor) {
        this.config = config;
        this.calendarManager = calendarManager;
        this.errorHandler = errorHandler;
        this.monitor = monitor;
    }
    sync() {
        console.log('Mock Toggl sync - no actual API calls');
        this.monitor.startOperation('toggl_sync');
        this.monitor.incrementCounter('toggl_sync');
        this.monitor.endOperation('toggl_sync');
    }
}

class MockGoogleFitSource {
    constructor(config, calendarManager, errorHandler, monitor) {
        this.config = config;
        this.calendarManager = calendarManager;
        this.errorHandler = errorHandler;
        this.monitor = monitor;
    }
    sync() {
        console.log('Mock Google Fit sync - no actual API calls');
        this.monitor.startOperation('google_fit_sync');
        this.monitor.incrementCounter('google_fit_sync');
        this.monitor.endOperation('google_fit_sync');
    }
}

// Mock CalendarManager
class MockCalendarManager {
    constructor(calendarId, errorHandler, config) {
        this.calendarId = calendarId;
        this.errorHandler = errorHandler;
        this.config = config;
        this.stats = { created: 0, updated: 0, deleted: 0, skipped: 0 };
    }
    getCalendar() {
        return { getId: () => this.calendarId };
    }
    syncEvent(eventData) {
        console.log(`[MOCK] Would sync event: ${eventData.title}`);
        this.stats.created++;
    }
    flushOperations() {
        console.log('[MOCK] Flushing calendar operations');
    }
    deleteOrphanedEvents() {
        console.log('[MOCK] Checking for orphaned events');
    }
}

/**
 * Main function to run all sync operations (Node.js version)
 */
function syncAllSources() {
    console.log('Starting calendar sync process (Node.js test version)...');

    const configManager = new ConfigurationManager();
    const config = configManager.get();
    const errorHandler = new ErrorHandler(config);
    const monitor = new PerformanceMonitor();

    try {
        const calendarManager = new MockCalendarManager(config.CALENDAR_ID, errorHandler, config);

        const sources = [
            new MockTogglSource(config, calendarManager, errorHandler, monitor),
            new MockGoogleFitSource(config, calendarManager, errorHandler, monitor),
        ];

        sources.forEach(source => {
            try {
                source.sync();
            } catch (e) {
                errorHandler.recordError(e, `Syncing source: ${source.constructor.name}`);
            }
        });

        console.log('Sync process finished.');
    } catch (e) {
        errorHandler.recordError(e, 'Main sync process');
    } finally {
        monitor.logReport();
        if (errorHandler.hasErrors()) {
            errorHandler.sendErrorNotification();
        }
        console.log('Sync execution complete.');
    }
}

// Execute the sync function when running directly
if (require.main === module) {
    syncAllSources();
}

module.exports = { syncAllSources };
