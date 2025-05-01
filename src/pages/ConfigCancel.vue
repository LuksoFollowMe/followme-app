<script setup>
import { ref, computed } from 'vue'
import { formatUnits } from 'ethers'
import { useProvider } from '@/stores/Provider.js'

import Profile from '@/components/Profile.vue'
import ConfigButton from '@/components/ConfigButton.vue'

const { campaignDetails, cancelCampaign } = useProvider()

const loading = ref(false)

const contextCampaignAmount = computed(() => {
  return formatUnits(campaignDetails.value?.amount, campaignDetails.value?.decimals)
})

const cancel = async () => {
  loading.value = true
  await cancelCampaign().finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <div class="content">
    <Profile />
    <p>
      You are currently running a FollowMe campaign. Every new follower receives
      {{ contextCampaignAmount }} {{ campaignDetails?.symbol }}.
    </p>

    <ConfigButton :action="cancel" :disabled="loading" :type="'danger'">
      {{ loading ? 'Continue in wallet' : 'Cancel campaign' }}
    </ConfigButton>
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
  text-align: center;
}
</style>
