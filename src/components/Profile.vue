<script setup>
import { useProvider } from '@/stores/Provider.js'

const { contextProfileImage } = useProvider()
</script>

<template>
  <div class="profile">
    <img v-if="contextProfileImage" :src="contextProfileImage" />
  </div>
</template>

<style scoped>
.profile {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #dee7ed;
  background-image: url('@/assets/profile-default.svg');
  background-size: cover;
  background-position: center;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
</style>
