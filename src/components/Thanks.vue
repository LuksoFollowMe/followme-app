<script setup>
import { computed, ref } from 'vue'
import { useProvider } from '@/stores/Provider.js'

const { accountCanCollect, contextCampaign, collect } = useProvider()

const loading = ref(false)

const contextCampaignAmount = computed(() => {
  return Number(contextCampaign.value) / 10 ** 18
})

const claim = async () => {
  loading.value = true
  await collect().finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <div class="content">
    <p class="heading">Thank you for following!</p>
    <p v-if="accountCanCollect">
      Claim you <b>{{ contextCampaignAmount }} LYX</b> using the button below!
    </p>
    <p>Would you like to gain more followers? Clone this mini-app to your profile.</p>

    <button v-if="accountCanCollect" @click="claim" class="button" :disabled="loading">
      {{ loading ? 'Continue in wallet' : 'Claim' }}
    </button>
  </div>
</template>

<style scoped>
.content {
  flex-grow: 1;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
}

p {
  width: 80%;
  text-align: center;
}

p.heading {
  font-size: 1.2em;
}

.button {
  margin-top: 5px;
  width: 100%;
  height: 40px;
  background: #04aa6d;
  border: 0;
  border-radius: 4px;
  text-transform: uppercase;
}
</style>
