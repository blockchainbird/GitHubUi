<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i class="bi bi-question-circle me-2"></i>
            Help
          </h2>
        </div>

        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-list-ul me-2"></i>
              Help & resources
            </h5>
          </div>
          <div class="card-body">
            <p class="text-muted small mb-3">Choose a help option:</p>

            <div class="row g-3">
              <div class="col-md-6">
                <button type="button" class="menu-option card h-100 w-100 text-start"
                  @click="showWelcomeModal = true">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-info-circle me-2 text-primary"></i>
                      <div>
                        <strong>Welcome</strong>
                        <div class="small text-muted">About Spec-Up-T Web Editor</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div class="col-md-6">
                <a class="menu-option card h-100 w-100 text-start text-decoration-none"
                  href="https://github.com/blockchainbird/GitHubUi/issues" target="_blank" rel="noopener">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-bug me-2 text-danger"></i>
                      <div>
                        <strong>Report issue <i class="bi bi-box-arrow-up-right ms-1" style="font-size: 0.8em;"></i></strong>
                        <div class="small text-muted">Open a GitHub issue</div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              <div class="col-md-6">
                <a class="menu-option card h-100 w-100 text-start text-decoration-none"
                  href="https://github.com/blockchainbird/GitHubUi/blob/main/USER_GUIDE.md" target="_blank"
                  rel="noopener">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-book me-2 text-primary"></i>
                      <div>
                        <strong>Documentation <i class="bi bi-box-arrow-up-right ms-1" style="font-size: 0.8em;"></i></strong>
                        <div class="small text-muted">Read the user guide</div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              <div class="col-md-6">
                <a class="menu-option card h-100 w-100 text-start text-decoration-none"
                  href="https://github.com/blockchainbird/GitHubUi" target="_blank" rel="noopener">
                  <div class="card-body">
                    <div class="d-flex align-items-start">
                      <i class="bi bi-github me-2 text-secondary"></i>
                      <div>
                        <strong>Repository <i class="bi bi-box-arrow-up-right ms-1" style="font-size: 0.8em;"></i></strong>
                        <div class="small text-muted">GitHubUi source repository</div>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end mt-4">
          <button type="button" class="btn btn-outline-secondary" @click="$router.back()">
            <i class="bi bi-arrow-left me-1"></i>
            Back
          </button>
        </div>
      </div>
    </div>
  </div>

  <Modal v-if="showWelcomeModal" @close="showWelcomeModal = false">
    <template #header>
      <div class="w-100">
        <h2 class="text-center">Spec-Up-T Web Editor</h2>
      </div>
    </template>
    <template #body>
      <p>
        <strong>Spec-Up-T Web Editor</strong> is a web-based specification writing tool based on
        <a target="_blank" rel="noopener" href="https://trustoverip.github.io/spec-up-t-website/">Spec-Up-T</a>,
        a command line tool.
      </p>
    </template>
  </Modal>
</template>

<script>
import { ref } from 'vue'
import Modal from './Modal.vue'

export default {
  name: 'HelpMenu',
  components: { Modal },
  setup() {
    const showWelcomeModal = ref(false)
    return { showWelcomeModal }
  }
}
</script>

<style scoped>
.menu-option {
  border: 1px solid var(--bs-border-color, #dee2e6);
  background: var(--bs-body-bg, #fff);
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.menu-option:hover {
  border-color: var(--bs-primary, #0d6efd);
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
}
</style>
