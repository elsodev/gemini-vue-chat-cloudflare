import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [],
    userName: '',
  }),
  actions: {
    addMessage(message) {
      this.messages.push(message);
    },
    setUserName(name) {
      this.userName = name;
    },
  },
});