import { ElementHandle, Page } from "puppeteer";
import { PompElement, PompElementCollection, PompElementConstructor, ExtraElementParams } from "./element.pomp";
import { PompTimeoutError, waitFor } from "./waitFor";

/** Page class to mimic a Page Object Modal.
 * Extend it with your base pages and use the selector methods to define the page's elements.
 */
export class PompPage {
  constructor(public page: Page) {}

  /** A single element xpath selector */
  $x<C extends PompElementConstructor<PompElement>>(
    /** The xpath selector */
    selector: string,
    /** A custom PompElement class */
    element: C = PompElement as any,
    /** Any additional arguments to be passed to your custom element */
    ...args: ExtraElementParams<typeof element>
  ): InstanceType<C> {
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
    return new element(this.page, locator, ...args) as any;
  }

  /** An element collection xpath selector */
  $$x<C extends PompElementConstructor<PompElement>>(
    /** The xpath selector */
    selector: string,
    /** A custom PompElement class */
    element: C = PompElement as any,
    /** Any additional arguments to be passed to your custom elements */
    ...args: ExtraElementParams<typeof element>
  ): PompElementCollection<C> {
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
    return new PompElementCollection(this.page, locator, element, ...args) as any;
  }

  /** A single element css selector */
  $<C extends PompElementConstructor<PompElement>>(
    /** The css selector */
    selector: string,
    /** A custom PompElement class */
    element: C = PompElement as any,
    /** Any additional arguments to be passed to your custom elements */
    ...args: ExtraElementParams<typeof element>
  ): InstanceType<C> {
    const locator = async (timeout?: number) => this.page.waitForSelector(selector, { timeout });
    return new element(this.page, locator, ...args) as any;
  }

  /** An element collection css selector */
  $$<C extends PompElementConstructor<PompElement>>(
    /** The css selector */
    selector: string,
    /** A custom PompElement class */
    element: C = PompElement as any,
    /** Any additional arguments to be passed to your custom elements */
    ...args: ExtraElementParams<typeof element>
  ): PompElementCollection<C> {
    const locator = async (timeout?: number) => {
      await this.page.waitForSelector(selector, { timeout }).catch(() => {});
      return await this.page.$$(selector);
    };
    return new PompElementCollection(this.page, locator, element, ...args) as any;
  }
}
