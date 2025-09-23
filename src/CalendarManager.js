/**
 * Calendar Operations Manager - Handles all calendar operations with batching
 */
class CalendarManager {
    constructor(calendarId, errorHandler, config) {
        this.config = config;
        this.calendar = CalendarApp.getCalendarById(calendarId);
        if (!this.calendar) {
            throw new Error(`Calendar not found: ${calendarId}`);
        }
        this.errorHandler = errorHandler;
        this.eventCache = new Map();
        this.pendingOperations = [];
        this.stats = {
            created: 0,
            updated: 0,
            deleted: 0,
            skipped: 0,
        };
    }

    /**
     * Efficient event search with caching
     */
    findEventByKey(eventKey, start, end) {
        const cacheKey = `${eventKey}_${start.getTime()}_${end.getTime()}`;

        if (this.eventCache.has(cacheKey)) {
            return this.eventCache.get(cacheKey);
        }

        // Use a reasonable search window (48 hours buffer)
        const searchStart = new Date(start.getTime() - 48 * 60 * 60 * 1000);
        const searchEnd = new Date(end.getTime() + 48 * 60 * 60 * 1000);

        try {
            const events = this.calendar.getEvents(searchStart, searchEnd);
            const foundEvent = events.find(e => {
                const description = e.getDescription();
                return description && description.includes(eventKey);
            });

            this.eventCache.set(cacheKey, foundEvent || null);
            return foundEvent;
        } catch (e) {
            this.errorHandler.recordError(e, `Finding event with key: ${eventKey}`);
            return null;
        }
    }

    /**
     * Batch create/update operations for better performance
     */
    queueOperation(operation) {
        this.pendingOperations.push(operation);

        if (this.pendingOperations.length >= this.config.BATCH_SIZE) {
            this.flushOperations();
        }
    }

    flushOperations() {
        if (this.config.DRY_RUN) {
            console.log(`[DRY RUN] Would execute ${this.pendingOperations.length} operations`);
            this.pendingOperations = [];
            return;
        }

        const operations = [...this.pendingOperations];
        this.pendingOperations = [];

        operations.forEach((op, index) => {
            try {
                op();
            } catch (error) {
                this.errorHandler.recordError(
                    error,
                    `Batch operation ${index + 1}/${operations.length}`
                );
            }
        });
    }

    /**
     * Smart event creation/update with deduplication
     */
    syncEvent(eventData) {
        const { key, title, start, end, description, color, isAllDay } = eventData;

        try {
            const existingEvent = this.findEventByKey(key, start, end);
            const fullDescription = `${key}\n${description}`;

            if (existingEvent) {
                if (
                    this.eventNeedsUpdate(
                        existingEvent,
                        title,
                        start,
                        end,
                        fullDescription,
                        isAllDay
                    )
                ) {
                    this.queueOperation(() => {
                        existingEvent.setTitle(title);
                        if (!isAllDay) {
                            existingEvent.setTime(start, end);
                        }
                        existingEvent.setColor(color);
                        existingEvent.setDescription(fullDescription);
                        console.log(`Updated event: ${title}`);
                        this.stats.updated++;
                    });
                } else {
                    this.stats.skipped++;
                }
            } else {
                this.queueOperation(() => {
                    const newEvent = isAllDay
                        ? this.calendar.createAllDayEvent(title, start, {
                              description: fullDescription,
                          })
                        : this.calendar.createEvent(title, start, end, {
                              description: fullDescription,
                          });
                    newEvent.setColor(color);
                    console.log(`Created event: ${title}`);
                    this.stats.created++;
                });
            }
        } catch (e) {
            this.errorHandler.recordError(e, `Syncing event: ${title}`);
        }
    }

    eventNeedsUpdate(event, newTitle, newStart, newEnd, newDescription, isAllDay) {
        try {
            // Check basic properties
            if (event.getTitle() !== newTitle || event.getDescription() !== newDescription) {
                return true;
            }

            // Check timing
            if (isAllDay && event.isAllDayEvent()) {
                const eventDate = event.getAllDayStartDate();
                return eventDate.toDateString() !== newStart.toDateString();
            } else if (!isAllDay && !event.isAllDayEvent()) {
                return (
                    event.getStartTime().getTime() !== newStart.getTime() ||
                    event.getEndTime().getTime() !== newEnd.getTime()
                );
            } else {
                // Event type mismatch (all-day vs timed)
                return true;
            }
        } catch (e) {
            this.errorHandler.recordError(e, 'Checking if event needs update');
            return false; // Don't update if we can't determine
        }
    }

    /**
     * Efficient deletion of orphaned events
     */
    deleteOrphanedEvents(keyPrefix, validIds, dateRange) {
        if (this.config.DRY_RUN) {
            console.log(`[DRY RUN] Would check for orphaned events with prefix: ${keyPrefix}`);
            return;
        }

        try {
            const events = this.calendar.getEvents(dateRange.start, dateRange.end);
            const orphans = events.filter(event => {
                const description = event.getDescription();
                if (!description || !description.startsWith(keyPrefix)) {
                    return false;
                }

                const match = description.match(new RegExp(`^${keyPrefix}(.*?)(?:\\n|$)`));
                return match && !validIds.has(match[1]);
            });

            orphans.forEach(event => {
                this.queueOperation(() => {
                    console.log(`Deleting orphaned event: ${event.getTitle()}`);
                    event.deleteEvent();
                    this.stats.deleted++;
                });
            });

            if (orphans.length > 0) {
                console.log(`Found ${orphans.length} orphaned events to delete`);
            }
        } catch (e) {
            this.errorHandler.recordError(e, `Deleting orphaned events with prefix: ${keyPrefix}`);
        }
    }

    getCalendar() {
        return this.calendar;
    }

    getStats() {
        return this.stats;
    }
}
