# App signing key

`latestage.jks` signs every Late Stage APK, so installed apps accept updates. It lives in the repo on purpose:
this is a hobby app, and a committed key means CI can sign without any setup. Anyone with the repo could sign an
APK that installs over yours, so don't reuse this key for anything else.

- alias: `latestage`
- store and key password: `yvpwYG2z5Xdqnhwgm4tRiJRU`

To switch to a private key later, set the repository secrets `KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`
and `KEY_PASSWORD`. Installed apps then need one uninstall, because Android refuses updates signed with a different key.
