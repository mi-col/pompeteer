import { ClickOptions, ElementHandle, Page } from "puppeteer";
import { PompTimeoutError, waitFor } from "./waitFor";

export type LocatorFunction = (
  timeout?: number
) => Promise<ElementHandle<Element>>;

export type CollectionLocatorFunction = (
  timeout?: number
) => Promise<ElementHandle<Element>[]>;

export type PompElementConstructor<T extends PompElement> = new (
  page: Page,
  locator: LocatorFunction
) => T;

/** A custom reusable element class with nesting capabilities.
 * Use as the building block of your POMs and to extend element interactions.
 */
export class PompElement {
  constructor(
    public page: Page,
    /** Function to locate and retrieve the wrapped element */
    public locator: LocatorFunction
  ) {}

  /** A utility method to check the existence of the element on the page, will not throw an error */
  async exists(timeout?: number) {
    try {
      return !!(await this.locator(timeout));
    } catch {
      return false;
    }
  }

  /** A shorthand for retrieving the element's text content */
  async text(timeout?: number) {
    return (
      await (
        await (await this.locator(timeout)).getProperty("textContent")
      ).jsonValue<string>()
    ).trim();
  }

  /** A shorthand for retrieving an attribute of the element */
  async getAttribute(name: string, timeout?: number) {
    return (await this.locator(timeout)).evaluate(
      (el, name: string) => el.getAttribute(name),
      [name]
    );
  }

  /** A shorthand for retrieving a map of the element's styles */
  async styles(timeout?: number) {
    return (await this.locator(timeout)).evaluate((e) => {
      const computedStyle = window.getComputedStyle(e);
      return [...(computedStyle as any as string[])].reduce(
        (elementStyles, property) => ({
          ...elementStyles,
          [property]: computedStyle.getPropertyValue(property),
        }),
        {}
      );
    });
  }

  /** A shorthand for retrieving the list of the element's classes */
  async classes(timeout?: number) {
    return (
      await (
        await (await this.locator(timeout)).getProperty("className")
      ).jsonValue<string>()
    ).split(" ");
  }

  /** A shorthand for fetching and clicking the element */
  async click(options?: ClickOptions & { timeout?: number }) {
    await (await this.locator(options.timeout)).click(options);
  }

  /** A shorthand for fetching and clicking the element via JS's click() function */
  async jsClick(timeout?: number) {
    await (
      await this.locator(timeout)
    ).evaluate((el) => (el as HTMLElement).click());
  }

  /** A single child element xpath selector.
   * To look through descendants the selector must begin with .//.
   * Be mindful of Puppeteer's xpath support.
   */
  $x<T extends PompElement = PompElement>(
    /** The xpath selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any
  ): T {
    const childLocator = async (timeout?: number) => {
      const child = await waitFor<ElementHandle<Element>>(
        this.page,
        async () => {
          const els = await (await this.locator()).$x(selector);
          return els?.[0];
        },
        timeout
      );
      if (!child) {
        throw new PompTimeoutError(this.page, selector, timeout);
      }
      return child;
    };
    return new element(this.page, childLocator);
  }

  /** A child element collection xpath selector.
   * To look through descendants the selector must begin with .//.
   * Be mindful of Puppeteer's xpath support.
   */
  $$x<T extends PompElement = PompElement>(
    /** The xpath selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any
  ): PompElementCollection<T> {
    const childLocator = async (timeout?: number) => {
      await waitFor<ElementHandle<Element>>(
        this.page,
        async () => {
          const children = await (await this.locator(timeout)).$x(selector);
          return children[0];
        },
        timeout
      );
      const children = (await this.locator(timeout)).$x(selector);
      if (!children) {
        throw new PompTimeoutError(this.page, selector, timeout);
      }
      return children;
    };
    return new PompElementCollection<T>(this.page, childLocator, element);
  }

  /** A single child element css selector. */
  $<T extends PompElement = PompElement>(
    /** The css selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any
  ): T {
    const childLocator = async (timeout?: number) =>
      (await this.locator(timeout)).waitForSelector(selector, {
        timeout,
      }) as Promise<ElementHandle<Element>>;
    return new element(this.page, childLocator);
  }

  /** A sub-element collection css selector. */
  $$<T extends PompElement = PompElement>(
    /** The css selector */
    selector: string,
    /** A custom PompElement class */
    element: PompElementConstructor<T> = PompElement as any
  ): PompElementCollection<T> {
    const childLocator = async (timeout?: number) => {
      await (await this.locator(timeout)).waitForSelector(selector, { timeout }).catch(() => {});
      return await (await this.locator(timeout)).$$(selector);
    };
    return new PompElementCollection<T>(this.page, childLocator, element);
  }
}

/** A collection of elements with some utility methods.
 * For situations when a page has a list of repeating components.
 */
export class PompElementCollection<T extends PompElement = PompElement> {
  /** Function to locate and retrieve all matching elements */
  locator: (timeout?: number) => Promise<T[]>;

  constructor(
    public page: Page,
    /** Function to locate and retrieve all matching element handlers */
    collectionLocator: CollectionLocatorFunction,
    /** Custom PompElement class of the underlying items */
    element: PompElementConstructor<T> = PompElement as any,
  ) {
    this.page = page;
    this.locator = async (timeout?: number) => {
      return (await collectionLocator(timeout)).map((el) => {
        const locator = () => Promise.resolve(el);
        return new element(this.page, locator);
      });
    };
  }

  /** Utility function to retrieve the first matching element from the collection */
  async find(predicate: (value: T) => Promise<boolean> | boolean): Promise<T | undefined> {
    for (const child of (await this.locator())) {
      const isMatch = await predicate(child);
      if (isMatch) {
        return child;
      }
    }
    return undefined;
  }

  /** Utility function to retrieve all matching elements from the collection */
  async filter(predicate: (value: T) => Promise<boolean>) {
    return (await Promise.all(
      (await this.locator()).map(async (child) => ({ child, isValid: await predicate(child) }))
    )).filter(({ isValid }) => isValid).map(({ child }) => child);
  }
}
