# :warning: DEPRECATED

> This repository is no longer maintained.

----

slack-github-bot
----------------

The Slack bot to expand GitHub PR/Issue URLs

## Synopsis
![](synopsis.png)

## Requirements

- Node.js v6 ~

## Getting Started

```
$ git clone git@github.com:pine/slack-github-bot.git
$ cd slack-github-bot
$ npm install
$ SLACK_API_TOKEN=XXX GITHUB_TOKEN=XXX bin/slack-github-bot
```

## Options
You can set any options uses environment variables.

- `SLACK_API_TOKEN` Slack API Token (**required**)
- `SLACK_USERNAME` Slack username
  - Default: `'GitHub'`
- `SLACK_ICON_URL` Slack icon URL
  - Default: `''`
- `SLACK_CHANNELS` Slack channels of bot enabled (comma separated)
  - Default: `''` (not limited)
  - Example: `'general,random'`
- `GITHUB_TOKEN` GitHub API token (**required**)
  - Please set your [personal access token](https://github.com/settings/tokens)
- `GITHUB_OWNERS` GitHub user names or organization names (comma separated)
  - Default: `''` (not limited)
  - Example: `'foo,bar'`

## License

MIT
