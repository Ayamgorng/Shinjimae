export class User {
    constructor(data) {
        this.id = data.id
        this.phone = data.phone
        this.name = data.name
        this.role = data.role || 'user'
        this.createdAt = data.createdAt || new Date()
    }
}

export class Payment {
    constructor(data) {
        this.id = data.id
        this.userId = data.userId
        this.amount = data.amount
        this.method = data.method
        this.status = data.status || 'pending'
        this.createdAt = data.createdAt || new Date()
        this.completedAt = data.completedAt
    }
}

export class Subscription {
    constructor(data) {
        this.userId = data.userId
        this.plan = data.plan
        this.start = data.start || new Date()
        this.end = data.end || this.calculateEndDate(data.plan)
        this.status = data.status || 'active'
    }

    calculateEndDate(plan) {
        const date = new Date()
        const durations = {
            trial: 3,
            basic: 7,
            premium: 30,
            pro: 90
        }
        date.setDate(date.getDate() + (durations[plan] || 0))
        return date
    }
}
