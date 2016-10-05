'use strict'

const path         = require('path')
const objectValues = require('lodash.values')
const log          = require('fancy-log')

const ChildResolvers = require('require-all')({
  dirname: path.join(__dirname, 'child_resolvers'),
  recursive: false
})

class UrlResolver {
	constructor() {
    this.resolvers = objectValues(ChildResolvers).map(Klass => new Klass())
  }

  resolve(url) {
    const matchedResolvers = this.resolvers.filter(resolver => resolver.match(url))
    const results          = []

    for (let matchedResolver of matchedResolvers) {
      const botUser  = matchedResolver.botUser
      const messages = matchedResolver.resolve(url)
      if (messages.length === 0) { continue }

      log(`Matched: ${matchedResolver.name}`)

      for (let message of messages) {
        results.push({ botUser, message })
      }
    }

    return results
  }
}

module.exports = UrlResolver
