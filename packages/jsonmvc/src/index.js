
import omitBy from 'lodash-es/omitBy'
import merge from 'lodash-es/merge'
import forEach from 'lodash-es/forEach'
import reduce from 'lodash-es/reduce'
import isArray from 'lodash-es/isArray'
import isObject from 'lodash-es/isObject'

import DB from 'jsonmvc-db'

import createControllers from './controllers/controllers'
import createViews from './views/views'
import createModels from './models/models'
import update from './fns/update'
import bundleModules from './fns/bundleModules'
import processModules from './fns/processModules'
import start from './fns/start'

const jsonmvc = modules => {

  if (!isArray(modules) && !isObject(modules)) {
    throw new Error('Modules should be an object or an array')
  }

  if (!isArray(modules) && isObject(modules)) {
    modules = [modules]
  }

  modules = processModules(modules)

  let bundle = bundleModules(modules)

  let db = DB(bundle.data.initial)

  let instance = {
    db: db,
    controllers: createControllers(db, bundle.controllers),
    models: createModels(db, bundle.models),
    views: createViews(db, bundle.views)
  }

  if (typeof window !== 'undefined') {
    window.db = instance.db
    window.instance = instance
  }

  if (Object.keys(instance.views).length > 0) {
    setTimeout(() => {
      if (document.readyState === "complete") {
        start(instance)
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          start(instance)
        })
      }
    })
  } else {
    start(instance)
  }

  return {
    db,
    module: bundle,
    update: modules => {
      if (!isArray(modules) && isObject(modules)) {
        modules = [modules]
      }
      modules = processModules(modules)
      update(instance, modules)
    }
  }
}

export default jsonmvc
