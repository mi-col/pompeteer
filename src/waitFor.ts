import { Page } from "puppeteer";

/** A utility to wait for a function to return a truthy value within a certain timeout */
export const waitFor = <T>(
  /** Page object, used to extract the timeout from puppeteers settings. */
  page: Page,
  /** Function that returns a truthy value or a promise of such */
  predicate: () => T | Promise<any>,
  /** Timeout in milliseconds before resolving with null, will attempt to extract puppeteer's timeout if not provided
   * @default 10000
   */
  timeout?: number,
  /** Time in milliseconds between function attempts
   * @default 500
   */
  interval = 500
): Promise<T | null> => {
  timeout = timeout || (page as any)._timeoutSettings.timeout() || 10000;
  return new Promise<T | null>((resolve) => {
    let trier: any;
    let quitter: any;
    const success = async () => {
      const result = await predicate();
      if (result) {
        clearInterval(trier);
        clearTimeout(quitter);
        resolve(result);
      }
    };
    trier = setInterval(success, interval);
    quitter = setTimeout(() => {
      clearInterval(trier);
      resolve(null);
    }, timeout);
  });
};

/** Custom error mimicking puppeteer's TimeoutError for an element not being found */
export class PompTimeoutError extends Error {
  constructor(
    /** Page object, used to extract the timeout from puppeteers settings. */
    page: Page,
    /** Selector of the element that wasn't found */
    selector: string,
    /** Timeout in milliseconds during which the element wasn't found, will attempt to extract puppeteer's timeout with a fallback of 10000 */
    timeout?: number
  ) {
    timeout = timeout || (page as any)?._timeoutSettings?.timeout?.() || 10000;
    super(
      `waiting for selector "${selector}" failed: timeout ${timeout}ms exceeded`
    );
  }
}
