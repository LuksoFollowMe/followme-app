<script setup>
import { ref } from 'vue'
import { useProvider } from '@/stores/Provider.js'
import Profile from '@/components/Profile.vue'
import ConfigButton from '@/components/ConfigButton.vue'

const { campaignDetails, setControllerPermissions, setContrtollerUrd, cancelCampaign } =
  useProvider()

const loading = ref(false)

const resetPermissions = async () => {
  loading.value = true
  await setControllerPermissions().finally(() => {
    loading.value = false
  })
}

const resetUrd = async () => {
  loading.value = true
  await setContrtollerUrd().finally(() => {
    loading.value = false
  })
}

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
    <template v-if="!campaignDetails.controllerErrors.includes('PERMISSIONS')">
      <p>Your FollowMe campaign is paused, the controller's permissions aren't set up correctly.</p>

      <ConfigButton :action="resetPermissions" :disabled="loading">
        {{ loading ? 'Continue in wallet' : 'Reset permissions' }}
      </ConfigButton>
    </template>
    <template v-else-if="!campaignDetails.controllerErrors.includes('URD')">
      <p>Your FollowMe campaign is paused due to an incorrectly configured controller.</p>

      <ConfigButton :action="resetUrd" :disabled="loading">
        {{ loading ? 'Continue in wallet' : 'Reset controller' }}
      </ConfigButton>
    </template>
    <template v-else-if="campaignDetails.amount > campaignDetails.balance">
      <p>
        You are currently running a FollowMe campaign, but there aren't enough funds. Top up your
        profile.
      </p>
    </template>

    <a v-if="!loading" href="#" @click="cancel">or cancel campign</a>
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
  color: red;
}

a {
  margin-top: 5px;
  color: #000;
  text-decoration: none;
  font-size: 0.9em;
}
</style>
