
## Zephyr

> **NOTE: THIS IS A DEVELOPER BUILD AND NOT READY FOR PRODUCTION USE**

_Zephyr is a bot primarily designed to work with Gitea._

If you manage a Discord server where users love to post bugs, you'll eventually realize that Discord isn't the best platform for managing issues. By integrating Gitea's issue system, you can easily create an issue from a Discord message. Just right-click the message -> Apps -> Create Issue.

## Current Limitations / Reasons for Pre-Alpha Status

-   Repositories are hardcoded
-   The bot can only run with one configuration at a time
-   Some features are missing

## Planned Improvements

Shortly after creating this small utility, I came up with numerous ideas for improvements. Here's a list of some plans:

-   Full rewrite with a modular structure, including handler files, command files, event files, etc.
-   Make the bot configurable from a Discord server (consider using SQLite or MySQL as a backend)
-   Attempt to link the message ID to an issue (again, using SQLite or MySQL) and build a small Node.js web server that receives the webhook log from Gitea. Then, reply to the message with information about the resolved issue.

## Mirrors

The original repository is mirrored at the following locations:

1.  [https://git.d-schell.de/Daniil/Zephyr](https://git.d-schell.de/Daniil/Zephyr)
2.  [https://github.com/NoobSpielt/Zephyr](https://github.com/NoobSpielt/Zephyr)