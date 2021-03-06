<template>
  <section id='ffa-listed' class="candidate-listed-view-common">
    <RouterTabs
      class="details-tabs"
      :mapping="routerTabMapping"
      :selected="selectedTab"/>
    <div
      v-if="isReady"
      class="container" >
      <div class="banner"
        :class="bannerIconClass"
        v-if="isUnderChallenge">
        {{ bannerText }}
      </div>
      <!-- Listing -->
      <StaticFileMetadata
        v-show="selectedTab === listing"
        :ffaListing="ffaListing" />

      <button class="purchase-button button is-primary is-medium"
        v-if="enablePurchaseButton && !canDownload"
        v-show="selectedTab === listing"
        @click="onPurchaseClicked"
        :disabled="drawerButtonDisabled"
        data-purchase="true">Purchase</button>

      <button class="download-button button is-primary is-medium"
        v-if="canDownload"
        @click="onDownloadClicked"
        :disabled="drawerButtonDisabled"
        :class="{'is-loading': isDownloading}"
        data-delivery="true">Download</button>

      <!-- Details -->
      <h2 v-show="selectedTab === details" class="title">
        {{ listingTitle }}
      </h2>

      <VerticalSubway
        v-show="selectedTab === details"
        :listingHash="listingHash"
        :listingStatus="status"
        :isUnderChallenge="isUnderChallenge"
        :plurality="plurality"
        :voteBy="voteBy"
        :isVotingClosed="isVotingClosed"
        :hasJwt="hasJwt"
        :onPreviewButtonClicked="onPreviewButtonClicked"
        :onVoteButtonClicked="onVoteButtonClicked"
        :onResolveApplicationButtonClicked="onResolveApplicationButtonClicked"
        :onResolveChallengeButtonClicked="onResolveChallengeButtonClicked" />

      <button
        class="button challenge-button is-medium is-primary"
        v-show="selectedTab === details && !isUnderChallenge"
        @click="onChallengeClicked"
        :disabled="drawerButtonDisabled"
        data-challenge="true">Challenge listing
      </button>

      <button
        class="button challenge-button is-medium is-primary"
        v-show="selectedTab === details && !isUnderChallenge && hasStake"
        @click="onUnstakeButtonClicked"
        :disabled="drawerButtonDisabled"
        data-challenge="false">
          Unstake
      </button>
    </div>

    <EthereumLoader v-else />
  </section>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { NoCache } from 'vue-class-decorator'
import { MutationPayload } from 'vuex'

import { getModule } from 'vuex-module-decorators'
import FlashesModule from '../vuexModules/FlashesModule'
import NewListingModule from '../vuexModules/NewListingModule'
import UploadModule from '../vuexModules/UploadModule'
import FfaListingsModule from '../vuexModules/FfaListingsModule'
import AppModule from '../vuexModules/AppModule'
import VotingModule from '../vuexModules/VotingModule'
import PurchaseModule from '../vuexModules/PurchaseModule'
import ChallengeModule from '../vuexModules/ChallengeModule'
import DrawerModule, { DrawerState } from '../vuexModules/DrawerModule'

import SharedModule from '../functionModules/components/SharedModule'
import FfaListingViewModule from '../functionModules/views/FfaListingViewModule'
import VotingProcessModule from '../functionModules/components/VotingProcessModule'
import PurchaseProcessModule from '../functionModules/components/PurchaseProcessModule'
import DatatrustModule from '../functionModules/datatrust/DatatrustModule'
import EthereumModule from '../functionModules/ethereum/EthereumModule'
import VotingContractModule from '../functionModules/protocol/VotingContractModule'
import MetamaskModule from '../functionModules/metamask/MetamaskModule'

import { Eventable } from '../interfaces/Eventable'

import FfaListing, { FfaListingStatus } from '../models/FfaListing'
import Flash, {FlashType} from '../models/Flash'
import { ProcessStatus } from '../models/ProcessStatus'
import ContractAddresses from '../models/ContractAddresses'
import {
  OpenDrawer,
  CloseDrawer,
  DrawerClosed,
  CandidateForceUpdate,
  ChallengeResolved,
  Unstaked,
  MetamaskAccountChanged } from '../models/Events'
import RouterTabMapping from '../models/RouterTabMapping'
import { PurchaseStep } from '../models/PurchaseStep'
import { VotingActionStep } from '../models/VotingActionStep'

import { Errors, Labels, Messages, Routes } from '../util/Constants'

