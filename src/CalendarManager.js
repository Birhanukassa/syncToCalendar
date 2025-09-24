/**
 * Calendar Operations Manager - Handles all calendar operations with batching
 */
class CalendarManager {
  constructor(calendarId, errorHandler, config) {
    this.config       = config;
    this.errorHandler = errorHandler;
    this.calendar     = this._initCalendar(calendarId);
    this.eventCache   = new Map();
    this.pendingOperations = [];
    this.stats = {
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
    };
  }

  /**
   * Initialize the calendar, with logging, trimming, fallback, and clear errors.
   * @param {string} rawId  
   * @returns {Calendar}
   */
  _initCalendar(rawId) {
    const id = rawId ? rawId.trim() : '';
    console.log('Initializing calendar with ID:', id);

    if (id) {
      const cal = CalendarApp.getCalendarById(id);
      if (!cal) {
        throw new Error('Calendar not found for ID: ' + id);
      }
      return cal;
    }

    console.log('No CALENDAR_ID set; using default calendar');
    return CalendarApp.getDefaultCalendar();
  }

  /**
   * Efficient event search with caching
   */
  findEventByKey(eventKey, start, end) {
    const cacheKey = `${eventKey}_${start.getTime()}_${end.getTime()}`;
    if (this.eventCache.has(cacheKey)) {
      return this.eventCache.get(cacheKey);
    }

    const searchStart = new Date(start.getTime() - 48 * 60 * 60 * 1000);
    const searchEnd   = new Date(end.getTime()   + 48 * 60 * 60 * 1000);

    try {
      const events = this.calendar.getEvents(searchStart, searchEnd);
      const found = events.find(e => {
        const desc = e.getDescription() || '';
        return desc.includes(eventKey);
      });
      this.eventCache.set(cacheKey, found || null);
      return found;
    } catch (e) {
      this.errorHandler.recordError(e, `Finding event with key: ${eventKey}`);
      return null;
    }
  }

  /**
   * Queue a batch operation (create/update/delete)
   */
  queueOperation(op) {
    this.pendingOperations.push(op);
    if (this.pendingOperations.length >= this.config.BATCH_SIZE) {
      this.flushOperations();
    }
  }

  /**
   * Execute and clear pending operations
   */
  flushOperations() {
    if (this.config.DRY_RUN) {
      console.log(`[DRY RUN] Would execute ${this.pendingOperations.length} operations`);
      this.pendingOperations = [];
      return;
    }

    const ops = this.pendingOperations.splice(0);
    ops.forEach((op, i) => {
      try {
        op();
      } catch (err) {
        this.errorHandler.recordError(err, `Batch operation ${i+1}/${ops.length}`);
      }
    });
  }

  /**
   * Create or update an event
   */
  syncEvent({ key, title, start, end, description, color, isAllDay }) {
    try {
      const existing = this.findEventByKey(key, start, end);
      const fullDesc = `${key}\n${description}`;

      if (existing) {
        if (this.eventNeedsUpdate(existing, title, start, end, fullDesc, isAllDay)) {
          this.queueOperation(() => {
            existing.setTitle(title);
            if (!isAllDay) existing.setTime(start, end);
            existing.setColor(color);
            existing.setDescription(fullDesc);
            console.log(`Updated event: ${title}`);
            this.stats.updated++;
          });
        } else {
          this.stats.skipped++;
        }
      } else {
        this.queueOperation(() => {
          const newEvent = isAllDay
            ? this.calendar.createAllDayEvent(title, start, { description: fullDesc })
            : this.calendar.createEvent(title, start, end,   { description: fullDesc });
          newEvent.setColor(color);
          console.log(`Created event: ${title}`);
          this.stats.created++;
        });
      }
    } catch (e) {
      this.errorHandler.recordError(e, `Syncing event: ${title}`);
    }
  }

  eventNeedsUpdate(event, newTitle, newStart, newEnd, newDesc, isAllDay) {
    try {
      if (event.getTitle() !== newTitle || event.getDescription() !== newDesc) {
        return true;
      }
      if (isAllDay && event.isAllDayEvent()) {
        return event.getAllDayStartDate().toDateString() !== newStart.toDateString();
      }
      if (!isAllDay && !event.isAllDayEvent()) {
        return (
          event.getStartTime().getTime() !== newStart.getTime() ||
          event.getEndTime().getTime()   !== newEnd.getTime()
        );
      }
      return true;  // type mismatch
    } catch (e) {
      this.errorHandler.recordError(e, 'Checking if event needs update');
      return false;
    }
  }

  deleteOrphanedEvents(prefix, validIds, dateRange) {
    if (this.config.DRY_RUN) {
      console.log(`[DRY RUN] Would delete orphans with prefix: ${prefix}`);
      return;
    }
    try {
      const events = this.calendar.getEvents(dateRange.start, dateRange.end);
      const orphans = events.filter(ev => {
        const desc = ev.getDescription() || '';
        if (!desc.startsWith(prefix)) return false;
        const idInDesc = (desc.match(new RegExp(`^${prefix}(.*?)(?:\\n|$)`)) || [])[1];
        return !validIds.has(idInDesc);
      });
      orphans.forEach(ev => this.queueOperation(() => {
        console.log(`Deleting orphaned event: ${ev.getTitle()}`);
        ev.deleteEvent();
        this.stats.deleted++;
      }));
      if (orphans.length) {
        console.log(`Found ${orphans.length} orphaned events`);
      }
    } catch (e) {
      this.errorHandler.recordError(e, `Deleting orphaned events with prefix: ${prefix}`);
    }
  }

  getCalendar() {
    return this.calendar;
  }

  getStats() {
    return this.stats;
  }
}
