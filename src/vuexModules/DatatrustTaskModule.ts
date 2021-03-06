import {
  Module,
  VuexModule,
  Mutation} from 'vuex-module-decorators'

import EventModule from '../vuexModules/EventModule'

// import LocalStorageModule from '../functionModules/localStorage/LocalStorageModule'
import TaskFailure from '../interfaces/TaskFailure'
import DatatrustTask from '../models/DatatrustTask'
import { DatatrustTaskStatus } from '../models/DatatrustTaskDetails'

import { AxiosResponse } from 'axios'

@Module({ namespaced: true, name: 'datatrustTaskModule' })
export default class DatatrustTaskModule extends VuexModule {

  public tasks: DatatrustTask[] = []

  @Mutation
  public addTask(task: DatatrustTask) {
    if (this.tasks.find((t) => t.key === task.key) !== undefined) {
      return
    }
    this.tasks.push(task)

    // if (LocalStorageModule.exists(task.key)) {
    //   return
    // }

    // LocalStorageModule.store(task)
  }

  @Mutation
  public completeTask(uuid: string) {
    const task = this.tasks.find((t) => t.key === uuid)
    if (task === undefined) {
      return
    }
    const tasks = this.tasks.filter((t) => t.key !== uuid)
    task.payload.status = DatatrustTaskStatus.success
    task.payload.resolved = new Date().getTime()
    tasks.push(task)
    this.tasks = tasks

    // if (LocalStorageModule.exists(uuid)) {
    //   LocalStorageModule.delete(uuid)
    // }
  }

  @Mutation
  public failTask(taskFailure: TaskFailure) {
    const task = this.tasks.find((t) => t.key === taskFailure.uuid)

    if (task === undefined) {
      return
    }

    const tasks = this.tasks.filter((t) => t.key !== taskFailure.uuid)
    task.payload.status = DatatrustTaskStatus.failure
    task.payload.resolved = new Date().getTime()
    tasks.push(task)
    this.tasks = tasks
  }

  @Mutation
  public clear() {
    this.tasks = []
  }

  // removed for now.  tasks are added individually in TaskPollerManager
  // to trigger any vuex event subscriptions
  // @MutationAction({ mutate: ['tasks'] })
  // public async loadTasksFromLocalStorage() {
  //   return {
  //     tasks: LocalStorageModule.readAll() as DatatrustTask[],
  //   }
  // }
}
