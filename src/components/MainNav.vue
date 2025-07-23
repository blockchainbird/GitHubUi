<template>
  <nav class="main-nav">
    <button @click="showModal = true" class="btn btn-outline-secondary">About</button>
    <a href="https://blockchainbird.github.io/spec-up-t-website/" target="_blank" rel="noopener"
      class="ms-3 btn btn-outline-secondary">
      Documentation
    </a>
    <Modal v-if="showModal" @close="showModal = false">
      <template #header>
        <h2>About Spec-Up-T</h2>
      </template>
      <template #body>
        <p>
          Spec-Up-T is an extension of DIF's Spec-Up tool, designed for creating rich technical specification documents
          using enhanced markdown. It adds features for terminology management and other improvements, tailored for the
          Trust-over-IP (ToIP) community, while staying in sync with the original Spec-Up project.
        </p>
        <p style="font-size: 0.9em; color: #888;">
          <a href="https://blockchainbird.github.io/spec-up-t-website/docs/introduction/how-it-came-to-be/"
            target="_blank" rel="noopener">Read more</a>
        </p>
      </template>
    </Modal>
  </nav>
</template>

<script>
import Modal from './Modal.vue';

export default {
  name: 'MainNav',
  components: { Modal },
  data() {
    return {
      showModal: false
    };
  }
};
</script>

<style scoped>
.main-nav {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}
</style>
