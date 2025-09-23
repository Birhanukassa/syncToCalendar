/**
 * Improved Toggl Source
 */
class TogglSource {
    constructor(config, calendarManager, errorHandler, monitor) {
        this.globalConfig = config;
        this.config = config.TOGGL;
        this.calendarManager = calendarManager;
        this.errorHandler = errorHandler;
        this.monitor = monitor;
        this.alternateCalendars = new Map(); // Cache for alternate calendar managers

        if (this.config.API_TOKEN) {
            this.apiClient = new ApiClient(
                'https://api.track.toggl.com/api/v9',
                {
                    Authorization:
                        'Basic ' + Utilities.base64Encode(this.config.API_TOKEN + ':api_token'),
                },
                this.config.RATE_LIMIT_MS
            );
        }
    }

    sync() {
        if (!this.config.ENABLED || !this.apiClient) {
            console.log('Toggl sync disabled or not configured');
            return;
        }

        this.monitor.startOperation('toggl_sync');

        try {
            const entries = this.fetchEntries();
            if (!entries || entries.length === 0) {
                console.log('No Toggl entries found');
                this.monitor.endOperation('toggl_sync');
                return;
            }

            const projects = this.config.INCLUDE_PROJECT_IN_TITLE ? this.fetchProjects() : {};

            const filteredEntries = this.filterEntries(entries);
            const validIds = new Set(filteredEntries.map(e => e.id.toString()));

            console.log(`Processing ${filteredEntries.length} Toggl entries`);

            // Process entries
            filteredEntries.forEach(entry => {
                try {
                    this.processEntry(entry, projects);
                    this.monitor.incrementCounter('toggl_sync');
                } catch (e) {
                    this.errorHandler.recordError(e, `Processing Toggl entry ${entry.id}`);
                    this.monitor.incrementError('toggl_sync');
                }
            });

            // Clean up orphaned events
            const dateRange = this.getDateRange();
            this.calendarManager.deleteOrphanedEvents('toggl-id:', validIds, dateRange);

            // Flush any pending operations
            this.calendarManager.flushOperations();

            // Flush alternate calendars
            this.alternateCalendars.forEach(manager => {
                manager.flushOperations();
            });
        } catch (error) {
            this.errorHandler.recordError(error, 'Toggl sync');
        } finally {
            this.monitor.endOperation('toggl_sync');
        }
    }

    fetchEntries() {
        try {
            const dateRange = this.getDateRange();
            const endpoint = `/me/time_entries?start_date=${dateRange.start.toISOString()}&end_date=${dateRange.end.toISOString()}`;
            return this.apiClient.fetch(endpoint);
        } catch (e) {
            this.errorHandler.recordError(e, 'Fetching Toggl entries');
            return null;
        }
    }

    fetchProjects() {
        try {
            const projects = this.apiClient.fetch('/me/projects');
            const projectMap = {};
            projects.forEach(project => {
                projectMap[project.id] = project;
            });
            return projectMap;
        } catch (e) {
            this.errorHandler.recordError(e, 'Fetching Toggl projects');
            return {};
        }
    }

    filterEntries(entries) {
        if (!entries) return [];

        let filtered = entries;

        // Filter by tags if configured
        if (this.config.FILTER_BY_TAGS && this.config.FILTER_BY_TAGS.length > 0) {
            filtered = filtered.filter(
                entry =>
                    entry.tags && entry.tags.some(tag => this.config.FILTER_BY_TAGS.includes(tag))
            );
        }

        // Filter by minimum duration
        if (this.config.MIN_DURATION_MINUTES > 0) {
            filtered = filtered.filter(entry => {
                if (!entry.start || !entry.stop) return false;
                const duration = (new Date(entry.stop) - new Date(entry.start)) / 60000;
                return duration >= this.config.MIN_DURATION_MINUTES;
            });
        }

        return filtered;
    }

    processEntry(entry, projects) {
        // Skip running entries (no stop time)
        if (!entry.start || !entry.stop) {
            console.log(`Skipping running entry: ${entry.description || 'No description'}`);
            return;
        }

        const eventData = this.buildEventData(entry, projects);
        if (!eventData) {
            return;
        }

        const targetCalendar = this.determineTargetCalendar(entry, projects);

        // Use the appropriate calendar manager
        if (
            targetCalendar &&
            targetCalendar.getId() !== this.calendarManager.getCalendar().getId()
        ) {
            let altManager = this.alternateCalendars.get(targetCalendar.getId());
            if (!altManager) {
                altManager = new CalendarManager(
                    targetCalendar.getId(),
                    this.errorHandler,
                    this.globalConfig
                );
                this.alternateCalendars.set(targetCalendar.getId(), altManager);
            }
            altManager.syncEvent(eventData);
        } else {
            this.calendarManager.syncEvent(eventData);
        }
    }

    buildEventData(entry, projects) {
        try {
            const start = new Date(entry.start);
            const end = new Date(entry.stop);
            const description = entry.description || 'No description';
            const project = projects[entry.project_id];
            const projectName = project ? project.name : '';
            const tags = entry.tags && entry.tags.length > 0 ? entry.tags.join(', ') : '';

            let title = description;
            if (this.config.INCLUDE_PROJECT_IN_TITLE && projectName) {
                title = `[${projectName}] ${title}`;
            }
            if (this.config.INCLUDE_TAGS_IN_TITLE && tags) {
                title = `${title} (${tags})`;
            }

            let detailDescription = '';
            if (entry.project_id) detailDescription += `Project ID: ${entry.project_id}\n`;
            if (projectName) detailDescription += `Project Name: ${projectName}\n`;
            if (tags) detailDescription += `Tags: ${tags}\n`;
            if (this.config.INCLUDE_NOTES_IN_DESCRIPTION && description !== 'No description') {
                detailDescription += `Notes: ${description}\n`;
            }

            // Add duration
            const durationMs = end - start;
            const hours = Math.floor(durationMs / 3600000);
            const minutes = Math.floor((durationMs % 3600000) / 60000);
            detailDescription += `Duration: ${hours}h ${minutes}m\n`;

            return {
                key: `toggl-id:${entry.id}`,
                title: title,
                start: start,
                end: end,
                description: detailDescription,
                color: this.config.COLOR,
                isAllDay: false,
            };
        } catch (e) {
            this.errorHandler.recordError(e, `Building event data for Toggl entry ${entry.id}`);
            return null;
        }
    }

    determineTargetCalendar(entry, projects) {
        // Check tag mapping first (higher priority)
        if (entry.tags && this.config.TAG_CALENDAR_MAP) {
            for (const tag of entry.tags) {
                const calendarId = this.config.TAG_CALENDAR_MAP[tag];
                if (calendarId) {
                    try {
                        const calendar = CalendarApp.getCalendarById(calendarId);
                        if (calendar) return calendar;
                    } catch {
                        console.warn(`Could not access calendar ${calendarId} for tag ${tag}`);
                    }
                }
            }
        }

        // Check project mapping
        const project = projects[entry.project_id];
        if (project && this.config.PROJECT_CALENDAR_MAP) {
            const calendarId = this.config.PROJECT_CALENDAR_MAP[project.name];
            if (calendarId) {
                try {
                    const calendar = CalendarApp.getCalendarById(calendarId);
                    if (calendar) return calendar;
                } catch {
                    console.warn(
                        `Could not access calendar ${calendarId} for project ${project.name}`
                    );
                }
            }
        }

        return this.calendarManager.getCalendar();
    }

    getDateRange() {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - this.globalConfig.DAYS_TO_SYNC);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start: start, end: end };
    }
}
