class RetryService {    
    public async withRetry<T>(numberOfRetry: number, callback: () => Promise<T>): Promise<T> {
        for (let i = 1; i <= numberOfRetry; i++) {
            try {
                return await callback();
            } catch (error) {
                await this.sleep(1000 * (i ** 2));
            }
        }
        throw new Error(`Retry failed ${numberOfRetry} times.`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export { RetryService };