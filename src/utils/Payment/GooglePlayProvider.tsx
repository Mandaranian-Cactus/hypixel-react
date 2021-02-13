import api from "../../api/ApiHelper";
import AbstractPaymentProvider from "./AbstractPaymentProvider";

const PAYMENT_METHOD = "https://play.google.com/billing";

const paymentDetails: PaymentDetails = {
    total: {
        label: `Total`,
        amount: { currency: `EUR`, value: `1` }
    }
}

let paymentMethods: PaymentMethod[] = [{
    supportedMethods: "https://play.google.com/billing",
    data: {
        sku: 'premium_1'
    }
}];

export default class GooglePlayProvider extends AbstractPaymentProvider {

    private digitalGoodsService: any;

    public async getProducts(): Promise<Product[]> {
        if (!this.digitalGoodsService) {
            await this.setDigitalGoodsService();
        }
        if (this.digitalGoodsService) {
            let result = await this.digitalGoodsService.getDetails(['premium_30', 'premium_1', 'premium_3']);
            return result;
        }
        return [];
    }

    public async pay(product: Product, log: Function): Promise<Product> {
        paymentMethods[0].data.sku = product.itemId;
        const request = new PaymentRequest(paymentMethods, paymentDetails);
        const paymentResponse = await request.show();
        const { token } = paymentResponse.details;
        log(JSON.stringify({token}));
        product.description = token;
        let valid = await this.validatePaymentToken(token, product);
        log(JSON.stringify({valid}));
        if (valid) {
            await this.digitalGoodsService.acknowledge(token, 'onetime');
            await paymentResponse.complete('success');
            return product;
        } else {
            await paymentResponse.complete('fail');
            return product;
        }
    }

    public async checkIfPaymentIsPossible(): Promise<boolean> {
        if (!window.PaymentRequest) {
            return false;
        }
        if (!('getDigitalGoodsService' in window)) {
            return false;
        }
        return true;
    }

    private async validatePaymentToken(token: string, product: Product): Promise<boolean> {
        return api.validatePaymentToken(token, product.itemId);
    }

    private async setDigitalGoodsService() {
        if (!('getDigitalGoodsService' in window)) {
            throw 'getDigitalGoodsService not found';
        }
        this.digitalGoodsService = await (window as any).getDigitalGoodsService(PAYMENT_METHOD);
    }
}
