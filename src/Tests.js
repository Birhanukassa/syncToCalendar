 /**
  * =================================================================
  *  TESTING FRAMEWORK
  *  =================================================================
  */
 
 /**
  * Main function to run all tests.
  * This will create a temporary calendar, run tests, and then delete it.
  */
 function runTests() {
     const testCalendarName = `_TEST_CALENDAR_${new Date().getTime()}`;
     let testCalendar;
     try {
         console.log(`Creating temporary test calendar: ${testCalendarName}`);
         testCalendar = CalendarApp.createCalendar(testCalendarName);
         const testCalendarId = testCalendar.getId();
 
         // --- Run your tests here ---
         test_TogglEventCreation(testCalendarId);
         // Add more tests...
 
         console.log('✅ All tests completed successfully.');
 
     } catch (e) {
         console.error(`❌ A test failed: ${e.toString()}\n${e.stack}`);
     } finally {
         if (testCalendar) {
             console.log(`Deleting temporary test calendar: ${testCalendarName}`);
             testCalendar.deleteCalendar();
         }
     }
 }
 
 /**
  * Tests the creation of a Toggl event.
  * @param {string} calendarId The ID of the test calendar.
  */
 function test_TogglEventCreation(calendarId) {
     console.log('--- Running test: test_TogglEventCreation ---');
 
     // 1. Setup mock data and dependencies
     const configManager = new ConfigurationManager();
     const config = configManager.get();
     config.CALENDAR_ID = calendarId; // Use test calendar
     config.DRY_RUN = false; // Ensure we actually create events
 
     const errorHandler = new ErrorHandler(config);
     const monitor = new PerformanceMonitor();
     const calendarManager = new CalendarManager(config.CALENDAR_ID, errorHandler, config);
 
     const togglSource = new TogglSource(config, calendarManager, errorHandler, monitor);
 
     const now = new Date();
     const start = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
     const end = new Date(now.getTime());
 
     // 2. Mock the API fetching methods to return controlled data
     togglSource.fetchEntries = () => [{
         id: 12345,
         start: start.toISOString(),
         stop: end.toISOString(),
         description: 'Test Toggl Entry',
         tags: ['testing', 'example'],
         project_id: 98765
     }];
     togglSource.fetchProjects = () => ({ 98765: { id: 98765, name: 'Test Project' } });
 
     // 3. Run the actual sync method
     togglSource.sync();
 
     // 4. Verify the result
     const testCalendar = CalendarApp.getCalendarById(calendarId);
     const createdEvents = testCalendar.getEvents(start, end);
 
     console.log(`Found ${createdEvents.length} event(s) in test calendar.`);
 
     if (createdEvents.length !== 1) {
         throw new Error('Toggl event was not created successfully in the test calendar.');
     }
 
     const event = createdEvents[0];
     if (!event.getTitle().includes('[Test Project] Test Toggl Entry')) {
         throw new Error(`Event title is incorrect. Got: "${event.getTitle()}"`);
     }
 
     console.log('... PASSED: test_TogglEventCreation');
 }