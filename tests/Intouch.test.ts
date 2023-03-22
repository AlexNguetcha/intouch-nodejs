import { beforeEach, describe, expect, test } from '@jest/globals';
import Intouch from '../src';
require('dotenv').config()

var intouch: Intouch;
const additionnalInfos = {
    recipientEmail: "nguetchaalex@gmail.com",
    recipientFirstName: "Alex",
    recipientLastName: "Nguetcha",
}

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

    // test('throw Unsupported operator error', () => {
    //     expect(() => {
    //         intouch.operator('unsupported operator');
    //     }).toThrow(/Unsupported operator/)
    // })

    // test('throw callback url error', async () => {
    //     await expect(intouch.amount(100).operator('ORANGE')
    //         .makeMerchantPayment(additionnalInfos))
    //         .rejects.toThrow(/valid callback url/)
    // })

    // test('throw valid amount error', async () => {
    //     await expect(intouch.callback("https://app.test")
    //         .operator('ORANGE')
    //         .makeMerchantPayment(additionnalInfos))
    //         .rejects.toThrow(/valid amount/)
    // })

    // test('get the balance', async () => {
    //     await expect(intouch.getBalance().then((res) => res.data))
    //         .resolves.toHaveProperty('amount')
    // }, 1000 * 100)

    test('make merchant payment', async () => {
        await expect(intouch.callback("https://app.test").amount(100)
            .operator('ORANGE')
            .makeMerchantPayment(additionnalInfos)
            .then((res) => res.data).catch((err) => console.log(err)
            ))
            .resolves.toHaveProperty('gu_transaction_id')
    }, 1000 * 100)


})