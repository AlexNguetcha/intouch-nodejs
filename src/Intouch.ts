import axios, { AxiosInstance } from "axios";
import { createHash, randomBytes } from "crypto";
import md5 from 'crypto-js/md5';
import DigestClient from 'digest-fetch'

interface IntouchOptions {
    username: string;
    password: string;
    loginAgent: string;
    passwordAgent: string;
    intouchId: string;

}

interface AdditionnalPaymentInfos {
    recipientEmail: string,
    recipientFirstName: string,
    recipientLastName: string,
}

/**
 * @author Alex Nguetcha <nguetchaalex@gmail.com>
 */
class Intouch {
    static SUPPORTED_OPERATORS = ['ORANGE', 'MTN'];

    static GUTOUCH_API_GETBALANCE = "https://api.gutouch.com/v1/[INTOUCH_ID]/get_balance";
    static GUTOUCH_API_URL = "https://api.gutouch.com/dist/api/touchpayapi/v1/[INTOUCH_ID]/transaction?loginAgent=[LOGIN_AGENT]&passwordAgent=[PASSWORD_AGENT]";
    static GUTOUCH_API_CASHIN_URL = "https://api.gutouch.com/v1/[INTOUCH_ID]/cashin";

    /**
     * Intouch Cameroon Service Code for merchant payment transaction
     */
    static OM_MERCHANT_PAYMENT = "CM_PAIEMENTMARCHAND_OM_TP";
    static MOMO_MERCHANT_PAYMENT = "CASHINMTNCM2_DYNATECH";

    /**
     * Intouch Cameroon Service Code for cash-in transaction
     */
    static OM_CASH_IN = "CASHINOMCMB2BDIST";
    static MOMO_CASH_IN = "CASHINMTNCM2_DYNATECH";

    /**
     * Intouch Cameroon Service Code for cash-out transaction
     */
    static OM_CASH_OUT = "CASHOUTOMCMB2BDIST";
    static MOMO_CASH_OUT = "CASHOUTMTNCM2_DYNATECH";

    private username: string;
    private password: string;
    private loginAgent: string;
    private passwordAgent: string;
    private intouchId: string;

    private _callback!: string;
    private _endpoint!: string;
    private _serviceCode!: string;
    private _amount!: number;
    private _phone!: string;
    private _partnerId!: string;
    private _operator!: string;


    private constructor(options: IntouchOptions) {
        this.username = options.username;
        this.password = options.password;
        this.loginAgent = options.loginAgent;
        this.passwordAgent = options.passwordAgent;
        this.intouchId = options.intouchId;
    }

    static credentials(options: IntouchOptions) {
        return new Intouch(options)
    }

    private replaceUrlAgentCredentials(url: string): string {
        url = url.replace("[LOGIN_AGENT]", this.loginAgent);
        url = url.replace("[PASSWORD_AGENT]", this.passwordAgent);
        url = url.replace("[INTOUCH_ID]", this.intouchId);
        return url;
    }

    endpoint(endpoint: string): Intouch {
        this._endpoint = endpoint;
        return this;
    }

    serviceCode(serviceCode: string): Intouch {
        this._serviceCode = serviceCode;
        return this;
    }

    amount(amount: number): Intouch {
        this._amount = amount;
        return this;
    }

    phone(phone: string): Intouch {
        this._phone = phone;
        return this;
    }

    callback(url: string): Intouch {
        this._callback = url;
        return this;
    }

    partnerId(partnerId: string): Intouch {
        this._partnerId = partnerId;
        return this;
    }

    operator(operator: string): Intouch {
        operator = operator.toUpperCase() ?? "";
        if (!Intouch.SUPPORTED_OPERATORS.includes(operator)) {
            throw new Error(
                `Unsupported operator: ${operator}, supported operators are ${Intouch.SUPPORTED_OPERATORS.join(
                    ","
                )}`
            );
        }
        this._operator = operator;
        return this;
    }

    private isValidPhoneNumber(phoneNumber: string): boolean {
        return /^6\d{8}$/.test(phoneNumber);
    }

