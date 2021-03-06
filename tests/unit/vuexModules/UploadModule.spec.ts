import { shallowMount } from '@vue/test-utils'
// import List from '@/views/List.vue' // TODO: fix vs code lint issue here
import { getModule } from 'vuex-module-decorators'
import UploadModule from '../../../src/vuexModules/UploadModule'
import AppModule from '../../../src/vuexModules/AppModule'
import appStore from '../../../src/store'
import FfaProcessModule from '../../../src/interfaces/vuex/FfaProcessModule'
import { ProcessStatus } from '../../../src/models/ProcessStatus'
import FileHelper from '../../../src/util/FileHelper'
import Web3 from 'web3'
import FfaListing, { FfaListingStatus } from '../../../src/models/FfaListing'

describe('UploadModule.ts', () => {

  const web3 = new Web3('http://localhost:8545')
  let appModule!: AppModule

  beforeAll(() => {
    appModule = getModule(AppModule, appStore)
    appModule.initializeWeb3(web3)
  })

  it('correctly implements the correct interface', () => {
    const uploadModule = getModule(UploadModule, appStore)
    expect((uploadModule as FfaProcessModule).prepare).not.toBeNull()
    expect((uploadModule as FfaProcessModule).namespace).not.toBeNull()
    expect((uploadModule as FfaProcessModule).percentComplete).not.toBeNull()
    expect((uploadModule as FfaProcessModule).status).not.toBeNull()
  })

  it('correctly initializes and exposes properties', () => {
    const uploadModule = getModule(UploadModule, appStore)
    expect(uploadModule).not.toBeNull()
    expect(uploadModule.file).not.toBeNull()
    expect(uploadModule.file.name).toBe(FileHelper.EmptyFile.name)
    expect(uploadModule.file.size).toBe(0)
    expect(uploadModule.status).not.toBeNull()
    expect(uploadModule.status).toBe(ProcessStatus.NotReady)
    expect(uploadModule.percentComplete).not.toBeNull()
    expect(uploadModule.percentComplete).toBe(0)
    expect(uploadModule.filename).not.toBeNull()
    expect(uploadModule.filename).toEqual('')
    expect(uploadModule.title).not.toBeNull()
    expect(uploadModule.title).toEqual('')
    expect(uploadModule.description).not.toBeNull()
    expect(uploadModule.description).toEqual('')
    expect(uploadModule.tags).not.toBeNull()
    expect(uploadModule.tags).toEqual([])
    expect(uploadModule.md5).not.toBeNull()
    expect(uploadModule.md5).toEqual('')
    expect(uploadModule.datatrustTaskId).not.toBeNull()
    expect(uploadModule.datatrustTaskId.length).toBe(0)
    expect(uploadModule.datatrustStatus).toBe(ProcessStatus.NotReady)
  })

  it ('correctly exposes getters', () => {
    const uploadModule = getModule(UploadModule, appStore)
    expect(uploadModule.namespace).not.toBeNull()
    expect(uploadModule.namespace).toEqual('uploadModule')
    expect(uploadModule.hasFile).not.toBeNull()
    expect(uploadModule.fileSizeFormatted).not.toBeNull()
    expect(uploadModule.fileSizeFormatted).toEqual('0 bytes')
    expect(uploadModule.mimeTypeIcon).not.toBeNull()
    expect(uploadModule.mimeTypeIcon).toEqual(FileHelper.FileIcon)
    expect(uploadModule.hash).toEqual('')
    expect(uploadModule.ffaListing).not.toBeNull()
  })

  it ('correctly exposes mutators', () => {
    const uploadModule = getModule(UploadModule, appStore)
    expect(uploadModule.reset).not.toBeNull()
    expect(uploadModule.prepare).not.toBeNull()
    expect(uploadModule.setFilename).not.toBeNull()
    expect(uploadModule.setTitle).not.toBeNull()
    expect(uploadModule.setDescription).not.toBeNull()
    expect(uploadModule.setPercentComplete).not.toBeNull()
    expect(uploadModule.addTag).not.toBeNull()
    expect(uploadModule.removeTag).not.toBeNull()
    expect(uploadModule.setMd5).not.toBeNull()
    expect(uploadModule.setStatus).not.toBeNull()
    expect(uploadModule.nextStatus).not.toBeNull()
  })

  it ('correctly mutates state', () => {
    const uploadModule = getModule(UploadModule, appStore)
    expect(uploadModule.hasFile).toBeFalsy()
    uploadModule.prepare(FileHelper.SpecFile)
    expect(uploadModule.hasFile).toBeTruthy()
    expect(uploadModule.file.size).toBe(0)
    expect(uploadModule.filename).toEqual('A Dummy Empty File For Specs.doc')
    uploadModule.setFilename('foo')
    expect(uploadModule.filename).toEqual('foo')
    uploadModule.setTitle('Spec file')
    expect(uploadModule.title).toEqual('Spec file')
    uploadModule.setDescription('description')
    expect(uploadModule.description).toEqual('description')
    expect(uploadModule.tags.length).toBe(0)
    uploadModule.addTag('tag')
    expect(uploadModule.tags.length).toBe(1)
    expect(uploadModule.tags.indexOf('tag')).toBe(0)
    uploadModule.removeTag('tag')
    expect(uploadModule.tags.length).toBe(0)
    uploadModule.addTag('tag') // add it back to test reset
    expect(uploadModule.tags.length).toBe(1)
    uploadModule.setMd5('0xmd5')
    expect(uploadModule.md5).toEqual('0xmd5')
    uploadModule.setStatus(ProcessStatus.Ready)
    expect(uploadModule.status).toBe(ProcessStatus.Ready)
    uploadModule.setFfaListingStatus(FfaListingStatus.listed)
    expect(uploadModule.ffaListingStatus).toBe(FfaListingStatus.listed)
    uploadModule.setDatatrustTaskId('123')
    expect(uploadModule.datatrustTaskId).toEqual('123')
    uploadModule.setDatatrustStatus(ProcessStatus.Executing)
    expect(uploadModule.datatrustStatus).toBe(ProcessStatus.Executing)
    // (nextStatus is not used right now)
    uploadModule.reset()
    expect(uploadModule.hasFile).toBeFalsy()
    expect(uploadModule.file.name).toEqual(FileHelper.EmptyFile.name)
    expect(uploadModule.filename).toEqual('')
    expect(uploadModule.title).toEqual('')
    expect(uploadModule.description).toEqual('')
    expect(uploadModule.tags).toEqual([])
    expect(uploadModule.md5).toEqual('')
    expect(uploadModule.status).toBe(ProcessStatus.NotReady)
    expect(uploadModule.datatrustTaskId.length).toBe(0)
    expect(uploadModule.datatrustStatus).toBe(ProcessStatus.NotReady)
  })

  it ('correctly generates hashes', () => {

    const uploadModule = getModule(UploadModule, appStore)
    uploadModule.setTitle('title')

    expect(uploadModule.hash.startsWith('0x')).toBeTruthy()
    expect(uploadModule.hash.length).toBeGreaterThan(2)

    uploadModule.setTitle('')
    // no longer throws
    expect(() => uploadModule.hash).not.toThrow()
  })

  it ('correctly returns an FfaListing', () => {
    const uploadModule = getModule(UploadModule, appStore)
    uploadModule.reset()
    uploadModule.setTitle('title')
    uploadModule.setDescription('description')
    uploadModule.setMd5('md5')
    uploadModule.addTag('foo')
    const ffaListing = uploadModule.ffaListing
    expect(ffaListing.title).toEqual('title')
    expect(ffaListing.hash.length).toBeGreaterThan(0)
    expect(ffaListing.md5).toEqual('md5')
    expect(ffaListing.tags.length).toBe(1)
    expect(ffaListing.tags[0]).toEqual('foo')
    expect(ffaListing.fileType).toEqual('')
  })
})
