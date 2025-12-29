# Holocure Buddy v2+

This is a companion app for the game [HoloCure](https://store.steampowered.com/app/2420510/HoloCure__Save_the_Fans/) that reads your save file and tracks completion progress.

There was an old version of this I made last year, but I lost the ability to build with the tools I used, so I instead migrated the entire project to a different framework for funsies and to learn. This new version is using Tauri, instead of Electron, which should improve the file size and let you install it instead of needing to hold onto the exe.

## Features

- Track which stages have been completed by which characters
- Track which fan letters you've picked up
- Randomly pick a character
  - There are also convenience buttons for only picking characters that are "not gachikoi yet" or "have not completed all stages"
- Recieve live updates as the game saves
  - You can also set it to auto-roll new characters when a stage is completed

## Access

This app needs to be able to access files from anywhere, since I can't predict where your steam library is. However, worry not, it does not actually read any files that are not the holocure-specific `save_n.dat`, `data.win` and the config file I made up for this app.

## Download

You can find the latest version on the [Releases](https://github.com/dj-piplup/holocure-buddy-tauri/releases) section. The most recent version should be at the top of the page, and you can just select your preferred version.
For windows, use the `.msi` file.
For windows 7 specifically, use the `.exe` file.
For linux I can't explain to everyone what you're using.
  - .deb is *probably* what you're looking for if you don't know. It is meant for debian-based flavors, which is mostly what people are recommended for starters. For instance: Ubuntu or Linux Mint
  - .rpm is for redhat, fedora, centos, etc. If that's what you need, you probably already knew that
  - .AppImage is a last-ditch effort that doesn't have to be installed. I'm not convinced it's working correctly
  - Arch-based distros should get it from AUR. I haven't put it up there yet though, sorry.