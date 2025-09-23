/**
 * ========================================================================
 * Main Entry Point
 * ========================================================================
 */

/**
 * Main function to run all sync operations.
 * This function should be set up to run on a trigger.
 */
function syncAllSources() {
    const configManager = new ConfigurationManager();
    const config = configManager.get();
    const errorHandler = new ErrorHandler(config);
    const monitor = new PerformanceMonitor();

    try {
        console.log('Starting calendar sync process...');

        const calendarManager = new CalendarManager(config.CALENDAR_ID, errorHandler, config);

        const sources = [
            new TogglSource(config, calendarManager, errorHandler, monitor),
            new GoogleFitSource(config, calendarManager, errorHandler, monitor),
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
if (typeof require !== 'undefined' && require.main === module) {
    syncAllSources();
}
