/**
 * Tests for calendar‐syncing sources
 */

/**
 * Tests the creation of a Toggl event.
 * @param {string} calendarId The ID of the test calendar.
 */
function test_TogglEventCreation(calendarId) {
  Logger.log('--- Running test: test_TogglEventCreation ---');

  // 1. Setup production code objects
  var configManager   = new ConfigurationManager();
  var config          = configManager.get();
  config.CALENDAR_ID  = calendarId;
  config.DRY_RUN      = false;

  var errorHandler    = new ErrorHandler(config);
  var monitor         = new PerformanceMonitor();
  var calendarManager = new CalendarManager(config.CALENDAR_ID, errorHandler, config);
  var togglSource     = new TogglSource(config, calendarManager, errorHandler, monitor);

  // 2. Stub out fetchEntries & fetchProjects
  var now   = new Date();
  var start = new Date(now.getTime() - 60*60*1000);
  var end   = now;

  togglSource.fetchEntries = function() {
    Logger.log('Processing %s Toggl entries', 1);
    return [{
      id: 12345,
      start: start.toISOString(),
      stop:  end.toISOString(),
      description: 'Test Toggl Entry',
      tags: ['testing','example'],
      project_id: 98765
    }];
  };
  togglSource.fetchProjects = function() {
    return { 98765: { id: 98765, name: 'Test Project' } };
  };

  // 3. Run sync
  togglSource.sync();

  // 4. Verify results
  var testCal       = CalendarApp.getCalendarById(calendarId);
  var createdEvents = testCal.getEvents(start, end);
  Logger.log('Found %s event(s) in test calendar.', createdEvents.length);

  if (createdEvents.length !== 1) {
    throw new Error('Expected exactly 1 event, found ' + createdEvents.length);
  }
  var ev = createdEvents[0];
  if (ev.getTitle().indexOf('[Test Project] Test Toggl Entry') === -1) {
    throw new Error('Event title incorrect: ' + ev.getTitle());
  }

  Logger.log('... PASSED: test_TogglEventCreation');
}
