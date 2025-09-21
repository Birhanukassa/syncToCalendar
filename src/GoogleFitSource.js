 /**
  * Google Fit Source Implementation
  */
 class GoogleFitSource {
     constructor(config, calendarManager, errorHandler, monitor) {
         this.globalConfig = config;
         this.config = config.GOOGLE_FIT;
         this.calendarManager = calendarManager;
         this.errorHandler = errorHandler;
         this.monitor = monitor;
         this.fitService = null;
 
         try {
             this.fitService = this.getGoogleFitService();
         } catch (e) {
             console.warn('Google Fit service not configured:', e.toString());
         }
     }
 
     sync() {
         if (!this.config.ENABLED || !this.fitService || !this.fitService.hasAccess()) {
             console.log('Google Fit sync disabled or not authorized');
             return;
         }
 
         this.monitor.startOperation('google_fit_sync');
 
         try {
             const dateRange = this.getDateRange();
 
             if (this.config.SYNC_STEPS.ENABLED) {
                 this.syncSteps(dateRange);
             }
             if (this.config.SYNC_SLEEP.ENABLED) {
                 this.syncSleep(dateRange);
             }
             if (this.config.SYNC_WORKOUTS.ENABLED) {
                 this.syncWorkouts(dateRange);
             }
 
             // Flush pending operations
             this.calendarManager.flushOperations();
 
         } catch (error) {
             this.errorHandler.recordError(error, 'Google Fit sync');
         } finally {
             this.monitor.endOperation('google_fit_sync');
         }
     }
 
     getGoogleFitService() {
         const scriptProperties = PropertiesService.getScriptProperties();
         const clientId = scriptProperties.getProperty('GOOGLE_FIT_CLIENT_ID');
         const clientSecret = scriptProperties.getProperty('GOOGLE_FIT_CLIENT_SECRET');
 
         if (!clientId || !clientSecret) {
             console.warn('Google Fit OAuth credentials not configured');
             return null;
         }
 
         // Note: This requires the OAuth2 library to be added to the project
         return OAuth2.createService('googleFit')
             .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
             .setTokenUrl('https://oauth2.googleapis.com/token')
             .setClientId(clientId)
             .setClientSecret(clientSecret)
             .setCallbackFunction('authCallback')
             .setPropertyStore(PropertiesService.getUserProperties())
             .setScope([
                 'https://www.googleapis.com/auth/fitness.activity.read',
                 'https://www.googleapis.com/auth/fitness.sleep.read',
                 'https://www.googleapis.com/auth/fitness.body.read',
                 'https://www.googleapis.com/auth/fitness.heart_rate.read'
             ])
             .setParam('access_type', 'offline')
             .setParam('prompt', 'consent');
     }
 
     syncSteps(dateRange) {
         try {
             const stepsData = this.fetchStepsData(dateRange);
             if (!stepsData || !stepsData.bucket) {
                 console.log('No steps data available');
                 return;
             }
 
             const currentStepIds = new Set();
             const stepEventKeyPrefix = 'google-fit-steps:';
 
             stepsData.bucket.forEach(dayBucket => {
                 const bucketStartTime = new Date(parseInt(dayBucket.startTimeMillis));
                 const bucketEndTime = new Date(parseInt(dayBucket.endTimeMillis));
 
                 let stepsForDay = 0;
                 dayBucket.dataset.forEach(d => {
                     d.point.forEach(p => {
                         p.value.forEach(v => {
                             if (v.intVal !== undefined) {
                                 stepsForDay += v.intVal;
                             }
                         });
                     });
                 });
 
                 if (stepsForDay >= this.config.SYNC_STEPS.MIN_STEPS_TO_SYNC) {
                     const eventDateString = bucketStartTime.toISOString().split('T')[0];
                     const eventData = {
                         key: `${stepEventKeyPrefix}${eventDateString}`,
                         title: `🚶 ${stepsForDay.toLocaleString()} Steps`,
                         start: bucketStartTime,
                         end: bucketEndTime,
                         description: `Steps: ${stepsForDay.toLocaleString()}\nDate: ${bucketStartTime.toLocaleDateString()}`,
                         color: this.config.SYNC_STEPS.COLOR,
                         isAllDay: true
                     };
 
                     this.calendarManager.syncEvent(eventData);
                     currentStepIds.add(eventDateString);
                     this.monitor.incrementCounter('google_fit_sync');
                 }
             });
 
             this.calendarManager.deleteOrphanedEvents(stepEventKeyPrefix, currentStepIds, dateRange);
         } catch (e) {
             this.errorHandler.recordError(e, 'Syncing Google Fit steps');
             this.monitor.incrementError('google_fit_sync');
         }
     }
 
     syncSleep(dateRange) {
         try {
             const sleepData = this.fetchSleepData(dateRange);
             if (!sleepData || !sleepData.session) {
                 console.log('No sleep data available');
                 return;
             }
 
             const currentSleepIds = new Set();
             const sleepEventKeyPrefix = 'google-fit-sleep:';
 
             sleepData.session.forEach(session => {
                 if (session.activityType !== 72) return; // 72 is sleep activity
 
                 const start = new Date(parseInt(session.startTimeMillis));
                 const end = new Date(parseInt(session.endTimeMillis));
                 const durationMs = end - start;
                 const hours = Math.floor(durationMs / 3600000);
                 const minutes = Math.floor((durationMs % 3600000) / 60000);
 
                 // Skip short sleep sessions
                 // Use a configurable minimum duration, defaulting to 1 hour if not set
                 if (durationMs < (this.config.SYNC_SLEEP.MIN_DURATION_HOURS || 1) * 3600000) {
                     return;
                 }
 
                 const eventData = {
                     key: `${sleepEventKeyPrefix}${session.id}`,
                     title: `😴 Sleep: ${hours}h ${minutes}m`,
                     start: start,
                     end: end,
                     description: `Duration: ${hours}h ${minutes}m\nQuality: ${session.name || 'Unknown'}\nSession ID: ${session.id}`,
                     color: this.config.SYNC_SLEEP.COLOR,
                     isAllDay: false
                 };
 
                 this.calendarManager.syncEvent(eventData);
                 currentSleepIds.add(session.id.toString());
                 this.monitor.incrementCounter('google_fit_sync');
             });
 
             this.calendarManager.deleteOrphanedEvents(sleepEventKeyPrefix, currentSleepIds, dateRange);
         } catch (e) {
             this.errorHandler.recordError(e, 'Syncing Google Fit sleep');
             this.monitor.incrementError('google_fit_sync');
         }
     }
 
     syncWorkouts(dateRange) {
         try {
             const workoutData = this.fetchWorkoutsData(dateRange);
             if (!workoutData || !workoutData.session) {
                 console.log('No workout data available');
                 return;
             }
 
             const currentWorkoutIds = new Set();
             const workoutEventKeyPrefix = 'google-fit-workout:';
 
             workoutData.session.forEach(session => {
                 if (session.activityType === 72) return; // Skip sleep
 
                 const start = new Date(parseInt(session.startTimeMillis));
                 const end = new Date(parseInt(session.endTimeMillis));
                 const durationMs = end - start;
                 const minutes = Math.floor(durationMs / 60000);
 
                 // Skip short workouts
                 if (minutes < (this.config.SYNC_WORKOUTS.MIN_DURATION_MINUTES || 0)) {
                     return;
                 }
 
                 const hours = Math.floor(minutes / 60);
                 const remainingMinutes = minutes % 60;
                 const durationStr = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
 
                 const eventData = {
                     key: `${workoutEventKeyPrefix}${session.id}`,
                     title: `🏋️ ${session.name || 'Workout'}: ${durationStr}`,
                     start: start,
                     end: end,
                     description: `Activity: ${session.name || 'Unknown'}\nDuration: ${durationStr}\nSession ID: ${session.id}`,
                     color: this.config.SYNC_WORKOUTS.COLOR,
                     isAllDay: false
                 };
 
                 this.calendarManager.syncEvent(eventData);
                 currentWorkoutIds.add(session.id.toString());
                 this.monitor.incrementCounter('google_fit_sync');
             });
 
             this.calendarManager.deleteOrphanedEvents(workoutEventKeyPrefix, currentWorkoutIds, dateRange);
         } catch (e) {
             this.errorHandler.recordError(e, 'Syncing Google Fit workouts');
             this.monitor.incrementError('google_fit_sync');
         }
     }
 
     fetchStepsData(dateRange) {
         const requestBody = {
             aggregateBy: [{
                 dataTypeName: "com.google.step_count.delta",
                 dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
             }],
             bucketByTime: { durationMillis: 86400000 }, // 1 day
             startTimeMillis: dateRange.start.getTime(),
             endTimeMillis: dateRange.end.getTime()
         };
 
         const options = {
             method: 'post',
             contentType: 'application/json',
             headers: { 'Authorization': 'Bearer ' + this.fitService.getAccessToken() },
             payload: JSON.stringify(requestBody),
             muteHttpExceptions: true
         };
 
         const response = UrlFetchApp.fetch(
             'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
             options
         );
 
         if (response.getResponseCode() >= 400) {
             throw new Error(`Google Fit API error: ${response.getContentText()}`);
         }
 
         return JSON.parse(response.getContentText());
     }
 
     fetchSleepData(dateRange) {
         const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?` +
             `startTime=${dateRange.start.toISOString()}&` +
             `endTime=${dateRange.end.toISOString()}&` +
             `activityType=72`;
 
         const options = {
             method: 'get',
             headers: { 'Authorization': 'Bearer ' + this.fitService.getAccessToken() },
             muteHttpExceptions: true
         };
 
         const response = UrlFetchApp.fetch(url, options);
 
         if (response.getResponseCode() >= 400) {
             throw new Error(`Google Fit API error: ${response.getContentText()}`);
         }
 
         return JSON.parse(response.getContentText());
     }
 
     fetchWorkoutsData(dateRange) {
         const url = `https://www.googleapis.com/fitness/v1/users/me/sessions?` +
             `startTime=${dateRange.start.toISOString()}&` +
             `endTime=${dateRange.end.toISOString()}`;
 
         const options = {
             method: 'get',
             headers: { 'Authorization': 'Bearer ' + this.fitService.getAccessToken() },
             muteHttpExceptions: true
         };
 
         const response = UrlFetchApp.fetch(url, options);
 
         if (response.getResponseCode() >= 400) {
             throw new Error(`Google Fit API error: ${response.getContentText()}`);
         }
 
         return JSON.parse(response.getContentText());
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