<script setup>
import { computed } from 'vue'
import { useProvider } from '@/stores/Provider.js'

import Config from './pages/Config.vue'
import Follow from './pages/Follow.vue'
import NoContext from './pages/NoContext.vue'
import Thanks from './pages/Thanks.vue'

const { account, contextAccount, accountIsFollowingContext } = useProvider()

const accountIsContext = computed(() => contextAccount.value === account.value)
</script>

<template>
  <div class="container">
    <NoContext v-if="contextAccount === undefined" />
    <Config v-else-if="accountIsContext" />
    <Follow v-else-if="!accountIsFollowingContext" />
    <Thanks v-else />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
}
</style>
