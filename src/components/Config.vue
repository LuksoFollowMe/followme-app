<script setup>
import { ref, watch, computed } from 'vue'
import { useProvider } from '@/stores/Provider.js'

const { contextCampaign, contextBalance, startCampaign, cancelCampaign } = useProvider()

const campaignAmount = defineModel({ default: 0.01 })
const campaignError = ref(undefined)
const campaignMax = ref(0.01)
const loading = ref(false)

const contextCampaignAmount = computed(() => {
  return Number(contextCampaign.value) / 10 ** 18
})

const balance = computed(() => {
  return Number(contextBalance.value) / 10 ** 18
})
const campaignMaxAmount = computed(() => {
  return campaignError.value
    ? 0
    : Math.floor(balance.value / campaignAmount.value) * campaignAmount.value
})

const start = async () => {
  loading.value = true
  await startCampaign(campaignAmount.value.toString(), campaignMax.value.toString()).finally(() => {
    loading.value = false
  })
}

const cancel = async () => {
  loading.value = true
  await cancelCampaign().finally(() => {
    loading.value = false
  })
}

watch(campaignAmount, (newAmount) => {
  if (newAmount == 0) {
    campaignError.value = `Quantity to low`
    return
  }

  if (newAmount > balance.value) {
    campaignError.value = `Insufficient funds. max ${balance.value} LYX`
    return
  }

  campaignMax.value = newAmount
  campaignError.value = undefined
})
</script>

<template>
  <template v-if="contextCampaign > BigInt(0)">
    <p class="content center">
      You are currently running a campaign. Every new follower receives
      {{ contextCampaignAmount }} LYX.
    </p>
    <button @click="cancel" class="button" :disabled="loading">
      {{ loading ? 'Continue in wallet' : 'Cancel campaign' }}
    </button>
  </template>
  <template v-else>
    <div class="content">
      <p>Boost your followers! Start a campaign to give new followers some LYX.</p>

      <div class="errormsg" v-if="campaignError">{{ campaignError }}</div>

      <label>
        Quantity per new follower:
        <div class="amount" :class="{ error: campaignError }">
          <input type="number" min="0.000000000000000001" v-model="campaignAmount" class="input" />
          <span>LYX</span>
        </div>
      </label>

      <label>
        <span>Campaign max:</span>
        <span class="max">(max {{ campaignMax }} LYX)</span>

        <input
          type="range"
          :min="campaignAmount"
          :step="campaignAmount"
          :max="campaignMaxAmount"
          v-model="campaignMax"
          class="slider"
          :disabled="balance === 0"
        />
      </label>

      <button @click="start" class="button" :disabled="loading || campaignError || balance === 0">
        {{ loading ? 'Continue in wallet' : 'Start campaign' }}
      </button>
    </div>
  </template>
</template>

<style>
.content {
  flex-grow: 1;
}

.content.center {
  text-align: center;
}

label {
  font-size: 0.8em;
}

.slider,
.amount {
  width: 100%;
  background: #fcfcfc;
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid;
  margin: 4px 0 8px 0;
}

.amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.amount.error {
  border-color: red;
}

.errormsg {
  background-color: red;
  padding: 10px;
  border-radius: 4px;
}

.slider {
  -webkit-appearance: none;
}

.amount:focus-within,
.slider:focus-within {
  border: 2px solid #000;
  background: #fff;
}

.amount.error:focus-within,
.slider.error:focus-within {
  border-color: red;
}

.input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
}

.input::-webkit-outer-spin-button,
.input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.slider:hover,
.amount:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 40px;
  background: #04aa6d;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 25px;
  height: 25px;
  background: #04aa6d;
  cursor: pointer;
}

.max {
  float: right;
  font-size: 0.8em;
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

.button:disabled {
  opacity: 0.8;
}
</style>
