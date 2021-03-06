import {
  Module,
  VuexModule,
  Mutation} from 'vuex-module-decorators'

import FfaProcessModule from '../interfaces/vuex/FfaProcessModule'
import { ProcessStatus } from '../models/ProcessStatus'

import FfaListing, { FfaListingStatus } from '../models/FfaListing'
import { VotingActionStep } from '../../src/models/VotingActionStep'

const emptyListing = new FfaListing(
  '',
  '',
  '',
  '',
  '',
  '',
  0,
  '',
  [],
  FfaListingStatus.new,
  0,
  0,
)

@Module({ namespaced: true, name: 'challengeModule' })
export default class ChallengeModule extends VuexModule implements FfaProcessModule {

  public namespace = 'challengeModule'
  public status = ProcessStatus.NotReady
  public listing = emptyListing
  public candidate = emptyListing
  public percentComplete = 0
  public challengeStep = VotingActionStep.ApproveSpending
  public listingChallenged = false
  public challengeMinedProcessId = ''

  @Mutation
  public reset() {
    this.listing = emptyListing
    this.status = ProcessStatus.NotReady
    this.challengeStep = VotingActionStep.ApproveSpending
    this.percentComplete = 0
    this.challengeMinedProcessId = ''
    this.listingChallenged = false
  }

  @Mutation
  public prepare(listing: FfaListing) {
    this.listing = listing
  }

  @Mutation
  public setListingChallenged(listingChallenged: boolean) {
    this.listingChallenged = listingChallenged
  }

  @Mutation
  public setPercentComplete(percentComplete: number) {
    this.percentComplete = percentComplete
  }

  @Mutation
  public setStatus(status: ProcessStatus) {
    this.status = status
  }

  @Mutation
  public setChallengeStep(challengeStep: VotingActionStep) {
    this.challengeStep = challengeStep
  }

  @Mutation
  public setChallengeMinedProcessId(processId: string) {
    this.challengeMinedProcessId = processId
  }
}
