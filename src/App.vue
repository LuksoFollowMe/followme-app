<script setup>
import { useProvider } from '@/stores/Provider.js'

import Connect from './components/Connect.vue'
import Config from './components/Config.vue'
import Follow from './components/Follow.vue'
import Loading from './components/Loading.vue'
import Thanks from './components/Thanks.vue'

const { account, contextAccount, accountIsFollowingContext } = useProvider()
</script>

<template>
  <div class="container">
    <h1>FollowMe</h1>
    <Loading v-if="contextAccount === undefined" />
    <Connect v-else-if="account === undefined" />
    <Config v-else-if="account === contextAccount" />
    <Follow v-else-if="!accountIsFollowingContext" />
    <Thanks v-else />
  </div>
</template>

<style>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

h1 {
  width: 100%;
  text-align: center;
  text-transform: capitalize;
  margin: 0 0 5px 0;
}
</style>
