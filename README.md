# Intouch NodeJs API Wrapper

This is a TypeScript library for the Intouch API. It provides an easy-to-use interface for integrating with the Intouch API in your NodeJs projects.


## Intallation

To use this library, you will need to install the `@alexnguetcha/intouch` package from NPM.

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

// retrieve balance amount

balance.then((res)=>{
    // Response
    // {
    // "status": null,
    // "amount": 988750,
    // "errorCode": "200",
    // "errorMessage": "SUCCESSFUL"
    // }
    console.log(res.amount)
}).catch((err)=>{
    // Something went wrong !
    console.log(err)
})



```

## Make merchant payment 

```js
const additionnalInfos = {
    recipientEmail: "johndoe@gmail.com",
    recipientFirstName: "John",
    recipientLastName: "Doe",
}

const merchantPayment = await intouch.callback("https://app.test")
  .partnerId("YOUR_PARTNER_ID")
  .operator('ORANGE')
  .phone('695xxxx0x')
  .amount(500)
  .makeMerchantPayment(additionnalInfos);

// Response
// {
//    "idFromClient": "1679582194250",
//    "idFromGU": "1679582196117",
//    "amount": 1575.0,
//    "fees": 3.75,
//    "serviceCode": "CM_PAIEMENTMARCHAND_OM_TP",
//    "recipientNumber": "695xxxx0x",
//    "dateTime": 1679582196117,
//    "status": "INITIATED",
//    "numTransaction": "MP230323.1536.Bxxxxx",
//    "payment_url": null,
//    "codeMarchand": null,
//    "qrCode": null,
//    "validity": null,
//    "deepLink": null
// }

```

