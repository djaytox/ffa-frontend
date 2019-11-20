
import { Store } from 'vuex'
import { getModule } from 'vuex-module-decorators'
import appStore from '../../../../src/store'

import NewListingModule from '../../../../src/vuexModules/NewListingModule'
import DatatrustTaskModule from '../../../../src/vuexModules/DatatrustTaskModule'
import FfaListingsModule from '../../../../src/vuexModules/FfaListingsModule'
import VotingModule from '../../../../src/vuexModules/VotingModule'
import EventModule from '../../../../src/vuexModules/EventModule'
import PurchaseModule from '../../../../src/vuexModules/PurchaseModule'
import SupportWithdrawModule from '../../../../src/vuexModules/SupportWithdrawModule'
import ChallengeModule from '../../../../src/vuexModules/ChallengeModule'
import UploadModule from '../../../../src/vuexModules/UploadModule'

import EventableModule from '../../../../src/functionModules/eventable/EventableModule'
import EthereumModule from '../../../../src/functionModules/ethereum/EthereumModule'
import PurchaseProcessModule from '../../../../src/functionModules/components/PurchaseProcessModule'
import VotingProcessModule from '../../../../src/functionModules/components/VotingProcessModule'

import ContractAddresses from '../../../../src/models/ContractAddresses'
import DatatrustTask from '../../../../src/models/DatatrustTask'
import DatatrustTaskDetails, { FfaDatatrustTaskType } from '../../../../src/models/DatatrustTaskDetails'
import { SupportStep } from '../../../../src/models/SupportStep'
import { WithdrawStep } from '../../../../src/models/WithdrawStep'
import { ProcessStatus } from '../../../../src/models/ProcessStatus'
import { VotingActionStep } from '../../../../src/models/VotingActionStep'
import { PurchaseStep } from '../../../../src/models/PurchaseStep'

import TaskPollerManagerModule from '../../../../src/functionModules/components/TaskPollerManagerModule'

import flushPromises from 'flush-promises'

