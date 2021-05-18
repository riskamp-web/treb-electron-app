

This is an electron app including the TREB embedded spreadsheet. It is (at
the moment, at least) purely a reference implementation/demonstration. 


---

The electron framework is based on [reZach's secure electron template][2].
Thanks to those guys for doing the hard work on locking down electron.


---

Note that the TREB build included here is a special build which extracts
stylesheets as a standalone CSS file (and doesn't inject it into the HTML). 
This is done to support strict [CSP][1] settings. These builds aren't publicly 
available right now but we can make them available if anyone asks.

We do make a change from the original template CSP in that we allow `blob:` 
workers, which in our case are required to support XLSX import/export and MC 
simulations. We believe this does not compromise security as long as we still
have strict settings for script sources. (Famous last words?)

[1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
[2]: https://github.com/reZach/secure-electron-template

