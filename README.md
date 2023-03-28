# Intouch NodeJs API Wrapper

This is a TypeScript library for the Intouch API. It provides an easy-to-use interface for integrating with the Intouch API in your NodeJs projects.


## Intallation

To use this library, you will need to install the `intouch-api-wrapper` package from NPM.

```bash
npm i intouch-api-wrapper
```

# Usage

To use this library, first import it and create an instance with your Intouch credentials:

```js
require('dotenv').config()
const intouch = require('intouch-api-wrapper')

const intouchPayment = intouch.Intouch.credentials({
    username: process.env.DIGEST_AUTH_USE
    password: process.env.DIGEST_AUTH_PASSWORD ?? '',
    loginAgent: process.env.LOGIN_AGENT ?? '',
    passwordAgent: process.env.PASSWORD_AGENT ?? '',
    intouchId: process.env.INTOUCH_ID ?? '',
})

```

## Checking your balance

```js
const balance = await intouchPayment
  .operator(Intouch.SUPPORTED_OPERATORS[0])
  .partnerId(process.env.PARTNER_ID ?? '')
  .getBalance();

// retrieve balance amount

balance.then((res)=>{
    console.log(res.amount)
    // Response
    // {
    // "status": null,
    // "amount": 988750,
    // "errorCode": "200",
    // "errorMessage": "SUCCESSFUL"
    // }
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

const merchantPayment = await intouchPayment.callback("https://app.test")
  .partnerId("YOUR_PARTNER_ID")
  .operator('ORANGE')
  .phone('695xxxx0x')
  .amount(500)
  .makeMerchantPayment(additionnalInfos);
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.log(err))

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

