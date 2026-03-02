const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    const items = ref([]);
    const loading = ref(true);
    const copiedIndex = ref(null);

    function loadItems() {
      loading.value = true;
      chrome.runtime.sendMessage({ type: 'get_magnets' }, (response) => {
        if (response && response.items) items.value = response.items;
        loading.value = false;
      });
    }

    async function copyMagnet(it, idx) {
      try {
        await navigator.clipboard.writeText(it.magnet);
        copiedIndex.value = idx;
        setTimeout(() => (copiedIndex.value = null), 2000);
      } catch (e) {
        console.error('Clipboard error', e);
        alert('Erro ao copiar para clipboard');
      }
    }

    // Ouve notificações do background (quando novos magnets são processados)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.type === 'processed_magnets') {
        items.value = message.items || [];
        loading.value = false;
      }
    });

    onMounted(() => {
      loadItems();
    });

    return { items, loading, copyMagnet, copiedIndex };
  }
}).mount('#app');
