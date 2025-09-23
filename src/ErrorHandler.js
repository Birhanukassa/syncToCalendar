/**
 * Enhanced Error Handler with retry logic and notification
 */
class ErrorHandler {
    constructor(config) {
        this.config = config;
        this.errors = [];
    }

    executeWithRetry(fn, context, maxRetries) {
        maxRetries = maxRetries || this.config.MAX_RETRIES || 3;
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return fn.call(context);
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${i + 1} failed: ${error.toString()}`);
                if (i < maxRetries - 1) {
                    Utilities.sleep(this.config.RETRY_DELAY_MS * Math.pow(2, i)); // Exponential backoff
                }
            }
        }

        this.recordError(lastError);
        throw lastError;
    }

    recordError(error, context) {
        this.errors.push({
            timestamp: new Date(),
            message: error.toString(),
            stack: error.stack,
            context: context || 'Unknown',
        });

        // Log to Stackdriver
        console.error(`[ERROR] ${context || 'Unknown'}: ${error.toString()}`);
    }

    sendErrorNotification() {
        if (!this.config.NOTIFY_ON_ERROR || this.errors.length === 0) {
            return;
        }

        const subject = `Calendar Sync Script - ${this.errors.length} Error(s) Detected`;
        const body = this.generateErrorReport();

        try {
            MailApp.sendEmail(this.config.ERROR_EMAIL, subject, body);
            console.log(`Error notification sent to ${this.config.ERROR_EMAIL}`);
        } catch (e) {
            console.error('Failed to send error notification:', e);
        }
    }

    generateErrorReport() {
        const report = [
            'Calendar Sync Error Report',
            '='.repeat(50),
            `Date: ${new Date().toLocaleString()}`,
            `Total Errors: ${this.errors.length}`,
            '',
            'Error Details:',
            '-'.repeat(50),
        ];

        this.errors.forEach((error, index) => {
            report.push(
                `\nError ${index + 1}:`,
                `Time: ${error.timestamp.toISOString()}`,
                `Context: ${error.context}`,
                `Message: ${error.message}`,
                `Stack: ${error.stack || 'No stack trace available'}`,
                '-'.repeat(30)
            );
        });

        return report.join('\n');
    }

    hasErrors() {
        return this.errors.length > 0;
    }
}
