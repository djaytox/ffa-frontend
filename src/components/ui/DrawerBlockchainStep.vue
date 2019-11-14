<template>
  <div class="drawer-blockchain-step">

    <DrawerMessage
      class="upcoming padded"
      v-if="showUpcoming">
      <div slot="messageSlot" class="icon-ethereum-step-dark drawer-message">
        {{ label }}
      </div>
    </DrawerMessage>

    <ProcessButton
      :buttonText="label"
      :clickable="true"
      :processing="false"
      :noToggle="true"
      :onClickCallback="onButtonClick"
      class="ready padded"
      v-if="showReady"/>

    <BlockchainExecutingMessage
      v-if="showProcessing"
      class="processing padded">
      <div slot="messageSlot" class="executing-message">
        {{ label }}
      </div>
    </BlockchainExecutingMessage>

    <DrawerMessage
      v-if="showCompleted"
      class="completed padded">
      <div slot="messageSlot" class="icon-check-dark drawer-message">
        {{ label }}
      </div>
    </DrawerMessage>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

import { DrawerBlockchainStepState } from '../../models/DrawerBlockchainStepState'

import { Labels } from '../../util/Constants'

import ProcessButton from '@/components/ui/ProcessButton.vue'
import BlockchainExecutingMessage from '../ui/BlockchainExecutingMessage.vue'
import DrawerMessage from '../ui/DrawerMessage.vue'

import '@/assets/style/ui/drawer-blockchain-step.sass'
import '@/assets/style/ui/drawer.sass'

@Component({
  components: {
    DrawerMessage,
    ProcessButton,
    BlockchainExecutingMessage,
  },
})
export default class DrawerBlockchainStep extends Vue {

  public get showUpcoming() {
    return this.state === DrawerBlockchainStepState.upcoming
  }

  public get showReady() {
    return this.state === DrawerBlockchainStepState.ready
  }

  public get showProcessing() {
    return this.state === DrawerBlockchainStepState.processing
  }

  public get showCompleted() {
    return this.state === DrawerBlockchainStepState.completed
  }

  @Prop()
  public state!: DrawerBlockchainStepState

  @Prop({ default: () => { return } })
  public onButtonClick!: () => void

  @Prop({ default: 'a step in the process' })
  public label!: string
}
</script>