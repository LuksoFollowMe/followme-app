<script setup>
import { computed } from 'vue'
import { useProvider } from '@/stores/Provider.js'

const { contextCampaign } = useProvider()

const contextCampaignAmount = computed(() => {
  return Number(contextCampaign.value) / 10 ** 18
})
</script>

<template>
  <div class="content">
    <p v-if="contextCampaign > 0n" class="heading">
      Hi! I'm running a FollowMe campaign. Follow my UP to get
      <b>{{ contextCampaignAmount }} LYX</b>! Connect to this mini-app to get started.
    </p>

    <p>
      Would you like to gain more followers? Reward new followers with some LYX! Clone this mini-app
      to your profile and connect.
    </p>
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
</style>
