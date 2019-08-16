import VueRouter from 'vue-router'
import { shallowMount, createLocalVue, mount } from '@vue/test-utils'
import StartListingButton from '../../../../src/components/listing/StartListingButton.vue'
import appStore from '../../../../src/store'

const localVue = createLocalVue()
const buttonClass = 'button'

describe('StartListingButton.vue', () => {

  beforeAll(() => {
    localVue.use(VueRouter)
  })

  it('renders the start listing button', () => {
    const wrapper = shallowMount(StartListingButton, {
      attachToDocument: true,
      store: appStore,
      localVue,
    })
    expect(wrapper.findAll(`.${buttonClass}`).length).toBe(1)
  })
})