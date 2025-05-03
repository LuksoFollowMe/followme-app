<script setup>
import { ref, computed } from 'vue'
import { useProvider } from '@/stores/Provider.js'
import Profile from '@/components/Profile.vue'

const { campaignDetails, account, accountCanCollect, followContext } = useProvider()
const loading = ref(false)

const contextCampaignAmount = computed(() => {
  return (
    Number(campaignDetails.value?.amount) /
    10 ** campaignDetails.value?.decimals
  ).toLocaleString(undefined, {
    maximumFractionDigits: campaignDetails.value?.decimals,
  })
})

const follow = async () => {
  if (loading.value || !account.value) {
    return
  }
  loading.value = true

  await followContext().finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <div class="content">
    <div class="follow" :class="{ connect: !account }" @click="follow">
      <Profile />
      <button class="button">Follow Me</button>
    </div>

    <p
      v-if="
        campaignDetails?.amount > 0n &&
        campaignDetails.amount <= campaignDetails.balance &&
        campaignDetails.controllerErrors.length == 0 &&
        accountCanCollect
      "
    >
      Follow me and get
      <b>{{ contextCampaignAmount }} {{ campaignDetails.symbol }}</b
      >!
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

.follow {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.follow:hover > button {
  font-size: 1.6em;
}

button {
  margin-top: -15px;
  background-color: #fff;
  color: #5b6c87;
  font-size: 1.4em;
  border: 2px solid #5b6c87;
  border-radius: 5px;
  padding: 0.2em 1.2em 0.2em 1.2em;
  transition: font-size 0.3s ease;
  cursor: pointer;
}

p {
  text-align: center;
}

.follow.connect:hover > button {
  cursor: not-allowed;
}
</style>
