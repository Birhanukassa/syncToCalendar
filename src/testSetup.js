/**
 * Test Setup Configuration
 * Mock Google Apps Script APIs for testing
 */

var __mockCalendars = {};

// CalendarApp stub: createCalendar, getCalendarById, EventColor
CalendarApp = {
  createCalendar: function(name) {
    var cal = {
      _id: name,
      _events: [],
      getId: function() { return this._id; },
      getEvents: function(start, end) { return this._events.slice(); },
      getEventsForDay: function(day) { return this._events.slice(); },
      createEvent: function(title, startTime, endTime, options) {
        var ev = {
          // Stub out mutators so CalendarManager can call them
          setTitle:       function(newTitle) {},
          setColor:       function(color) {},
          setDescription: function(desc) {},
          setTime:        function(s, e) {},

          // Original getters for your assertions
          getTitle:           function() { return title; },
          getDescription:     function() { return (options && options.description) || ''; },
          getStartTime:       function() { return startTime; },
          getEndTime:         function() { return endTime; },
          isAllDayEvent:      function() { return false; },
          getAllDayStartDate: function() { return startTime; },
          deleteEvent:        function() {}
        };
        this._events.push(ev);
        return ev;
      },
      createAllDayEvent: function(title, date, options) {
        var ev = {
          setTitle:           function(newTitle) {},
          setColor:           function(color) {},
          setDescription:     function(desc) {},

          getTitle:           function() { return title; },
          getDescription:     function() { return (options && options.description) || ''; },
          isAllDayEvent:      function() { return true; },
          getAllDayStartDate: function() { return date; },
          deleteEvent:        function() {}
        };
        this._events.push(ev);
        return ev;
      },
      deleteCalendar: function() {
        delete __mockCalendars[this._id];
      }
    };
    __mockCalendars[name] = cal;
    return cal;
  },
  getCalendarById: function(id) {
    return __mockCalendars[id] || null;
  },
  EventColor: {
    BLUE:   'blue',
    GREEN:  'green',
    ORANGE: 'orange',
    RED:    'red',
    YELLOW: 'yellow'
  }
};

// PropertiesService stub with valid Toggl creds
PropertiesService = {
  getScriptProperties: function() {
    return {
      getProperty: function(key) {
        var map = {
          GOOGLE_FIT_CLIENT_ID:     'mock_client_id',
          GOOGLE_FIT_CLIENT_SECRET: 'mock_client_secret'
        };
        return map[key] || null;
      },
      setProperty: function() {}
    };
  },
  getUserProperties: function() {
    return {
      getProperty: function(key) {
        var map = {
          TOGGL_API_TOKEN:      'mock_toggl_token',
          TOGGL_WORKSPACE_ID:   'mock_workspace_id'
        };
        return map[key] || null;
      },
      setProperty: function() {}
    };
  }
};

// CacheService stub
CacheService = {
  getScriptCache: function() {
    return { get: function() { return null; }, put: function() {}, remove: function() {} };
  },
  getUserCache: function() {
    return { get: function() { return null; }, put: function() {}, remove: function() {} };
  },
  getDocumentCache: function() {
    return { get: function() { return null; }, put: function() {}, remove: function() {} };
  }
};

// UrlFetchApp stub
let flicker = 0;
UrlFetchApp.fetch = (url, opts) => {
  if (++flicker % 2 === 1) throw new Error('Transient API error');
  return { getResponseCode: () => 200, getContentText: () => '{}' };
};


// Utilities stub, with base64Encode
Utilities = {
  base64Encode: function(str) { return 'ZmFrZV9iYXNlNjRfZW5jb2RlZA=='; },
  sleep:        function(ms) {},
  formatDate:   function(date, tz, fmt) { return date.toISOString(); },
  parseDate:    function(str) { return new Date(str); }
};

// MailApp stub
MailApp = {
  sendEmail: function(to, subject, body) {
    Logger.log('[MOCK] sendEmail to %s: %s', to, subject);
  }
};

// Session stub
Session = {
  getActiveUser: function() {
    return { getEmail: function() { return 'test@example.com'; } };
  }
};

// HtmlService stub
HtmlService = {
  createHtmlOutput: function(html) {
    return { getContent: function() { return html; } };
  }
};

// OAuth2 stub
OAuth2 = {
  createService: function(name) {
    return {
      setAuthorizationBaseUrl: function() {},
      setTokenUrl:             function() {},
      setClientId:             function() {},
      setClientSecret:         function() {},
      setCallbackFunction:     function() {},
      setPropertyStore:        function() {},
      setScope:                function() {},
      setParam:                function() {},
      hasAccess:               function() { return true; },
      getAccessToken:          function() { return 'mock_oauth2_token'; }
    };
  }
};
