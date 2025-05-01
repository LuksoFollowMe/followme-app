<script setup>
import { ref } from 'vue'
import { useProvider } from '@/stores/Provider.js'
import Profile from '@/components/Profile.vue'
import ConfigButton from '@/components/ConfigButton.vue'

const { campaignDetails, setPermissions, cancelCampaign } = useProvider()

const loading = ref(false)

const resetPermissions = async () => {
  loading.value = true
  await setPermissions().finally(() => {
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
    <template v-if="!campaignDetails.permission">
      <p>
        You are currently running a FollowMe campaign, but there is an issue with the permissions.
      </p>

      <ConfigButton :action="resetPermissions" :disabled="loading">
        {{ loading ? 'Continue in wallet' : 'Reset permissions' }}
      </ConfigButton>
    </template>
    <template v-else-if="campaignDetails.amount > campaignDetails.balance">
      <p>
        You are currently running a FollowMe campaign, but there aren't enough funds.
        {{ campaignDetails.symbol }} left. Top up your profile.
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
