/**
 * Main function to run all tests.
 * Creates a temp calendar, runs each test, then deletes it.
 */
function runTests() {
  var testCalendarName = '_TEST_CALENDAR_' + new Date().getTime();
  var testCalendar;

  try {
    Logger.log('Creating temporary test calendar: %s', testCalendarName);
    testCalendar = CalendarApp.createCalendar(testCalendarName);
    var testCalendarId = testCalendar.getId();

    // Call each test by name:
    test_TogglEventCreation(testCalendarId);
    // …add more tests here as you write them…

    Logger.log('✅ All tests completed successfully.');
  } catch (e) {
    Logger.log('❌ A test failed: %s', e.toString());
    throw e;  // so the execution log shows failure
  } finally {
    if (testCalendar) {
      Logger.log('Deleting temporary test calendar: %s', testCalendarName);
      testCalendar.deleteCalendar();
    }
  }
}
