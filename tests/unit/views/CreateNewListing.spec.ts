import { mount, createLocalVue, Wrapper } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { router } from '../../../src/router'

import { getModule } from 'vuex-module-decorators'
import appStore from '../../../src/store'
import UploadModule from '../../../src/vuexModules/UploadModule'
import DrawerModule, {DrawerState } from '../../../src/vuexModules/DrawerModule'
import NewListingModule from '../../../src/vuexModules/NewListingModule'
import AppModule from '../../../src/vuexModules/AppModule'

import { ProcessStatus } from '../../../src/models/ProcessStatus'

import CreateNewListing from '@/views/CreateNewListing.vue'
import FileUploader from '@/components/listing/FileUploader.vue'

import MetamaskModule from '../../../src/functionModules/metamask/MetamaskModule'
import EthereumModule from '../../../src/functionModules/ethereum/EthereumModule'

import Servers from '../../../src/util/Servers'
import FileHelper from '../../../src/util/FileHelper'

import web3 from 'web3'

const localVue = createLocalVue()
const createNewListingId = 'create-new-listing'
const ethereumLoaderId = 'ethereum-loader'
const fileUploaderClass = 'file-uploader'
const fileMetadataComponentName = 'FileMetadata'
const buttonClass = 'button'

const emptyBlob = new Array<Blob>()
const emptyMp3File = new File(emptyBlob, 'Empty.mp3', { type: 'audio/mp3' })

let appModule!: AppModule

describe('CreateNewListing.vue', () => {

  const fakeRealAddress = '0x2C10c931FEbe8CA490A0Da3F7F78D463550CB048'

  const w3 = new web3(Servers.EthereumJsonRpcProvider!)
  const gethProvider = w3.currentProvider

  let wrapper: Wrapper<CreateNewListing>

  beforeAll(() => {
    localVue.use(VueRouter)
    localVue.component('FileUploader', FileUploader)

    appModule = getModule(AppModule, appStore)
    appModule.initializeWeb3(Servers.EthereumJsonRpcProvider!)

    MetamaskModule.enable = (): Promise<string|Error> => {
      return Promise.resolve('foo')
    }
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders the CreateNewListing view', () => {
    appModule.setAppReady(true)
    wrapper = mount(CreateNewListing, {
      attachToDocument: true,
      store: appStore,
      localVue,
      router,
    })
    expect(wrapper.findAll(`section#${createNewListingId}`).length).toBe(1)
    expect(wrapper.findAll(`.${fileUploaderClass}`).length).toBe(1)
  })

  it('renders renders the loader', () => {
    appModule.setAppReady(false)
    wrapper = mount(CreateNewListing, {
      attachToDocument: true,
      store: appStore,
      localVue,
      router,
      propsData: {
        requiresMetamask: true,
      },
    })
    // expect(wrapper.findAll(`#${ethereumLoaderId}`).length).toBe(1)
    appModule.initializeWeb3(Servers.EthereumJsonRpcProvider!)
  })

  it('renders renders the page', () => {
    appModule.setAppReady(true)

    wrapper = mount(CreateNewListing, {
      attachToDocument: true,
      store: appStore,
      localVue,
      router,
      propsData: {
        requiresMetamask: true,
      },
    })
    expect(wrapper.findAll(`#${ethereumLoaderId}`).length).toBe(0)
    expect(wrapper.findAll(`.${fileUploaderClass}`).length).toBe(1)
    expect(wrapper.findAll({ name: fileMetadataComponentName }).length).toBe(0)

    appModule.disconnectWeb3()
  })

  it('renders the metadata component once a file is added', () => {
    appModule.setAppReady(true)
    appModule.initializeWeb3(gethProvider)
    wrapper = mount(CreateNewListing, {
      attachToDocument: true,
      store: appStore,
      localVue,
      router,
      propsData: {
        requiresMetamask: true,
      },
    })

    const uploadModule = getModule(UploadModule, appStore)
    uploadModule.prepare(emptyMp3File)
    uploadModule.setStatus(ProcessStatus.Ready)

    expect(wrapper.findAll(`#${ethereumLoaderId}`).length).toBe(0)
    expect(wrapper.findAll(`.${fileUploaderClass}`).length).toBe(1)
    expect(wrapper.findAll({ name: fileMetadataComponentName }).length).toBe(1)

    appModule.disconnectWeb3()
  })

  // it('renders the List button once a title and description are added', () => {
  //   appModule.setAppReady(true)
  //   appModule.initializeWeb3(gethProvider)
  //   wrapper = mount(CreateNewListing, {
  //     attachToDocument: true,
  //     store: appStore,
  //     localVue,
  //     router,
  //     propsData: {
  //       requiresMetamask: true,
  //     },
  //   })

  //   const uploadModule = getModule(UploadModule, appStore)
  //   expect(wrapper.findAll(`.${buttonClass}`).length).toBe(1)
  //   expect(wrapper.find(`.${buttonClass}`).attributes()).toHaveProperty('disabled')
  //   uploadModule.setTitle('title')
  //   uploadModule.setDescription('description')
  //   expect(wrapper.find(`.${buttonClass}`).attributes()).not.toHaveProperty('disabled')

  //   wrapper.find(`.${buttonClass}`).trigger('click')
  //   expect(wrapper.find(`.${buttonClass}`).attributes()).toHaveProperty('disabled')
  // })

  // it('renders form read only once drawer is open', () => {
  // wrapper = mount(CreateNewListing, {
  //   attachToDocument: true,
  //   store: appStore,
  //   localVue,
  //   router,
  //   propsData: {
  //     requiresMetamask: true,
  //   },
  // })

  // const drawerState = getModule(DrawerModule, appStore)
  // // mock close the drawer
  // drawerState.setDrawerState(DrawerState.beforeProcessing)

  // expect(wrapper.find({ name: 'FileMetadata' }).vm.$props.viewOnly).toBe(false)

  // drawerState.setDrawerState(DrawerState.processing)
  // expect(wrapper.find({ name: 'FileMetadata' }).vm.$props.viewOnly).toBe(true)
  // })
})
