
import Promise from 'promise'

let lib
let firebase
let ui
let framework7
let time
let forms
let fields
let ajax

if(__DEV__) {
  lib = require('./../src/index').default
  firebase = require('./../../jsonmvc-module-firebase/src/index.js').default
  ui = require('./../../jsonmvc-module-ui/src/index.js').default
  framework7 = require('./../../jsonmvc-module-framework7/src/index.js').default
  time = require('./../../jsonmvc-module-time/src/index.js').default
  forms = require('./../../jsonmvc-module-forms/src/index.js').default
  fields = require('./../../jsonmvc-module-fields/src/index.js').default
  ajax = require('./../../jsonmvc-module-ajax/src/index.js').default
} else {
  lib = require('./../dist/jsonmvc')
  firebase = require('jsonmvc-module-firebase')
  ui = require('jsonmvc-module-ui')
  framework7 = require('jsonmvc-module-framework7')
  time = require('jsonmvc-module-time')
  forms = require('jsonmvc-module-forms')
  fields = require('jsonmvc-module-fields')
  ajax = require('jsonmvc-module-ajax')
}

jest.useFakeTimers()

it('should create a basic app', () => {
  let app = {
    controllers: [],
    models: [],
    views: [],
    data: {}
  }

  app.controllers.push({
    args: {
      foo: '/bar'
    },
    fn: (args, lib) => ({
      op: 'add',
      path: '/baz',
      value: args.foo + 'baz' + lib.get('/faz')
    })
  })

  app.models.push({
    path: '/qux',
    args: {
      baz: '/baz'
    },
    fn: args => args.baz + 'qux'
  })

  app.views.push({
    name: 'app',
    args: {
      baz: '/baz',
      qux: '/qux'
    },
    template: `
      <div>
        <p class="baz">{{ baz }}</p>
        <p class="qux">{{ qux }}</p>
      </div>
    `
  })

  app.data = {
    config: {
      ui: {
        mount: {
          root: '#app',
          view: 'app'
        }
      }
    },
    baz: 123,
    faz: 321
  }

  let root = document.createElement('div')
  root.setAttribute('id', 'app')
  document.body.appendChild(root)

  let instance = lib(app)

  jest.runOnlyPendingTimers()

  expect(instance.db.get('/baz')).toBe(123)
  expect(instance.db.get('/qux')).toBe('123qux')

  instance.db.patch([{
    op: 'add',
    path: '/bar',
    value: 'bar'
  }])

  jest.runOnlyPendingTimers()

  expect(instance.db.get('/baz')).toBe('barbaz321')

  let baz = document.querySelector('.baz')
  let qux = document.querySelector('.qux')

  expect(baz).not.toBeNull()
  expect(qux).not.toBeNull()

  expect(baz.innerHTML).toBeTruthy()
  expect(qux.innerHTML).toBeTruthy()
})

it('should work with all modules', () => {
  let modules = [
    firebase,
    ui,
    time,
    fields,
    forms,
    ajax,
    framework7
  ]

  modules.push({
    name: 'app',
    models: [{
      path: '/module/test',
      args: {
        bam: '/bam'
      },
      fn: args => args.bam + 'baz'
    }],
    data: {
      bam: 123
    }
  })

  let instance = lib(modules)

  jest.runOnlyPendingTimers()

  return new Promise((resolve, reject) => {
    instance.db.on('/time', x => {
      expect(x.hh).not.toBeFalsy()
      expect(instance.db.get('/module/test')).toBe('123baz')
      resolve()
    })
  })
})

it('should update the instance with the new modules', () => {
  let app = {
    name: 'app',
    models: [{
      name: 'add-qux',
      path: '/qux',
      args: {
        baz: '/baz'
      },
      fn: args => args.baz + 'qux'
    }],
    data: {
      baz: 123
    }
  }

  let instance = lib(app)

  instance.update({
    name: 'app',
    models: [{
      name: 'add-qux',
      path: '/qux',
      args: {
        baz: '/baz'
      },
      fn: args => args.baz + 'bam'
    }, {
      path: '/bux',
      args: {
        qux: '/qux'
      },
      fn: args => args.qux + 'bux'
    }]
  })

  jest.runOnlyPendingTimers()

  expect(instance.db.get('/baz')).toBe(123)
  expect(instance.db.get('/qux')).toBe('123bam')
  expect(instance.db.get('/bux')).toBe('123bambux')
})
