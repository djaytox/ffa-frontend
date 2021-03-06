<template>
  <div>
    <SubwayItem :isIconTop="true">
      {{ fileUploaded }}
    </SubwayItem>

    <SubwayItem :isIconTop="true">
      {{ submittedToCooperative }}
    </SubwayItem>

    <SubwayItem :isIconTop="true">
      {{ votingStarted }}
    </SubwayItem>

    <VotingDetails
      :titleString="candidateTitle"
      :resolved="isListed"
      :resolvesChallenge="false"
      :listingHash="listingHash"
      :listingStatus="listingStatus"
      :yeaVotes="yeaVotes"
      :nayVotes="nayVotes"
      :voteBy="voteBy"
      :plurality="plurality"
      :isVotingClosed="isVotingClosed"
      :hasJwt="hasJwt"
      :onPreviewButtonClicked="onPreviewButtonClicked"
      :onVoteButtonClicked="onVoteButtonClicked"
      :onResolveApplicationButtonClicked="onResolveApplicationButtonClicked" />

    <SubwayItem
      v-show="isVotingClosed"
      :isIconTop="false">
      {{ votingEnded }}
    </SubwayItem>

    <SubwayItem
      class="subway-result-message"
      v-show="isVotingClosed"
      :isIconTop="false"
      data-vote-result="result">
      {{ listingResult }}
    </SubwayItem>

    <!-- Challenge info -->
    <SubwayItem
      v-if="isUnderChallenge"
      :isIconTop="true"
      :linesOnTopAndBottom="true">
      {{ listingWasChallenged }}
    </SubwayItem>
    <VotingDetails
      v-if="isUnderChallenge"
      :titleString="challengeTitle"
      :resolved="!isUnderChallenge"
      :resolvesChallenge="true"
      :listingHash="listingHash"
      :listingStatus="listingStatus"
      :yeaVotes="yeaVotes"
      :nayVotes="nayVotes"
      :voteBy="voteBy"
      :plurality="plurality"
      :isVotingClosed="isVotingClosed"
      :hasJwt="hasJwt"
      :onPreviewButtonClicked="onPreviewButtonClicked"
      :onVoteButtonClicked="onVoteButtonClicked"
      :onResolveApplicationButtonClicked="onResolveApplicationButtonClicked"
      :onResolveChallengeButtonClicked="onResolveChallengeButtonClicked" />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch} from 'vue-property-decorator'
import { getModule } from 'vuex-module-decorators'
import { MutationPayload } from 'vuex'

import DateFormat from 'dateformat'

import AppModule from '../../vuexModules/AppModule'
import VotingModule from '../../vuexModules/VotingModule'
import ChallengeModule from '../../vuexModules/ChallengeModule'

import FfaListingViewModule from '../../functionModules/views/FfaListingViewModule'
import VotingContractModule from '../../functionModules/protocol/VotingContractModule'

import FfaListing, { FfaListingStatus } from '../../models/FfaListing'

import VotingDetails from './VotingDetails.vue'
import SubwayItem from './SubwayItem.vue'

import { Labels } from '../../util/Constants'

@Component({
  components: {
    VotingDetails,
    SubwayItem,
  },
})
export default class VerticalSubway extends Vue {

  public fileUploaded = Labels.FILE_UPLOADED
  public submittedToCooperative = Labels.SUBMITTED_TO_COORPERATIVE
  public votingStarted = Labels.VOTING_STARTED
  public votingEnded = Labels.VOTING_ENDED
  public listingWasChallenged = Labels.LISTING_WAS_CHALLENGED

  public appModule = getModule(AppModule, this.$store)
  public challengeModule = getModule(ChallengeModule, this.$store)
  public votingModule = getModule(VotingModule, this.$store)

  public listing!: FfaListing

  @Prop()
  public plurality!: number

  @Prop()
  public listingHash!: string

  @Prop()
  public listingStatus!: FfaListingStatus

  @Prop()
  public isUnderChallenge!: boolean

  @Prop()
  public isVotingClosed!: boolean

  @Prop()
  public onPreviewButtonClicked!: () => void

  @Prop()
  public onVoteButtonClicked!: () => void

  @Prop()
  public onResolveApplicationButtonClicked!: () => void

  @Prop()
  public onResolveChallengeButtonClicked!: () => void

  @Prop()
  public voteBy!: number

  @Prop()
  public hasJwt!: boolean

  get challengeTitle(): string {
    return Labels.CHALLENGE_VOTING_CARD_TITLE
  }

  get candidateTitle(): string {
    return Labels.NEW_CANDIDATE_VOTING_CARD_TITLE
  }

  get isListed(): boolean {
    return this.listingStatus === FfaListingStatus.listed
  }

  get shareDate(): number {
    return !!this.listing ? this.listing.shareDate : 0
  }

  get yeaVotes(): number {
    return this.votingModule.yeaVotes
  }

  get nayVotes(): number {
    return this.votingModule.nayVotes
  }

  get listingResult(): string {
    if (!!this.isListed) {this.votingModule.setListingDidPass(true)}
    return (this.votingModule.listingDidPass) ? Labels.SUBWAY_LISTED : Labels.SUBWAY_REJECTED
  }

  get voteByText(): string {
    return `${Labels.VOTING_BY_COMMUNITY_CLOSED} ${DateFormat(new Date(this.voteBy))}`
  }

  protected async created() {
    this.votingModule.setListingDidPass(await this.listingDidPass())
  }

  protected async listingDidPass(): Promise<boolean> {
    if (!!this.isListed) { return true }

    const voting = await VotingContractModule.getVoting(
      ethereum.selectedAddress,
      this.appModule.web3,
    )

    const pollClosed = await voting.deployed!.methods.pollClosed(this.listingHash).call()

    if (pollClosed) {
      return await VotingContractModule.didPass(
        this.listingHash,
        this.appModule.plurality,
        ethereum.selectedAddress,
        this.appModule.web3,
      )
    }

    return true
  }
}
</script>
