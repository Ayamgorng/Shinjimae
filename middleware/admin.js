// tambahkan admin.js
export const admins = new Map()
export const users = new Map()

export function addAdmin(jid) {
  admins.set(jid, { role: 'admin', expiry: null })
}

export function addUser(jid, plan = 'free', expiry = Date.now() + 604800000) {
  users.set(jid, { role: 'user', plan, expiry })
}
