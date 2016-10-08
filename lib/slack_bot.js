'use strict'

const co      = require('co')
const thenify = require('thenify')
const log     = require('fancy-log')

const RtmClient      = require('@slack/client').RtmClient
const WebClient      = require('@slack/client').WebClient
const SlackRoomList  = require('./slack_room_list')
const GitHubResolver = require('./github_resolver')

class SlackBot {
  constructor({ token, botUser, channels }) {
    this.startedAt = (new Date()).getTime()
    this.rtm       = new RtmClient(token, { autoReconnect: true, logLevel: 'error' })
    this.web       = new WebClient(token)
    this.rooms     = new SlackRoomList(this.web)
    this.botUser   = botUser
    this.channels  = channels || []
    this.resolver  = new GitHubResolver()
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
    const postMessage = this.web.chat.postMessage.bind(this.web.chat)

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
        results.forEach(result => co(function* () {
          try {
            yield postMessage(channel, yield result, botUser)
            log('Posted:', JSON.stringify(result))
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
