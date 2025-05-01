<script setup>
import { ref, watch, computed } from 'vue'
import { useProvider } from '@/stores/Provider.js'
import { parseUnits, formatUnits } from 'ethers'
import ConfigButton from '@/components/ConfigButton.vue'
import { convertScientificToString } from '@/utils/convertScientificToString.js'

const { contextAssets, startCampaign } = useProvider()

const campaignAsset = ref(contextAssets.value[0])
const campaignAmountHuman = ref('')
const campaignError = ref(undefined)
const campaignMax = ref(undefined)
const campaignFollowers = ref(undefined)
const loading = ref(false)
const assetsDialog = ref(null)

const campaignAmount = computed(() => {
  if (campaignError.value || !campaignAsset.value || !campaignAmountHuman.value) return BigInt(0)
  return parseUnits(campaignAmountHuman.value, campaignAsset.value.decimals)
})

const campaignMaxHuman = computed(() => {
  return formatUnits(campaignMax.value, campaignAsset.value.decimals)
})

const campaignMaxFollowers = computed(() => {
  if (
    campaignError.value ||
    !campaignAsset.value ||
    !campaignAmountHuman.value ||
    campaignAmountHuman.value == 0
  )
    return BigInt(0)
  return campaignAsset.value.balance / BigInt(campaignAmount.value)
})

const getHumanBalance = (asset) => {
  return formatUnits(asset.balance, asset.decimals).toLocaleString()
}

const showAssetsDialog = () => {
  if (!loading) return
  assetsDialog.value.showModal()
}

const setAsset = (asset) => {
  campaignAsset.value = asset
  campaignError.value = undefined
  campaignAmountHuman.value = undefined
  campaignMax.value = undefined
  assetsDialog.value.close()
}

const updateCampaignAmount = (amount) => {
  let cleaned = amount.replace(/[^0-9.]/g, '')

  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }

  if (parts.length === 2 && parts[1].length > campaignAsset.value.decimals) {
    campaignError.value = `To many decimals`
  } else {
    const units = parseUnits(cleaned, campaignAsset.value.decimals)

    if (units > campaignAsset.value.balance) {
      campaignError.value = `Insufficient funds. Max ${getHumanBalance(campaignAsset.value)} ${campaignAsset.value.symbol}`
    } else {
      campaignError.value = undefined
      if (cleaned === '') {
        campaignMax.value = undefined
      } else {
        campaignMax.value = units
      }
    }
  }

  campaignAmountHuman.value = cleaned
  updateCampaignMax('1')
}

const updateCampaignMax = (amount) => {
  campaignFollowers.value = amount
  campaignMax.value = BigInt(convertScientificToString(amount)) * BigInt(campaignAmount.value)
}

const start = async () => {
  loading.value = true

  await startCampaign(
    campaignAsset.value.assetAddress,
    campaignAmount.value,
    campaignMax.value,
  ).finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <div class="content">
    <p>Boost your followers! Start a campaign and give new followers some LYX or other token.</p>

    <label>
      Quantity per new follower:
      <div class="amount" :class="{ error: campaignError }">
        <input
          type="text"
          :value="campaignAmountHuman"
          @input="(e) => updateCampaignAmount(e.target.value)"
          class="input"
          :disabled="loading"
        />
        <div @click="showAssetsDialog()" class="select">
          {{ campaignAsset?.symbol }} <span></span>
        </div>
      </div>
      <div class="errormsg" v-if="campaignError">{{ campaignError }}</div>
    </label>

    <label>
      <span>Max amount {{ campaignAsset?.symbol }} to spend:</span>

      <input
        type="range"
        :min="1"
        :step="1"
        :max="campaignMaxFollowers.toString()"
        :value="campaignFollowers"
        @input="(e) => updateCampaignMax(e.target.value)"
        class="slider"
        :disabled="campaignError !== undefined || !campaignAmountHuman || campaignAmountHuman === 0"
      />
      <span class="max" v-if="!campaignError && campaignAmountHuman && campaignAmountHuman > 0"
        >Campaign ends after {{ campaignFollowers }} new followers, total {{ campaignMaxHuman }}
        {{ campaignAsset?.symbol }}</span
      >
    </label>

    <ConfigButton
      :action="start"
      :disabled="loading || campaignError !== undefined"
      :type="'success'"
    >
      {{ loading ? 'Continue in wallet' : 'Start campaign' }}
    </ConfigButton>
  </div>

  <dialog ref="assetsDialog">
    <div class="inner">
      <ul class="assets">
        <li v-for="asset in contextAssets" @click="setAsset(asset)">
          <div class="title">
            <span class="name">{{ asset.name }}</span>
            <span class="balance"> {{ getHumanBalance(asset) }} {{ asset.symbol }} available</span>
          </div>
          <div class="action">&#x3e;</div>
        </li>
      </ul>
    </div>
  </dialog>
</template>

<style scoped>
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

.select {
  white-space: nowrap;
  padding: 5px 5px 5px 10px;
  border-left: 1px solid;
  font-weight: bold;
  cursor: pointer;
}

.select > span {
  margin: 2px 0 2px 4px;
  border: solid black;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: rotate(45deg);
  -webkit-transform: rotate(45deg);
}

.amount.error {
  border-color: red;
}

.errormsg {
  margin-top: -5px;
  color: red;
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

.slider:hover:not(:disabled),
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

.max,
.errormsg {
  float: right;
  font-size: 0.8em;
}

dialog {
  position: fixed;
  top: auto;
  bottom: 0;
  width: 100%;
  max-width: unset;
  min-height: 60%;
  border: 0;
  width: 100%;
  margin: 0;
  animation: 0.8s ease-in-out slide-up;
  outline: none;
}

dialog[open] {
  display: flex;
  justify-content: center;
}

.inner {
  width: 100%;
  max-width: 600px;
}

.assets {
  list-style: none;
  margin: 0;
  padding: 0;
}

.assets li {
  border-bottom: 1px solid;
  cursor: pointer;
  display: grid;
  grid-template-columns: auto 1em;
  grid-template-rows: 100%;
  gap: 0px 0.5em;
  grid-template-areas: 'title action';
  cursor: pointer;
  padding: 5px 0 5px 0;
}

.assets .title {
  grid-area: title;
  display: flex;
  flex-direction: column;
}

.assets .title .name {
  font-weight: bold;
  line-height: 30px;
}

.assets .title .balance {
  font-size: 0.8em;
  line-height: 20px;
}

.assets .action {
  grid-area: action;
  display: flex;
  justify-content: center;
  align-items: center;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0%);
  }
}
</style>
