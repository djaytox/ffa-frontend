import { mount, createLocalVue, Wrapper } from '@vue/test-utils'

import appStore from '../../../../src/store'

import SupportCooperative from '@/components/support/SupportCooperative.vue'

describe('SupportCooperative.vue', () => {

  const titleClass = '.title'
  const ethereumToMarketTokenClass = '.ethereum-to-market-token'
  const buttonClass = '.button'

  const localVue = createLocalVue()

  let wrapper!: Wrapper<SupportCooperative>

  afterEach(() => {
    if (wrapper !== undefined) {
      wrapper.destroy()
    }
  })

  it('renders title, ethereumToMarketToken, and button', () => {
    wrapper = mount(SupportCooperative, {
      attachToDocument: true,
      store: appStore,
      localVue,
    })

    expect(wrapper.find(titleClass)).toBeDefined()
    expect(wrapper.find(titleClass).text().length).toBeGreaterThan(0)
    expect(wrapper.find(ethereumToMarketTokenClass)).toBeDefined()
    expect(wrapper.find(buttonClass)).toBeDefined()
  })
})
