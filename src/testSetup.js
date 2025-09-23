/**
 * Test Setup Configuration
 * Mock Google Apps Script APIs for testing
 */

// Mock Google Apps Script global objects
global.CalendarApp = {
    getCalendarById: jest.fn(() => ({
        createEvent: jest.fn(),
        getEvents: jest.fn(() => []),
        getEventsForDay: jest.fn(() => [])
    })),
    EventColor: {
        BLUE: 'blue',
        GREEN: 'green',
        ORANGE: 'orange',
        RED: 'red',
        YELLOW: 'yellow'
    }
};

global.PropertiesService = {
    getScriptProperties: jest.fn(() => ({
        getProperty: jest.fn(),
        setProperty: jest.fn()
    })),
    getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(),
        setProperty: jest.fn()
    }))
};

global.CacheService = {
    getScriptCache: jest.fn(() => ({
        get: jest.fn(),
        put: jest.fn(),
        remove: jest.fn()
    }))
};

global.UrlFetchApp = {
    fetch: jest.fn(() => ({
        getResponseCode: jest.fn(() => 200),
        getContentText: jest.fn(() => '{}')
    }))
};

global.Utilities = {
    sleep: jest.fn(),
    formatDate: jest.fn((date) => date.toISOString()),
    parseDate: jest.fn((dateString) => new Date(dateString))
};

global.MailApp = {
    sendEmail: jest.fn()
};

global.Session = {
    getActiveUser: jest.fn(() => ({
        getEmail: jest.fn(() => 'test@example.com')
    }))
};

global.HtmlService = {
    createHtmlOutput: jest.fn()
};

// Mock OAuth2 library
global.OAuth2 = jest.fn(() => ({
    fetch: jest.fn(),
    hasAccess: jest.fn(() => true),
    getAccessToken: jest.fn(() => 'mock_token')
}));

// Mock QUnit for test runner
global.QUnit = {
    test: jest.fn(),
    equal: jest.fn(),
    ok: jest.fn(),
    deepEqual: jest.fn()
};