import VerticalSubway from '../components/voting/VerticalSubway.vue'
import StaticFileMetadata from '../components/ui/StaticFileMetadata.vue'
import EthereumLoader from '../components/ui/EthereumLoader.vue'
import RouterTabs from '../components/ui/RouterTabs.vue'
import FileUploader from '../components/listing/FileUploader.vue'
import Drawer from '../components/ui/Drawer.vue'

import Web3 from 'web3'
import uuid4 from 'uuid'
import FileSaver from 'file-saver'
import axios, { CancelTokenSource } from 'axios'

import '@/assets/style/views/ffa-listed-view.sass'

@Component({
  components: {
    StaticFileMetadata,
    EthereumLoader,
    FileUploader,
    RouterTabs,
    VerticalSubway,
  },
})
export default class FfaListedView extends Vue {

  public listing = Labels.LISTING
  public details = Labels.DETAILS
  public bannerText = Labels.LISTING_IS_BEING_CHALLENGED

  public routerTabMapping: RouterTabMapping[] = []
  public votingTimerId!: NodeJS.Timeout|undefined
  public statusVerified = false
  public authProcessId!: string
  public message!: string
  public deliveryPayload!: [Error?, any?]
  public unsubscribe!: () => void
  public cancelTokenSource!: CancelTokenSource

  public appModule = getModule(AppModule, this.$store)
  public flashesModule = getModule(FlashesModule, this.$store)
  public ffaListingsModule = getModule(FfaListingsModule, this.$store)
  public purchaseModule = getModule(PurchaseModule, this.$store)
  public votingModule = getModule(VotingModule, this.$store)
  public challengeModule = getModule(ChallengeModule, this.$store)
  public drawerModule = getModule(DrawerModule, this.$store)

  public dataFetched = false
  public isDownloading = false

  @Prop()
  public status?: FfaListingStatus

  @Prop()
  public listingHash?: string

  @Prop()
  public walletAddress?: string

  @Prop()
  public enablePurchaseButton!: boolean

  @Prop({ default: false })
  public requiresParameters?: boolean

  @Prop()
  public selectedTab?: string

  get bannerIconClass(): string {
    return 'challenge-icon'
  }

  get listed(): FfaListing {
    return this.ffaListingsModule.listed.find((l) => l.hash === this.listingHash)!
  }

  get isUnderChallenge(): boolean {
    return this.challengeModule.listingChallenged
  }

  get hasPurchased(): boolean {
    return false
  }

  get listingTitle(): string {
    return !!this.ffaListing ? this.ffaListing.title : ''
  }

  get plurality() {
    return this.appModule.plurality
  }

  get prerequisitesMet(): boolean {
    return SharedModule.isReady(this.requiresParameters!, this.$store)
  }

  get deliveryHash(): string {
    return DatatrustModule.generateDeliveryHash(
      this.listingHash!,
      this.$store,
    )
  }

  get isReady(): boolean {
    return this.prerequisitesMet && this.statusVerified && this.dataFetched
  }

  get ffaListing(): FfaListing|undefined {
    if (!this.status && !this.listingHash) {
      return undefined
    }
    return this.ffaListingsModule.listed.find((l) => l.hash === this.listingHash)
  }

  get canDownload(): boolean {
    return this.purchaseModule.purchaseStep === PurchaseStep.Complete
  }

  get hasStake(): boolean {
    return this.votingModule.staked > 0
  }

  get drawerButtonDisabled(): boolean {
    return this.drawerModule.status === DrawerState.processing
  }

  get hasJwt(): boolean {
    return this.appModule.hasJwt
  }

  @NoCache
  get voteBy(): number {
    return this.votingModule.voteBy
  }

  @NoCache
  get isVotingClosed(): boolean {
    if (!this.voteBy) { return true }
    return new Date().getTime() > this.voteBy
  }

  public async created(this: FfaListedView) {

    this.votingModule.reset()
    this.challengeModule.reset()

    if (!this.status || !this.listingHash) {
      console.log('no status or listingHash!')
      this.$router.replace('/')
    }
    this.routerTabMapping.push({
      route: {
        name: 'singleListed',
        params: {
          listingHash: this.listingHash!,
        },
      },
      label: this.listing,
    })
    this.routerTabMapping.push({
      route: {
        name: 'singleListedDetails',
        params: {
          listingHash: this.listingHash!,
        },
      },
      label: this.details,
    })
    this.$root.$on(DrawerClosed, this.onDrawerClosed)
    this.$root.$on(ChallengeResolved, this.postResolveChallenge)
    this.$root.$on(MetamaskAccountChanged, this.metamaskAccountChanged)
    this.unsubscribe = this.$store.subscribe(this.vuexSubscriptions)
  }

