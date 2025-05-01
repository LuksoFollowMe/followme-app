<script setup>
const props = defineProps({
  action: { type: Function, required: true },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'success' },
})
</script>

<template>
  <button class="button" :class="type" @click="action" :disabled="disabled">
    <slot></slot>
  </button>
</template>

<style scoped>
.button {
  margin-top: 5px;
  width: 100%;
  height: 40px;
  background: #fff;
  border: 0;
  border-radius: 4px;
  text-transform: uppercase;
  cursor: pointer;
}

.button.success {
  background: #04aa6d;
  color: #fff;
}

.button.danger {
  background: #dc3545;
  color: #fff;
}

.button:disabled {
  opacity: 0.8;
}
</style>
