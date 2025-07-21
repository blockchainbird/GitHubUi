<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <header class="modal-header">
        <slot name="header"></slot>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </header>
      <section class="modal-body">
        <slot name="body"></slot>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal'
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.2);
  max-width: 400px;
  width: 90vw;
  padding: 1.5rem;
  position: relative;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
}
.close-btn:hover {
  color: #2d72d9;
}
.modal-body {
  font-size: 1rem;
  color: #222;
}
</style>
