<script setup>
import Profile from '@/components/Profile.vue'
</script>

<template>
  <div class="content">
    <div class="inner">
      <Profile />
      <button class="button">Follow Me</button>
    </div>
    <p>Boost your followers with FollowMe. Connect to continue.</p>
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

.inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.inner:hover {
  cursor: not-allowed;
}

.inner:hover > button {
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
  cursor: not-allowed;
}

p {
  text-align: center;
}
</style>
