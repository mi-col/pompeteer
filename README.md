# Pompeteer

Pompeteer is a library for creating simple and (most importantly) nestable POMs in Puppeteer.

## Why?

At the moment of it's conception any attempt to find a guideline or tool for writing POMs in Puppeteer only resulted in simplistic solutions, such as storing selectors in the fields of an object and calling it a POM.
This approach is lacking in both utility and functionality, since it does not allow us to create reusable elements with extended functionality and nesting them within each-other.

## Installation

```bash
npm install pompeteer
```

## Usage

Extend the `PompPage` and `PompElement` classes to define the layout of your application.

```javascript
import { PompElement, PompPage } from "pompeteer";

export class MainPage extends PompPage {
  async open(url = "http://localhost:3000") {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    return this;
  }
  users = this.$$(".user", UserBox);
}

export class UserBox extends PompElement {
  name = this.$x(".name");
  job = this.$x(".job");
  email = this.$x(".email");
  age = this.$x(".age");

  getUser = async (): Promise<User> => {
    const name = await this.name.text;
    const job = await this.job.text;
    const email = await this.email.text;
    const age = +(await this.age.text);
    return {
      firstName,
      lastName,
      job,
      email,
      age,
    };
  };
}
```

```javascript
const main = await new MainPage(page).open();
const userData = await (await main.users.locator())[0].getUser();
```

You can also specify sub-elements within elements the same way you can within pages in order to easily create a nested structure of any complexity. As well as create elements with additional arguments.

```javascript
export class CustomElement extends PompElement {
  constructor(
    page: Page,
    locator: LocatorFunction,
    private color: string,
    private value: number,
  ) {
    super(page, locator);
  }
}

export class CustomPage extends PompPage {
  element = this.$$("#element", CustomElement, 'red', 45);
}
```

## License

[ISC](https://choosealicense.com/licenses/isc/)
