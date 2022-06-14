import { ElementHandle, Page } from "puppeteer";
import { PompElement, PompElementCollection, PompElementConstructor } from "./element.pomp";
import { PompTimeoutError, waitFor } from "./waitFor";

/** Page class to mimic a Page Object Modal.
 * Extend it with your base pages and use the selector methods to define the page's elements.
 */
export class PompPage {
  constructor(public page: Page) {}

  /** A single element xpath selector */
  $x<T extends PompElement = PompElement>(
    /** The xpath selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any,
  ): T {
    const locator = async (timeout?: number) => {
      const child = await waitFor<ElementHandle<Element>>(
        this.page,
        async () => {
          const els = await this.page.$x(selector);
          return els[0];
        },
        timeout
      );
      if (!child) {
        throw new PompTimeoutError(this.page, selector, timeout);
      }
      return child;
    };
    return new element(this.page, locator);
  }

  /** An element collection xpath selector */
  $$x<T extends PompElement = PompElement>(
    /** The xpath selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any,
  ): PompElementCollection<T> {
    const locator = async (timeout?: number) => {
      await waitFor<ElementHandle<Element>>(
        this.page,
        async () => {
          const els = await this.page.$x(selector);
          return els[0];
        },
        timeout
      );
      const child = this.page.$x(selector);
      if (!child) {
        throw new PompTimeoutError(this.page, selector, timeout);
      }
      return child;
    };
    return new PompElementCollection<T>(this.page, locator, element);
  }

  /** A single element css selector */
  $<T extends PompElement = PompElement>(
    /** The css selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any,
  ): T {
    const locator = async (timeout?: number) => this.page.waitForSelector(selector, { timeout });
    return new element(this.page, locator);
  }

  /** An element collection css selector */
  $$<T extends PompElement = PompElement>(
    /** The css selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any,
  ): PompElementCollection<T> {
    const locator = async (timeout?: number) => {
      await this.page.waitForSelector(selector, { timeout }).catch(() => {});
      return await this.page.$$(selector);
    };
    return new PompElementCollection<T>(this.page, locator, element);
  }
}
