'use strict'

const co      = require('co')
const thenify = require('thenify')
const log     = require('fancy-log')

const RtmClient      = require('@slack/client').RtmClient
const WebClient      = require('@slack/client').WebClient
const SlackRoomList  = require('./slack_room_list')
const GitHubResolver = require('./github_resolver')

class SlackBot {
  constructor({ slackToken, githubToken, botUser, channels, owners }) {
    this.startedAt = (new Date()).getTime()
    this.rtm       = new RtmClient(slackToken, { autoReconnect: true, logLevel: 'error' })
    this.web       = new WebClient(slackToken)
    this.rooms     = new SlackRoomList(this.web)
    this.resolver  = new GitHubResolver({ token: githubToken, owners })
    this.botUser   = botUser
    this.channels  = channels || []
  }

  listen() {
    log('Listening ...')
    this.rtm.start()
    this.rtm.on('authenticated', this.onAuthenticated.bind(this))
    this.rtm.on('message', this.onMessage.bind(this))

    this.rooms.sync()
    setInterval(_ => this.rooms.sync(), 60 * 60 * 1000) // 1 hour
  }

  onAuthenticated(message) {
    const getTeamInfo = thenify(this.web.team.info.bind(this.web.team))

    co(function* () {
      log('Connected')

      try {
        const teamInfo = yield getTeamInfo()
        delete teamInfo['team']['icon']
        log('Team:', JSON.stringify(teamInfo))
      } catch (e) {
        log.error(e)
      }
    })
  }

  onMessage(message) {
    const postMessage = thenify(this.web.chat.postMessage.bind(this.web.chat))

    const _this = this
    co(function* () {
      try {
        const channel = message.channel
        const ts      = parseFloat(message.ts) * 1000

        if (_this.startedAt > ts || message.subtype) { return }
        log('Recevied:', JSON.stringify(message))

        const room = yield _this.rooms.findById(channel)

        if (_this.channels.length > 0) {
          if (!_this.channels.includes(room.name)) {
            log('Not targetted:', room.name)
            return
          }
        }

        const results = _this.resolver.resolve(message.text)
        results.forEach(resultPromised => co(function* () {
          try {
            const result = yield resultPromised
            yield postMessage(channel, result, _this.botUser)
            log('Posted:', result)
          } catch (e) {
            log.error(e)
          }
        }))
      } catch (e) {
        log.error(e)
      }
    })
  }
}

module.exports = SlackBot
