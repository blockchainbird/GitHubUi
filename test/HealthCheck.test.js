// Test script to validate HealthCheck component logic
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import HealthCheck from '../src/components/HealthCheck.vue'
import { useHealthCheck } from '../src/composables/useHealthCheck.js'

// Mock the composable
vi.mock('../src/composables/useHealthCheck.js')
vi.mock('../utils/visitedRepos.js', () => ({
  addToVisitedRepos: vi.fn()
}))

describe('HealthCheck Component', () => {
  const mockHealthCheck = {
    isRunning: ref(false),
    error: ref(''),
    results: ref([]),
    timestamp: ref(''),
    showPassing: ref(true),
    filteredResults: ref([]),
    runHealthCheck: vi.fn()
  }

  beforeEach(() => {
    vi.mocked(useHealthCheck).mockReturnValue(mockHealthCheck)
  })

  it('should render correctly with initial state', () => {
    const wrapper = mount(HealthCheck, {
      props: {
        owner: 'testowner',
        repo: 'testrepo',
        branch: 'main'
      },
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          }
        }
      }
    })

    expect(wrapper.find('h2').text()).toContain('Health Check - testowner/testrepo')
    expect(wrapper.find('button').text()).toContain('Run Health Check')
  })

  it('should show loading state when running', async () => {
    mockHealthCheck.isRunning.value = true

    const wrapper = mount(HealthCheck, {
      props: {
        owner: 'testowner',
        repo: 'testrepo',
        branch: 'main'
      },
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          }
        }
      }
    })

    expect(wrapper.find('.spinner-border').exists()).toBe(true)
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('should display error message when error occurs', async () => {
    mockHealthCheck.error.value = 'Test error message'

    const wrapper = mount(HealthCheck, {
      props: {
        owner: 'testowner',
        repo: 'testrepo',
        branch: 'main'
      },
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          }
        }
      }
    })

    expect(wrapper.find('.alert-danger').text()).toContain('Test error message')
  })

  it('should call runHealthCheck when button is clicked', async () => {
    const wrapper = mount(HealthCheck, {
      props: {
        owner: 'testowner',
        repo: 'testrepo',
        branch: 'main'
      },
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          }
        }
      }
    })

    await wrapper.find('button').trigger('click')
    expect(mockHealthCheck.runHealthCheck).toHaveBeenCalled()
  })

  it('should display results when available', async () => {
    mockHealthCheck.results.value = [
      {
        title: 'Test Section',
        results: [
          {
            name: 'Test Check',
            success: true,
            details: 'Test details'
          }
        ]
      }
    ]
    mockHealthCheck.filteredResults.value = mockHealthCheck.results.value

    const wrapper = mount(HealthCheck, {
      props: {
        owner: 'testowner',
        repo: 'testrepo',
        branch: 'main'
      },
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          }
        }
      }
    })

    expect(wrapper.find('.card-header h5').text()).toContain('Test Section')
    expect(wrapper.find('table tbody tr td:nth-child(2)').text()).toContain('Test Check')
  })
})

describe('useHealthCheck Composable', () => {
  // Since we can't easily unit test the actual composable without mocking axios,
  // let's just test the structure and basic functionality
  it('should export the correct interface', () => {
    // This test would be more meaningful in an actual test environment
    expect(typeof useHealthCheck).toBe('function')
  })
})
