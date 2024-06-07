import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    accessToken: null,
  }),
  actions: {
    setUser(user) {
      this.user = user;
    },
    setAccessToken(token) {
      this.accessToken = token;
    },
    logout() {
      this.user = null;
      this.accessToken = null;
    },
  },
});