export const FORBIDDEN_PATTERNS = [
    /wa\.me\/settings/gi,
    /3j91CUKNVO/gi,
    /verifikasi anda\s*:\s*\d+/gi,
    /[\w\d]{16,}/gi // Panjang karakter mencurigakan
]

export const PAYMENT_METHODS = {
    DANA: {
        name: 'DANA',
        fee: 2000,
        min: 10000
    },
    GOPAY: {
        name: 'GoPay',
        fee: 1500,
        min: 5000
    },
    SHOPEEPAY: {
        name: 'ShopeePay',
        fee: 1000,
        min: 10000
    }
}

export const SUBSCRIPTION_PLANS = {
    TRIAL: {
        name: 'Trial',
        price: 0,
        duration: 3 // hari
    },
    BASIC: {
        name: 'Basic',
        price: 29000,
        duration: 7
    },
    PREMIUM: {
        name: 'Premium',
        price: 99000,
        duration: 30
    },
    PRO: {
        name: 'Pro',
        price: 199000,
        duration: 90
    }
}
