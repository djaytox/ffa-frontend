<template>
  <div class="support-withdraw-card">
    <h2>{{ title }}</h2>
    <div class="swc-message">
      Withdraw support from the cooperative
    </div>
    <MarketTokenToEthereum
      :marketTokens="1.0"/>
    <div
      class="button"
      :disabled="disabled"
      @click="onButtonClick">
      {{ buttonText }}
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { getModule } from 'vuex-module-decorators'
import appStore from '../../store'
import AppModule from '../../vuexModules/AppModule'

import SupportWithdrawProcessModule from '../../functionModules/components/SupportWithdrawProcessModule'

import MarketTokenToEthereum from './MarketTokenToEthereum.vue'

import { Labels } from '../../util/Constants'

@Component({
  components: {
    MarketTokenToEthereum,
  },
})
export default class WithdrawFromCooperative extends Vue {

  public get marketTokens(): number {
    return 1.0
    // return SupportWithdrawProcessModule.weiToMarketTokens(
    //   getModule(AppModule, this.$store).marketTokenBalance,
    //   this.$store)
  }

  private get disabled(): any {
    return this.marketTokens === 0 ? 'disabled' : false
  }

  public title = Labels.WITHDRAW_FROM_COOPERATIVE
  public buttonText = Labels.START_WITHDRAWAL

  public onButtonClick() {
    this.$router.push('/support/withdraw')
  }
}
</script>
