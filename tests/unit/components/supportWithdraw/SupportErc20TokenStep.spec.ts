import { mount, createLocalVue, Wrapper } from '@vue/test-utils'

import { getModule } from 'vuex-module-decorators'
import appStore from '../../../../src/store'
import SupportWithdrawModule from '../../../../src/vuexModules/SupportWithdrawModule'

import EtherTokenContractModule from '../../../../src/functionModules/protocol/EtherTokenContractModule'

import { SupportStep } from '../../../../src/models/SupportStep'

import SupportErc20TokenStep from '@/components/supportWithdraw/SupportErc20TokenStep.vue'

describe('SupportErc20TokenStep.vue', () => {

  const processButtonClass = '.process-button'
  const buttonClass = '.button'

  const localVue = createLocalVue()

  let wrapper!: Wrapper<SupportErc20TokenStep>

  let supportWithdrawModule!: SupportWithdrawModule

  beforeAll(() => {
    supportWithdrawModule = getModule(SupportWithdrawModule, appStore)

    EtherTokenContractModule.deposit = jest.fn()
  })

  it('wraps ETH', () => {

    supportWithdrawModule.setSupportStep(SupportStep.WrapETH)

    wrapper = mount(SupportErc20TokenStep, {
      attachToDocument: true,
      store: appStore,
      localVue,
    })

    expect(wrapper.findAll(buttonClass).length).toBe(1)
    wrapper.find(`${processButtonClass} ${buttonClass}`).trigger('click')
    expect(EtherTokenContractModule.deposit).toHaveBeenCalled()

  })
})