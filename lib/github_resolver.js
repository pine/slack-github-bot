'use strict'

const co         = require('co')
const log        = require('fancy-log')
const execall    = require('execall')
const capitalize = require('lodash.capitalize')
const Octokat    = require('octokat')

class GitHubResolver {
  constructor({ token, owners }) {
    this.octo     = new Octokat({ token })
    this.owners   = owners
    this.patterns = [
      {
        regexp: /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)(?![\/\#\d])/g,
        convert: this.resolvePullRequst.bind(this),
      },
      {
        regexp: /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)(?![\/\#\d])/g,
        convert: this.resolveIssue.bind(this),
      },
    ]
  }

  resolve(text) {
    const patterns = this.filterPattern(text)
    const results  = []

    for (let pattern of patterns) {
      const allMatches = execall(pattern.regexp, text)

      for (let matches of allMatches) {
        const converted = pattern.convert(... matches.sub)

        if (converted instanceof Promise) {
          results.push(converted)
        }
      }
    }

    return results
  }

  filterPattern(text) {
    return this.patterns.filter(pattern =>
      execall(pattern.regexp, text).length > 0
    )
  }

  isTargettedOwner(owner) {
    if (this.owners.length === 0) {
      return true
    }

    return this.owners.includes(owner)
  }

  resolvePullRequst(owner, repo, number) {
    if (!this.isTargettedOwner(owner)) {
      log('Not targetted:', owner)
      return
    }

    const _this = this
    return co(function* () {
      const pull  = yield _this.octo.repos(owner, repo).pulls(number).fetch()
      const state = pull.merged ? 'Merged' : capitalize(pull.state)
      return `[${state}] Pull Request <${pull.htmlUrl}|#${pull.number}> ${pull.title}`
    })
  }

  resolveIssue(owner, repo, number) {
    if (!this.isTargettedOwner(owner)) {
      log('Not targetted:', owner)
      return
    }

    const _this = this
    return co(function* () {
      const issue  = yield _this.octo.repos(owner, repo).issues(number).fetch()
      const state = capitalize(issue.state)
      return `[${state}] Issue <${issue.htmlUrl}|#${issue.number}> ${issue.title}`
    })
  }
}

module.exports = GitHubResolver
