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
        }).partnerId(process.env.INTOUCH_ID ?? '')
            .phone(process.env.PHONE ?? '')
    })

    test('throw Unsupported operator error', () => {
        expect(() => {
            intouch.operator('unsupported operator');
        }).toThrow(/Unsupported operator/)
    })

    test('throw callback url error', async () => {
        const balance = await intouch.getBalance();
        expect(balance).toThrow(/valid callback/)
    })

    
    test('throw valid amount error', async () => {
        const output = await intouch.callback("https://app.test").operator('ORANGE').makeMerchantPayment(additionnalInfos).then((res) => {
            // console.log(res);
        })
        expect(output).toThrow(/valid amount/)
    })

    test('get the balance', () => {
        intouch.callback("https://app.test").getBalance().then((res) => {
            // console.log(res);
        })
    })

    test('make merchant payment', () => {

        intouch.callback("https://app.test").amount(100).operator('ORANGE').makeMerchantPayment(additionnalInfos).then((res) => {
            // console.log(res);
        })
    })


})