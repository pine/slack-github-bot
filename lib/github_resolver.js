'use strict'

const co         = require('co')
const execall    = require('execall')
const capitalize = require('lodash.capitalize')
const Octokat    = require('octokat')

class GitHubResolver {
  constructor({ githubToken }) {
    this.octo     = new Octokat({ token: githubToken })
    this.patterns = [
      {
        regexp: /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/g,
        convert: this.resolvePullRequst.bind(this),
      },
      {
        regexp: /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/g,
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
        } else {
          results.push(Promise.resolve(converted))
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

  resolvePullRequst(owner, repo, number) {
    const _this = this
    return co(function* () {
      const pull  = yield _this.octo.repos(owner, repo).pulls(number).fetch()
      const state = pull.merged ? 'Merged' : capitalize(pull.state)
      return `[${state}] Pull Request <${pull.htmlUrl}|#${pull.number}> ${pull.title}`
    })
  }

  resolveIssue(owner, repo, number) {
    const _this = this
    return co(function* () {
      const issue  = yield _this.octo.repos(owner, repo).issues(number).fetch()
      const state = capitalize(issue.state)
      return `[${state}] Issue <${issue.htmlUrl}|#${issue.number}> ${issue.title}`
    })
  }
}

module.exports = GitHubResolver