describe('TaskpollerManagerModule.ts', () => {

  const newListingModule = getModule(NewListingModule, appStore)
  const datataskModule = getModule(DatatrustTaskModule, appStore)
  const ffaListingsModule = getModule(FfaListingsModule, appStore)
  const votingModule = getModule(VotingModule, appStore)
  const purchaseModule = getModule(PurchaseModule, appStore)
  const eventModule = getModule(EventModule, appStore)
  const supportWithdrawModule = getModule(SupportWithdrawModule, appStore)
  const challengeModule = getModule(ChallengeModule, appStore)
  const uploadModule = getModule(UploadModule, appStore)

  const spy1 = jest.fn()
  const spy2 = jest.fn()
  const spy3 = jest.fn()
  const spy4 = jest.fn()
  const spy5 = jest.fn()
  const spy6 = jest.fn()
  const spy7 = jest.fn()
  const spy8 = jest.fn()
  const spy9 = jest.fn()
  const spy10 = jest.fn()
  const spy11 = jest.fn()
  const spy12 = jest.fn()
  const spy13 = jest.fn()

  beforeAll(() => {
    datataskModule.completeTask = spy1
    ffaListingsModule.promotePending = spy2
    eventModule.append = spy3
    VotingProcessModule.updateStaked = spy4
    EthereumModule.getMarketTokenBalance = spy5
    VotingProcessModule.updateCandidateDetails = spy6
    VotingProcessModule.updateChallenged = spy7
    PurchaseProcessModule.checkEtherTokenBalance = spy8
    PurchaseProcessModule.checkEtherTokenDatatrustContractAllowance = spy9
    EthereumModule.getEthereumBalance = spy10
    EthereumModule.getEtherTokenBalance = spy11
    EthereumModule.getEtherTokenContractAllowance = spy12
    supportWithdrawModule.removeCollectIncomeTransactionId = spy13
  })

  describe('create new listing', () => {
    it ('processes new listings', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.createListing))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(newListingModule.status).toBe(ProcessStatus.Complete)
      expect(uploadModule.status).toBe(ProcessStatus.Ready)
      expect(spy2).toBeCalled()
    })

    it ('processes new listings', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.createListing))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(newListingModule.status).toBe(ProcessStatus.Complete)
    })
  })

  describe('vote', () => {
    it ('approves spending for voting', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.voteApproveSpending))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(votingModule.votingStep).toBe(VotingActionStep.VotingAction)
    })

    it ('votes', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.voteListing))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy4).toBeCalled()
      expect(spy5).toBeCalled()
      expect(spy6).toBeCalled()
      console.log(`===> ${votingModule.votingStep}`)
      expect(votingModule.status).toBe(ProcessStatus.Ready)
      expect(votingModule.votingStep).toBe(VotingActionStep.ApproveSpending)
    })

    it ('resolves', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.resolveApplication))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(votingModule.resolveApplicationStatus).toBe(ProcessStatus.Complete)
    })
  })

  describe('challenge', () => {
    it ('approves spending', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.challengeApproveSpending))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(votingModule.resolveApplicationStatus).toBe(ProcessStatus.Complete)
    })

    it('challenges', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.challengeListing))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy4).toBeCalled()
      expect(spy5).toBeCalled()
      expect(spy7).toBeCalled()
      expect(challengeModule.challengeStep).toBe(VotingActionStep.Complete)
    })

    it('resolves', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.resolveChallenge))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy4).toBeCalled()
      expect(spy5).toBeCalled()
      expect(spy7).toBeCalled()
      expect(votingModule.resolveChallengeStatus).toBe(ProcessStatus.Complete)
      expect(challengeModule.listingChallenged).toBeFalsy()
    })

    it('unstakes', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.unstake))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy4).toBeCalled()
      expect(spy5).toBeCalled()
      expect(votingModule.unstakeStatus).toBe(ProcessStatus.Complete)
    })
  })

  describe('purchase', () => {
    it ('wraps eth', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.wrapETH))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy8).toBeCalled()
      expect(purchaseModule.purchaseStep).toBe(PurchaseStep.ApproveSpending)
    })

    it ('approves spending', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.approveCET))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy9).toBeCalled()
      expect(purchaseModule.purchaseStep).toBe(PurchaseStep.PurchaseListing)
    })

    it ('purchases', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.buyListing))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(purchaseModule.purchaseStep).toBe(PurchaseStep.Complete)
    })
  })

  describe('support', () => {
    it ('wrap eth', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.supportWrapETH))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy10).toBeCalled()
      expect(spy11).toBeCalled()
      expect(spy12).toBeCalled()
      expect(supportWithdrawModule.supportStep).toBe(SupportStep.ApproveSpending)
    })

    it ('approves spending', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.supportApproveSpending))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy11).toBeCalled()
      expect(spy12).toBeCalled()
      expect(supportWithdrawModule.supportStep).toBe(SupportStep.Support)
    })

    it ('supports', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.support))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy10).toBeCalled()
      expect(spy11).toBeCalled()
      expect(spy12).toBeCalled()
      expect(spy5).toBeCalled()
      expect(supportWithdrawModule.supportStep).toBe(SupportStep.Complete)
    })
  })

  describe('withdraw', () => {
    it ('collect income', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.collectIncome))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy5).toBeCalled()
      expect(spy13).toBeCalled()
    })

    it ('withdraws', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.withdraw))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy5).toBeCalled()
      expect(spy8).toBeCalled()
      expect(supportWithdrawModule.withdrawStep).toBe(WithdrawStep.UnwrapWETH)
    })

    it ('unwraps eth', async () => {
      const task = new DatatrustTask(
        'key',
        new DatatrustTaskDetails('hash', FfaDatatrustTaskType.unwrapWETH))
      TaskPollerManagerModule.completeTask(task, appStore)
      await flushPromises()
      expect(spy1).toBeCalled()
      expect(spy10).toBeCalled()
      expect(spy11).toBeCalled()
      expect(spy8).toBeCalled()
      expect(spy5).toBeCalled()
      expect(supportWithdrawModule.withdrawStep).toBe(WithdrawStep.Complete)
    })
  })
})
