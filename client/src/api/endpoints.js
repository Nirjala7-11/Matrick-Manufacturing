export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    verifyOTP: '/auth/verify-otp',
    resetPassword: '/auth/reset-password',
  },
  products: {
    list: '/products',
    getById: (id) => `/products/${id}`,
    create: '/products',
    update: (id) => `/products/${id}`,
    toggleStatus: (id) => `/products/${id}/status`,
  },
  workCenters: {
    list: '/work-centers',
    getById: (id) => `/work-centers/${id}`,
    create: '/work-centers',
    update: (id) => `/work-centers/${id}`,
    toggleStatus: (id) => `/work-centers/${id}/status`,
  },
  boms: {
    list: '/boms',
    getById: (id) => `/boms/${id}`,
    getByProduct: (productId) => `/boms/product/${productId}`,
    create: '/boms',
    update: (id) => `/boms/${id}`,
    toggleStatus: (id) => `/boms/${id}/status`,
    delete: (id) => `/boms/${id}`,
    calculateRequirements: (id) => `/boms/${id}/calculate-requirements`,
  },
};

export default endpoints;