    private isValidUrl(url: string): boolean {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url);
    }

    private checkMinimumRequirements(operationType: string): void {
        if (['merchant', 'cashin', 'cashout'].includes(operationType)) {
            if (isNaN(this._amount)) {
                throw new Error('You must provide a valid amount for the transaction.');
            } else if (this._amount < 100) {
                throw new Error('Transaction amount must be greater than 100 XAF');
            }
        }

        if (this.partnerId === null && ['cashin', 'balance'].includes(operationType)) {
            throw new Error('You must provide a valid Intouch partner id.');
        }

        if (!this.isValidPhoneNumber(this._phone) && ['merchant', 'cashin', 'cashout', 'balance'].includes(operationType)) {
            throw new Error('You must provide a valid phone number 6abcdefgh.');
        }

        if (!this.isValidUrl(this._callback) && ['merchant', 'cashin', 'cashout'].includes(operationType)) {
            throw new Error('You must provide a valid callback url.');
        }
    }

    private setTheRightServiceCodeAndEndpoint(forOperation: 'merchant' | 'cashin' | 'cashout' | 'balance'): void {
        // check the operator
        if (forOperation !== 'balance' && !Intouch.SUPPORTED_OPERATORS.includes(this._operator)) {
            throw new Error(`You must provide an operator for ${forOperation} payment.`);
        }

        // set the right service code
        switch (forOperation) {
            case 'merchant':
                if (this._operator === Intouch.SUPPORTED_OPERATORS[0]) {
                    // ORANGE
                    this.serviceCode(Intouch.OM_MERCHANT_PAYMENT);
                } else if (this._operator === Intouch.SUPPORTED_OPERATORS[1]) {
                    // MTN
                    this.serviceCode(Intouch.MOMO_MERCHANT_PAYMENT);
                }
                this.endpoint(this.replaceUrlAgentCredentials(Intouch.GUTOUCH_API_URL));
                break;
            case 'cashin':
                if (this._operator === Intouch.SUPPORTED_OPERATORS[0]) {
                    // ORANGE
                    this.serviceCode(Intouch.OM_CASH_IN);
                } else if (this._operator === Intouch.SUPPORTED_OPERATORS[1]) {
                    // MTN
                    this.serviceCode(Intouch.MOMO_CASH_IN);
                }
                this.endpoint(this.replaceUrlAgentCredentials(Intouch.GUTOUCH_API_CASHIN_URL));
                break;
            case 'balance':
                this.endpoint(this.replaceUrlAgentCredentials(Intouch.GUTOUCH_API_GETBALANCE));
                break;
            default:
                // Do nothing
                break;
        }
    }

    /**
     * Make a merchant payment to the Intouch account
     * 
     * @param additionnalInfos 
     * @param idFromClient 
     * @returns 
     */
    async makeMerchantPayment(additionnalInfos: AdditionnalPaymentInfos, idFromClient: string | null = null) {

        this.checkMinimumRequirements('merchant')
        this.setTheRightServiceCodeAndEndpoint("merchant")

        const payload = {
            'idFromClient': idFromClient ?? Date.now(),
            'amount': Number(this._amount),
            'callback': this._callback,
            'recipientNumber': Number(this._phone),
            'serviceCode': this._serviceCode,
            'additionnalInfos': additionnalInfos
        };

        const client = new DigestClient(this.username, this.password)

        return await client.fetch(this._endpoint, {
            method: 'PUT', body: JSON.stringify(payload), headers: {
                "Content-Type": "application/json",
                "Content-Length": JSON.stringify(payload).length,
            },
        })
    }


    /**
     * Send money from Intouch account
     * 
     * @param partnerTransactionId 
     * @returns 
     */
    async makeCashin(partnerTransactionId: string | null = null) {

        this.checkMinimumRequirements('cashin')
        this.setTheRightServiceCodeAndEndpoint("cashin")

        const payload = {
            'service_id': this._serviceCode,
            'recipient_phone_number': this._phone,
            'amount': this._amount,
            "partner_id": this._partnerId,
            "partner_transaction_id": partnerTransactionId ?? randomBytes(12).toString(),
            "login_api": this.loginAgent,
            "password_api": this.passwordAgent,
            'call_back_url': this._callback,
        };

        const auth = {
            username: this.username,
            password: this.password
        }

        return await axios.post(this._endpoint, payload, { auth })
    }

    /**
     * Get the intouch account current balance
     * 
     * @returns 
     */
    async getBalance() {

        this.checkMinimumRequirements('balance')
        this.setTheRightServiceCodeAndEndpoint('balance')

        const payload = {
            "partner_id": this._partnerId,
            "login_api": this.loginAgent,
            "password_api": this.passwordAgent,
        };

        const auth = {
            username: this.username,
            password: this.password
        }

        return await axios.post(this._endpoint, payload, { auth })
    }

    async axiosRequest(username: string, password: string, url: string, data: object) {
        try {
            const response1 = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Digest username="' + username + '"'
                },
                withCredentials: true
            });

            const authHeader = response1.headers['www-authenticate'];
            const authHeaderParams = authHeader.match(/([a-zA-Z0-9]+)="([^"]*)"/g);
            const params = {
                realm: null,
                nonce: null,
                opaque: null,
            };
            authHeaderParams.forEach(param => {
                const [key, value] = param.split('=');
                params[key] = value.replace(/\"/g, '');
            });

            const authenticate1 = md5(username + ':' + params.realm + ':' + password);
            const authenticate2 = md5('PUT:' + url);
            const authenticateResponse = md5(authenticate1 + ':' + params.nonce + ':' + authenticate2);

            const requestHeaders = {
                'Content-Type': 'application/json;charset=UTF-8',
                'Authorization': 'Digest username="' + username + '", realm="' + params.realm + '", nonce="' + params.nonce + '", uri="' + url + '", response="' + authenticateResponse + '", opaque="' + params.opaque + '"'
            };

            const response2 = await axios.put(url, data, {
                headers: requestHeaders,
                withCredentials: true
            });

            return response2;
        } catch (error) {
            console.error(error);
        }
    }

}

export default Intouch;