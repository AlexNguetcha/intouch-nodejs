# Intouch NodeJs API Wrapper

This is a TypeScript library for the Intouch API. It provides an easy-to-use interface for integrating with the Intouch API in your NodeJs projects.


## Intallation

To use this library, you will need to install the axios package from NPM.

```bash
npm install axios
```

Then, you can install this library:

```bash
npm install @alexnguetcha/intouch
```

# Usage

To use this library, first import it and create an instance with your Intouch credentials:

```js
import { Intouch } from "alexnguetcha/intouch";

const intouch = Intouch.credentials({
  username: "YOUR_USERNAME",
  password: "YOUR_PASSWORD",
  loginAgent: "YOUR_LOGIN_AGENT",
  passwordAgent: "YOUR_PASSWORD_AGENT",
  intouchId: "YOUR_INTOUCH_ID",
});

```

## Checking your balance

```js
const balance = await intouch
  .operator(Intouch.SUPPORTED_OPERATORS[0])
  .partnerId("YOUR_PARTNER_ID")
  .getBalance();

```

## Checking your balance

```js
const balance = await intouch
  .operator(Intouch.SUPPORTED_OPERATORS[0])
  .partnerId("YOUR_PARTNER_ID")
  .getBalance();

```

