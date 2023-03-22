import axios from "axios";
import { randomBytes } from "crypto";

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

class Intouch {
    static SUPPORTED_OPERATORS: [string, string] = ['ORANGE', 'MTN'];

    static GUTOUCH_API_GETBALANCE = "https://api.gutouch.com/v1/[INTOUCH_ID]/get_balance";
    static GUTOUCH_API_URL = "https://api.gutouch.com/dist/api/touchpayapi/v1/[INTOUCH_ID]/transaction?loginAgent=[LOGIN_AGENT]&passwordAgent=[PASSWORD_AGENT]";
    static GUTOUCH_API_CASHIN_URL = "https://api.gutouch.com/v1/[INTOUCH_ID]/cashin";

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
                    this.serviceCode('CM_PAIEMENTMARCHAND_OM_TP');
                } else if (this._operator === Intouch.SUPPORTED_OPERATORS[1]) {
                    // MTN
                    this.serviceCode('PAIEMENTMARCHAND_MTN_CM');
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
            'idFromClient': idFromClient ?? randomBytes(12).toString(),
            'amount': this._amount,
            'callback': this._callback,
            'recipientNumber': this._phone,
            'serviceCode': this._serviceCode,
            'additionnalInfos': additionnalInfos
        };

        const auth = {
            username: this.username,
            password: this.password
        }

        return await axios.put(this._endpoint, payload, { auth })
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


}

export default Intouch;