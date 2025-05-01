<script setup>
import { computed } from 'vue'
import { useProvider } from '@/stores/Provider.js'

import ConfigStart from './ConfigStart.vue'
import ConfigCancel from './ConfigCancel.vue'
import ConfigNoAssets from './ConfigNoAssets.vue'
import ConfigError from './ConfigError.vue'

const { campaignDetails, contextAssets } = useProvider()

const hasActiveCampign = computed(() => campaignDetails.value?.amount > 0n)
</script>

<template>
  <ConfigStart v-if="!hasActiveCampign && contextAssets.length > 0" />
  <ConfigNoAssets v-else-if="!hasActiveCampign && contextAssets.length === 0" />
  <ConfigError
    v-else-if="!campaignDetails.permission || campaignDetails.amount > campaignDetails.balance"
  />
  <ConfigCancel v-else />
</template>
