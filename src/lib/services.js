import { api, idempotencyKey } from './apiClient'

/** Serialises defined, non-empty params into a query string. */
function toQuery(params) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  ).toString()
  return query ? `?${query}` : ''
}

export const authService = {
  register: (payload) => api.post('/auth/register', payload, { auth: false }),
  login: (payload) => api.post('/auth/login', payload, { auth: false }),
  me: () => api.get('/auth/me'),
}

export const kycService = {
  verifyFayda: (payload) => api.post('/kyc/verify-fayda', payload),
  status: () => api.get('/kyc/status'),
}

export const walletService = {
  balance: () => api.get('/wallet/balance'),
  transactions: (limit = 50) => api.get(`/wallet/transactions?limit=${limit}`),
  transaction: (id) => api.get(`/wallet/transactions/${id}`),

  deposit: ({ amountEtb, channel }) =>
    api.post('/wallet/deposit', {
      amount_etb: amountEtb,
      payment_channel: channel,
      idempotency_key: idempotencyKey('DEPOSIT'),
    }),

  withdraw: ({ amountEtb, bankCode, accountNumber }) =>
    api.post('/wallet/withdraw', {
      amount_etb: amountEtb,
      destination_bank_code: bankCode,
      destination_account_number: accountNumber,
      idempotency_key: idempotencyKey('WITHDRAW'),
    }),
}

export const marketService = {
  listAssets: (params = {}) => api.get(`/market/assets${toQuery(params)}`),
  getAsset: (subFundId) => api.get(`/market/assets/${subFundId}`),
  orderBook: (subFundId) => api.get(`/market/assets/${subFundId}/order-book`),
  highlights: () => api.get('/market/highlights'),
}

export const portfolioService = {
  summary: () => api.get('/portfolio/summary'),
  holdings: () => api.get('/portfolio/holdings'),
  activity: (limit = 20) => api.get(`/portfolio/activity?limit=${limit}`),
}

export const ordersService = {
  place: ({ subFundId, direction, orderType, shares, pricePerShare }) =>
    api.post('/orders', {
      sub_fund_id: subFundId,
      direction,
      order_type: orderType,
      total_shares_ordered: shares,
      target_price_per_share_etb: pricePerShare,
      idempotency_key: idempotencyKey(direction === 'BUY' ? 'DEPOSIT' : 'WITHDRAW'),
    }),
  mine: (status) => api.get(`/orders${status ? `?status=${status}` : ''}`),
  get: (orderId) => api.get(`/orders/${orderId}`),
  cancel: (orderId) => api.post(`/orders/${orderId}/cancel`),
}

export const assetService = {
  list: (params = {}) => api.get(`/assets${toQuery(params)}`),
  get: (assetId) => api.get(`/assets/${assetId}`),
  subscribe: ({ subFundId, shares }) =>
    api.post(`/assets/sub-funds/${subFundId}/subscribe`, {
      shares,
      idempotency_key: idempotencyKey('DEPOSIT'),
    }),
}

export const basketService = {
  mine: () => api.get('/baskets'),
  listed: (params = {}) => api.get(`/baskets/market${toQuery(params)}`),
  get: (basketId) => api.get(`/baskets/${basketId}`),
  royalties: () => api.get('/baskets/royalties'),

  create: ({ name, totalBasketShares, constituents }) =>
    api.post('/baskets', {
      basket_name: name,
      total_basket_shares: totalBasketShares,
      constituents,
      idempotency_key: idempotencyKey('DEPOSIT'),
    }),

  list: ({ basketId, saleMode, shares, pricePerUnit }) =>
    api.post(`/baskets/${basketId}/list`, {
      sale_mode: saleMode,
      total_basket_shares_listed: shares,
      price_per_unit_etb: pricePerUnit,
      idempotency_key: idempotencyKey('DEPOSIT'),
    }),

  cancelListing: (listingId) => api.post(`/baskets/listings/${listingId}/cancel`),

  buy: ({ listingId, shares }) =>
    api.post(`/baskets/listings/${listingId}/buy`, {
      basket_shares: shares,
      idempotency_key: idempotencyKey('DEPOSIT'),
    }),

  dissolve: (basketId) => api.post(`/baskets/${basketId}/dissolve`),
}

export const yieldService = {
  income: () => api.get('/yield/income'),
  distributions: (subFundId) => api.get(`/yield/sub-funds/${subFundId}/distributions`),
  distribution: (distributionId) => api.get(`/yield/distributions/${distributionId}`),
}

export const adminService = {
  tradingStatus: () => api.get('/admin/trading-status'),
}
