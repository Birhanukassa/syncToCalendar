/**
 * Performance Monitor for tracking execution metrics
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.startTime = Date.now();
    }

    startOperation(name) {
        this.metrics[name] = {
            startTime: Date.now(),
            operations: 0,
            errors: 0,
        };
    }

    endOperation(name) {
        if (this.metrics[name]) {
            this.metrics[name].duration = Date.now() - this.metrics[name].startTime;
        }
    }

    incrementCounter(name) {
        if (this.metrics[name]) {
            this.metrics[name].operations++;
        }
    }

    incrementError(name) {
        if (this.metrics[name]) {
            this.metrics[name].errors++;
        }
    }

    getReport() {
        const totalDuration = Date.now() - this.startTime;
        const report = {
            totalDuration: totalDuration,
            totalDurationFormatted: this.formatDuration(totalDuration),
            operations: {},
        };

        Object.keys(this.metrics).forEach(key => {
            const metric = this.metrics[key];
            report.operations[key] = {
                duration: metric.duration || 0,
                durationFormatted: this.formatDuration(metric.duration || 0),
                operationsCount: metric.operations,
                errorsCount: metric.errors,
                successRate:
                    metric.operations > 0
                        ? (((metric.operations - metric.errors) / metric.operations) * 100).toFixed(
                              2
                          ) + '%'
                        : 'N/A',
            };
        });

        return report;
    }

    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        return `${(ms / 60000).toFixed(2)}m`;
    }

    logReport() {
        const report = this.getReport();
        console.log('Performance Report:');
        console.log('==================');
        console.log(`Total Duration: ${report.totalDurationFormatted}`);
        console.log('Operations:');

        Object.keys(report.operations).forEach(key => {
            const op = report.operations[key];
            console.log(`  ${key}:`);
            console.log(`    Duration: ${op.durationFormatted}`);
            console.log(`    Success Rate: ${op.successRate}`);
            console.log(`    Operations: ${op.operationsCount}`);
            console.log(`    Errors: ${op.errorsCount}`);
        });
    }
}
