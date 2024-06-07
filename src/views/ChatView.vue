<template>
  <div class="flex justify-center items-center min-h-screen">
    <div class="w-3/4">
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <div class="px-4 py-5 sm:p-6">
          <div class="chat-messages overflow-y-auto max-h-96" ref="chatMessages">
            <div v-if="messages.length === 0" class="text-center text-gray-500">No messages yet</div>
            <div v-for="message in messages" :key="message.id" class="chat mb-4" :class="{'chat-start' : message.sender === name, 'chat-end': message.sender !== name}">
              <div class="chat-bubble flex items-start">
                <div class="ml-2">
                  <div class="text-sm font-medium">{{ message.sender }}</div>
                  <div class="mt-1 text-sm whitespace-pre-wrap"><vue-markdown :source="message.content" /></div>
                  <div class="mt-2 text-xs text-green-50">{{ message.timestamp }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row gap-2">
          <input v-model="newMessage" type="text" placeholder="Type your message..."
             :disabled="chatLoading"
             class="input input-bordered w-full sm:text-sm bg-gray-50" @keyup.enter="sendMessage" />
          <button @click="sendMessage" class="btn btn-primary" :disabled="chatLoading">
            <span class="loading loading-spinner" v-if="chatLoading"></span>
            Send
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Login/Register Modal -->
  <div class="fixed z-10 inset-0 overflow-y-auto" :class="{ 'opacity-0 pointer-events-none': !showModal }">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" aria-hidden="true" @click="showModal = false">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <form action="#" v-on:submit.prevent="submitModal" class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-headline">{{ modalMode === 'login' ? 'Login' : 'Register' }}</h3>
          <div class="alert alert-error w-full my-3" v-if="authError.length > 0">{{ authError }}</div>
          <div class="mt-4">
            <div class="mb-4">
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input v-model="email" type="email" id="email" autocomplete="off" class="mt-1 input input-bordered w-full" />
            </div>
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input v-model="password" type="password" id="password" autocomplete="off" class="mt-1  input input-bordered w-full" />
            </div>
            <div v-if="modalMode === 'register'" class="mb-4">
              <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
              <input v-model="name" type="text" id="name" class="mt-1  input input-bordered w-full" />
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <input type="submit" @click="submitModal"  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm" :value="modalMode === 'login' ? 'Login' : 'Register'"/>
          <button @click="toggleModalMode" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">{{ modalMode === 'login' ? 'Register' : 'Login' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
<script>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';
import { useUserStore } from '../stores/user';
import VueMarkdown from 'vue-markdown-render';
export default {
  components: {
    VueMarkdown,
  },
  setup() {
    const messages = ref([]);
    const newMessage = ref('');
    const showModal = ref(true);
    const modalMode = ref('login');
    const email = ref('');
    const password = ref('');
    const name = ref('');
    const chatMessages = ref(null);
    const authError = ref('');
    const chatLoading = ref(false);

    const userStore = useUserStore();

    const sendMessage = async () => {
      if (!userStore.accessToken) {
        showModal.value = true;
        return;
      }

      try {
        chatLoading.value = true;

        messages.value.push({
          sender: userStore.user.name,
          content: newMessage.value,
          timestamp: new Date().toLocaleString(),
        });
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight;

        const response = await axios.post(`${process.env.VUE_APP_CLOUDFLARE_WORKER_URL}/chat`, {
          message: newMessage.value,
        }, {
          headers: {
            Authorization: `Bearer ${userStore.accessToken}`,
          },
        });
        messages.value.push({
          sender: 'Bot',
          content: response.data.response,
          timestamp: new Date().toLocaleString(),
        });
        newMessage.value = '';
        chatLoading.value = false;

        await nextTick();
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight;

      } catch (error) {
        chatLoading.value = false;
        console.error('Error:', error);
      }
    };

    const submitModal = async () => {
      authError.value = '';
      try {
        if (modalMode.value === 'login') {
          const response = await axios.post(`${process.env.VUE_APP_CLOUDFLARE_WORKER_URL}/login`, {
            email: email.value,
            password: password.value,
          });
          userStore.setUser(response.data.user);
          userStore.setAccessToken(response.data.accessToken);
          name.value = response.data.user.name;
        } else {
          const response = await axios.post(`${process.env.VUE_APP_CLOUDFLARE_WORKER_URL}/register`, {
            name: name.value,
            email: email.value,
            password: password.value,
          });
          userStore.setUser(response.data.user);
          userStore.setAccessToken(response.data.accessToken);
          name.value = response.data.user.name;
          modalMode.value = 'login';
        }
        showModal.value = false;
      } catch (error) {
        authError.value = error.response.data;
        console.error('Error:', error);
      }
    };

    const toggleModalMode = () => {
      modalMode.value = modalMode.value === 'login' ? 'register' : 'login';
    };

    onMounted(() => {
      showModal.value = true;
      console.log(`ChatView mounted with API: ${process.env.VUE_APP_CLOUDFLARE_WORKER_URL}`);
    });

    return {
      messages,
      newMessage,
      showModal,
      modalMode,
      email,
      password,
      name,
      chatMessages,
      sendMessage,
      submitModal,
      toggleModalMode,
      authError,
      chatLoading,
    };
  },
};
</script>