  public async mounted(this: FfaListedView) {

    if (this.$router.currentRoute.name === 'singleListed') {
      this.$root.$emit(CloseDrawer)
    }
    this.$root.$emit(CandidateForceUpdate)

    console.log('FfaListedView mounted')

    if (this.requiresParameters) {
      EthereumModule.setEthereumPriceAndParameters(this.$store)
    }
  }

  public beforeDestroy() {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel()
    }
    this.$root.$off(DrawerClosed, this.onDrawerClosed)
    this.$root.$off(ChallengeResolved, this.postResolveChallenge)
    this.$root.$off(Unstaked, this.postUnstake)
    this.$root.$off(MetamaskAccountChanged, this.metamaskAccountChanged)
    this.unsubscribe()
  }

  public async vuexSubscriptions(mutation: MutationPayload, state: any) {
    if (mutation.type !== 'eventModule/append') {
      switch (mutation.type) {
        case `appModule/setAppReady`:
          if (!!!mutation.payload) {
            return
          }

          if (!this.$router || !this.$router.currentRoute || !this.$router.currentRoute.name) {
            return
          }

          switch (this.$router.currentRoute.name) {
            case 'singleListed':
            case 'singleListedDetails':
            case 'singleListedPurchase':
            case 'singleListedChallenge':
            case 'singleListedVote':
            case 'singleListedResolve':
              break
            default:
              return
          }

          this.statusVerified = true

          await EthereumModule.getLastBlock(this.appModule)
          if (this.cancelTokenSource) {
            this.cancelTokenSource.cancel()
          }
          this.cancelTokenSource = axios.CancelToken.source()
          const listed = await DatatrustModule.getListed(this.listingHash!, this.cancelTokenSource.token)
          this.ffaListingsModule.addListed([listed!])

          this.purchaseModule.setListing(this.ffaListing!)

          await Promise.all([
            this.checkChallenged(),
            EthereumModule.getEtherTokenBalance(this.$store),
            EthereumModule.getEtherTokenContractAllowance(ContractAddresses.DatatrustAddress!, this.$store),
            EthereumModule.getMarketTokenBalance(this.$store),
            VotingProcessModule.updateStaked(this.listingHash!, this.$store),
            PurchaseProcessModule.checkListingPurchased(this.ffaListing!, this.$store),
            FfaListingViewModule.updatePurchaseCount(this.ffaListing!, this.$store),
          ])

          // Complete isReady
          this.dataFetched = true

          PurchaseProcessModule.updatePurchaseStep(this.$store)

          if (this.isUnderChallenge) {
            await VotingProcessModule.updateChallenged(this.listingHash!, this.$store)
            this.setVoteTimer()
          }

          return

        case 'challengeModule/setListingChallenged':
          // Challenge is a candidate
          if (mutation.payload === true) {
            await VotingProcessModule.updateChallenged(this.listingHash!, this.$store)
            if (this.isUnderChallenge) {
              this.setVoteTimer()
            }
          }
          this.$root.$emit(CandidateForceUpdate)
          return this.$forceUpdate()

        case 'ffaListingsModule/setListedDetails':
          this.$root.$emit(CandidateForceUpdate)
          return this.$forceUpdate()

        case 'purchaseModule/setPurchaseStep':
          if (mutation.payload !== PurchaseStep.Complete) {
            return
          }
          await FfaListingViewModule.updatePurchaseCount(this.ffaListing!, this.$store)

        default:
          return
      }
    }

    const event = mutation.payload as Eventable

    if (event.processId === this.authProcessId) {
      // If user signs with Metamask
      await this.authorizeAndFetchDelivery(event.response.result)
    }
  }

  public async checkChallenged() {
    const listingChallenged = await VotingContractModule.candidateIs(
      this.listingHash!,
      2, // challenge application
      ethereum.selectedAddress,
      this.appModule.web3,
    )
    this.challengeModule.setListingChallenged(listingChallenged)
  }

  public onPurchaseClicked() {
    this.drawerModule.setDrawerState(DrawerState.processing)
    this.pushNewRoute('singleListedPurchase')
  }

  public onChallengeClicked() {
    this.drawerModule.setDrawerState(DrawerState.processing)
    this.pushNewRoute('singleListedChallenge')
  }

  public onPreviewButtonClicked() {
    if (!this.appModule.canVote || !this.appModule.hasJwt) {
      return
    }

    this.drawerModule.setDrawerState(DrawerState.processing)
    FfaListingViewModule.fetchPreview(this.listingHash!, this.appModule.jwt)
  }

  public onVoteButtonClicked() {
    this.pushNewRoute('singleListedVote')
  }

  public onResolveChallengeButtonClicked() {
    this.drawerModule.setDrawerState(DrawerState.processing)
    this.votingModule.setResolveChallengeStatus(ProcessStatus.Ready)
    this.pushNewRoute('singleListedResolve')
  }

  public onResolveApplicationButtonClicked() {
    // do nothing
  }

  public onUnstakeButtonClicked() {
    this.drawerModule.setDrawerState(DrawerState.processing)
    this.pushNewRoute('singleListedUnstake')
  }

  public pushNewRoute(routeName: string) {
    const resolved = this.$router.resolve({
      name: routeName,
      params: {
        listingHash: this.listingHash!,
      },
    })
    if (this.$router.currentRoute.name === resolved.route.name) {
      return
    }
    this.$router.push(resolved.location)
  }

  public setVoteTimer() {
    const timeWait = this.voteBy - new Date().getTime()
    if (timeWait < 0) {
      return
    }
    console.log(`setting timer for ${timeWait}ms`)
    this.votingTimerId = setTimeout(() => { this.closeVoting() }, timeWait)
  }

  public async closeVoting() {
    this.votingModule.setVotingStep(VotingActionStep.Error)
    await VotingProcessModule.updateCandidateDetails(this.listingHash!, this.$store)
    this.$forceUpdate()
    this.$root.$emit(CandidateForceUpdate)
  }

  public async fetchDelivery() {
    try {
      const [error, response] = await DatatrustModule.getDelivery(
        this.deliveryHash,
        this.listingHash!,
        this.appModule.jwt,
      )

      const blob = new Blob([response.data], { type: response.headers['content-type'] })

      FileSaver.saveAs(blob, response.headers.filename)
    } catch (error) {
      console.log(error)
    } finally {
      this.isDownloading = false
    }
  }

  public async signAndRequestDelivery() {
    this.authProcessId = uuid4()
    this.message = `timestamp: ${new Date().getTime()}`
    MetamaskModule.sign(this.message, this.authProcessId, this.$store)
  }

  public async authorizeAndFetchDelivery(signature: string) {
    const checksumAddress = this.appModule.web3.utils.toChecksumAddress(ethereum.selectedAddress)
    const [error, jwt] = await DatatrustModule.authorize(this.message!, signature, checksumAddress)

    if (error) {
      this.isDownloading = false
      return this.flashesModule.append(new Flash(error.message, FlashType.error))
    }

    if (jwt) {
      this.appModule.setJwt(jwt!)
      await this.fetchDelivery()
    }
  }

  public async onDownloadClicked() {
    this.isDownloading = true
    !!this.appModule.jwt ? await this.fetchDelivery() : await this.signAndRequestDelivery()
  }

  public async postResolveChallenge() {
    const blockchainStatus = await FfaListingViewModule.fetchListingStatus(
      ethereum.selectedAddress, this.listingHash!, this.appModule)

    window.location.reload()

    // switch (blockchainStatus) {
    //   case FfaListingStatus.new:
    //     // challege rejected the listing
    //     this.$root.$off(DrawerClosed, this.onDrawerClosed)
    //     this.$root.$off(ChallengeResolved, this.postResolveChallenge)
    //     this.unsubscribe()
    //     this.ffaListingsModule.removeFromListed(this.listingHash!)
    //     return this.$router.push({
    //       name: 'allListings',
    //     })

    //   case FfaListingStatus.listed:
    //     this.$forceUpdate()
    //     this.$root.$emit(CandidateForceUpdate)

    //   default:
    //     // this is an error case
    //     // TODO: handle?
    // }
  }

  public postUnstake() {
    // TODO: ?
  }

  private onDrawerClosed() {
    if (!this.$router.currentRoute.name!.startsWith('singleListed')) {
      return
    }
    let routeName: string
    switch (this.$router.currentRoute.name) {
      case 'singleListedChallenge':
      case 'singleListedVote':
      case 'singleListedResolve':
      case 'singleListedUnstake':
        routeName = 'singleListedDetails'
        break
      case 'singleListedPurchase':
        routeName = 'singleListed'
        break
      default:
        return
    }

    this.pushNewRoute(routeName)
  }

  private async metamaskAccountChanged() {
    if (EthereumModule.ethereumDisabled()) { getModule(AppModule, this.$store).reset() }

    if (SharedModule.isAuthenticated()) {
      await EthereumModule.setEthereumPriceAndParameters(this.$store)
      this.$forceUpdate()
    }
  }
}
</script>
