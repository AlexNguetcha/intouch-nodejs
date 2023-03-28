import { beforeEach, describe, expect, test } from '@jest/globals';
import { Intouch } from '../src';
require('dotenv').config()

var intouch: Intouch;

// Replace these additional infos with your own
const additionnalInfos = {
    recipientEmail: "nguetchaalex@gmail.com",
    recipientFirstName: "Alex",
    recipientLastName: "Nguetcha",
}

// Note: You need to add your Intouch credentials in a .env file
// like .example.env file in the root directory

describe('Intouch', () => {

    beforeEach(() => {
        intouch = Intouch.credentials({
            username: process.env.DIGEST_AUTH_USERNAME ?? '',
            password: process.env.DIGEST_AUTH_PASSWORD ?? '',
            loginAgent: process.env.LOGIN_AGENT ?? '',
            passwordAgent: process.env.PASSWORD_AGENT ?? '',
            intouchId: process.env.INTOUCH_ID ?? '',
        }).partnerId(process.env.PARTNER_ID ?? '')
            .phone(process.env.PHONE ?? '')
    })

    test('throw Unsupported operator error', () => {
        expect(() => {
            intouch.operator('unsupported operator');
        }).toThrow(/Unsupported operator/)
    })

    test('throw callback url error', async () => {
        await expect(intouch.amount(100).operator('ORANGE')
            .makeMerchantPayment(additionnalInfos))
            .rejects.toThrow(/valid callback url/)
    })

    test('throw valid amount error', async () => {
        await expect(intouch.callback("https:app.test")
            .operator('ORANGE')
            .makeMerchantPayment(additionnalInfos))
            .rejects.toThrow(/valid amount/)
    })

    test('get the balance', async () => {
        await expect(intouch.getBalance().then((res) => res.data))
            .resolves.toHaveProperty('amount')
    }, 1000 * 100)

    test('make merchant payment', async () => {
        let paymentAmount = 100 + Math.round(Math.random() * 500);
        await expect(intouch.callback("https://app.test").amount(paymentAmount)
            .operator('ORANGE')
            .makeMerchantPayment(additionnalInfos)
            .then((res) => res.json())
            .catch((err) => console.log(err)
            ))
            .resolves.toHaveProperty('numTransaction')
    }, 1000 * 100)


})