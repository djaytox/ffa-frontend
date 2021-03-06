<template>
  <div class="support-process">
    <SupportProcessComplete
      :marketTokens="marketTokens"
      v-if="isComplete"/>
    <div v-else>
      <EthereumToMarketToken
        class="ethereum-to-market-token"
        :ethEditable="ethEditable"
        :onEthChange="onEthValueChanged"/>
      <div
        class="error-message-container"
        v-if="hasError">
        <span class="error-message">
          {{ errorMessage }}
        </span>
      </div>
      <div class="status-container">
        <SupportErc20TokenStep
          :ethValue="ethValue"
          :onButtonClick="onButtonClick"/>
        <SupportApproveSpendingStep
          :ethValue="ethValue"
          :onButtonClick="onButtonClick"/>
        <SupportCooperativeStep
          :ethValue="ethValue"
          :onButtonClick="onButtonClick"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { NoCache } from 'vue-class-decorator'
import { MutationPayload } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import appStore from '../../store'
import AppModule from '../../vuexModules/AppModule'
import SupportWithdrawModule from '../../vuexModules/SupportWithdrawModule'
import DrawerModule from '../../vuexModules/DrawerModule'

import SupportWithdrawProcessModule from '../../functionModules/components/SupportWithdrawProcessModule'
import TaskPollerModule from '../../functionModules/task/TaskPollerModule'

import { Eventable } from '../../interfaces/Eventable'

import { SupportStep } from '../../models/SupportStep'

import EthereumToMarketToken from './EthereumToMarketToken.vue'
import SupportErc20TokenStep from './SupportErc20TokenStep.vue'
import SupportApproveSpendingStep from './SupportApproveSpendingStep.vue'
import SupportCooperativeStep from './SupportCooperativeStep.vue'
import SupportProcessComplete from './SupportProcessComplete.vue'

import { Labels } from '../../util/Constants'
import { FfaDatatrustTaskType } from '../../models/DatatrustTaskDetails'

import '@/assets/style/components/support-process.sass'


@Component({
  components: {
    EthereumToMarketToken,
    SupportErc20TokenStep,
    SupportApproveSpendingStep,
    SupportCooperativeStep,
    SupportProcessComplete,
  },
})
export default class SupportProcess extends Vue {

  public get isComplete(): boolean {
    return getModule(SupportWithdrawModule, this.$store).supportStep === SupportStep.Complete
  }

  @NoCache
  public get hasError(): boolean {
    return this.supportWithdrawModule.supportStep === SupportStep.Error ||
      this.supportWithdrawModule.supportStep === SupportStep.InsufficientETH
   }

  @NoCache
  public get marketTokens(): number {
    return SupportWithdrawProcessModule.supportValueToMarketTokens(this.$store)
  }

  public get ethEditable(): boolean {

    if (this.buttonClicked === true) {
      return false
    }

    switch (this.supportWithdrawModule.supportStep) {
      case SupportStep.InsufficientETH:
      case SupportStep.WrapETH:
      case SupportStep.ApproveSpending:
      case SupportStep.Support:
        return true

      default:
        return false
    }
  }

  public buttonClicked = false
  public ethValue = 0
  public unsubscribe!: () => void
  protected errorMessage!: string
  protected supportWithdrawModule = getModule(SupportWithdrawModule, this.$store)

  public mounted() {
    console.log('SupportProcess mounted')
  }

  public onEthValueChanged(value: number) {
    this.ethValue = value
    const appModule = getModule(AppModule, this.$store)

    if (SupportWithdrawProcessModule.hasEnoughEth(this.ethValue, this.$store)) {
      this.errorMessage = ''
      this.supportWithdrawModule.setSupportStep(SupportStep.WrapETH)

      const wei = appModule.web3.utils.toWei(this.ethValue.toString())
      this.supportWithdrawModule.setSupportValue(Number(wei))

      if (this.supportWithdrawModule.supportValue > 0 &&
        SupportWithdrawProcessModule.hasEnoughWeth(this.$store)) {

        this.supportWithdrawModule.setSupportStep(SupportStep.ApproveSpending)

        if (SupportWithdrawProcessModule.hasEnoughReserveApproval(this.$store)) {
          this.supportWithdrawModule.setSupportStep(SupportStep.Support)
        }
      }

    } else {

      this.errorMessage = `ETH ${this.ethValue} is more than your balance`
      this.supportWithdrawModule.setSupportStep(SupportStep.InsufficientETH)
    }
  }

  public onButtonClick() {
    this.buttonClicked = true
  }
}
</script>