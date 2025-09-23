/**
 * Enhanced API Client with rate limiting and caching
 */
class ApiClient {
    constructor(baseUrl, headers, rateLimitMs) {
        this.baseUrl = baseUrl;
        this.headers = headers;
        this.rateLimitMs = rateLimitMs || 100;
        this.lastRequestTime = 0;
        this.cache = CacheService.getUserCache();
        this.requestCount = 0;
    }

    fetch(endpoint, options) {
        options = options || {};

        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitMs) {
            Utilities.sleep(this.rateLimitMs - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();

        // Generate cache key
        const cacheKey = Utilities.computeDigest(
            Utilities.DigestAlgorithm.MD5,
            `${endpoint}_${JSON.stringify(options)}`
        )
            .map(byte => (byte & 0xff).toString(16).padStart(2, '0'))
            .join('');

        // Check cache
        try {
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
                console.log(`Cache hit for: ${endpoint}`);
                return JSON.parse(cachedData);
            }
        } catch {
            // Cache miss or error, continue with fetch
        }

        // Make request
        const url = `${this.baseUrl}${endpoint}`;
        const fetchOptions = {
            method: options.method || 'GET',
            headers: { ...this.headers, ...(options.headers || {}) },
            muteHttpExceptions: true,
        };

        if (options.payload) {
            fetchOptions.payload = options.payload;
            fetchOptions.contentType = options.contentType || 'application/json';
        }

        this.requestCount++;
        console.log(`API Request #${this.requestCount}: ${url}`);

        const response = UrlFetchApp.fetch(url, fetchOptions);
        const responseCode = response.getResponseCode();

        if (responseCode >= 400) {
            const errorMsg = `API Error (${responseCode}): ${response.getContentText()}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const data = JSON.parse(response.getContentText());

        // Cache successful responses for 5 minutes
        try {
            this.cache.put(cacheKey, JSON.stringify(data), 300);
        } catch (e) {
            // Cache write failed, continue without caching
            console.warn('Cache write failed:', e.toString());
        }

        return data;
    }
}
