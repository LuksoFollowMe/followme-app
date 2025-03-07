<script setup>
import { computed, ref } from 'vue'
import { useProvider } from '@/stores/Provider.js'

const { contextCampaign, followContext, accountCanCollect } = useProvider()

const loading = ref(false)

const contextCampaignAmount = computed(() => {
  return Number(contextCampaign.value) / 10 ** 18
})

const follow = async () => {
  loading.value = true
  await followContext().finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <div class="content">
    <p v-if="contextCampaign > 0n && accountCanCollect" class="heading">
      Hi! I'm running a FollowMe campaign. Follow my UP using the button below and get
      <b>{{ contextCampaignAmount }} LYX</b>!
    </p>

    <p>Would you like to gain more followers? Clone this mini-app to your profile.</p>

    <button
      v-if="contextCampaign > 0n && accountCanCollect"
      @click="follow"
      class="button"
      :disabled="loading"
    >
      {{ loading ? 'Continue in wallet' : 'Follow' }}
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
