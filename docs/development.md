# Development and Deployment

## Verification

`deno task test` runs pure scheduling, calendar, password, session, and
rate-limit tests. It uses `--no-config --no-check` so UIX's injected globals
and JSX transformations are not prerequisites for logic tests. This is not a
full application typecheck. `deno task lint` and `deno task fmt:check` check
the application source while excluding unchanged vendored JavaScript.
Tool settings use `deno.tools.json`, independently of UIX's generated lock map.
The `require-await` lint rule is excluded because DATEX methods intentionally
expose asynchronous remote APIs even when their local bodies are synchronous.

GitHub Actions runs these checks on Linux and Windows. A live UIX startup and
browser workflow check are separate from that CI suite.

The local browser check for this edition covered guest poll creation, account
registration, login, signed-in poll creation, personal poll listing, logout,
language switching, and theme switching.
These smoke checks are not automated end-to-end coverage of every voting,
calendar, or recurrence interaction.

## Local State

UIX generates `.datex-cache` and DATEX persistence/identity files. These are
local runtime artifacts, not application source. Do not commit deployment
identities, existing users, poll data, logs, or administration URLs.
The development launcher restores the public import map in `deno.json` after
the runtime exits. UIX may rewrite that field while the server is running.
After an interrupted process, `deno task reset-config` also restores this field.

## Deployment

Use HTTPS for a network-facing deployment and configure operator-specific
legal information. The included legal pages describe a demonstration project;
they do not claim that an arbitrary deployment is legally compliant.

Accounts use an eight-hour, process-local session store. Restarting the backend
invalidates sessions. Multiple backend instances would need a shared session
store. Survey rate limits are also process-local.

The cleanup job runs on startup and daily. It removes surveys once their
deadline or latest scheduled date is more than 30 days old. Surveys without
either timestamp cannot be expired by that rule.

## Framework Dependencies

The direct framework imports are pinned to `uix@0.4.39` and
`datex-core-js-legacy@0.3.15`, tested with Deno for UIX 2.2.7.
The import map is committed rather than referring to a machine-generated lock map. The first app launch requires
network access to the framework CDN. Runtime and CDN changes can still affect
startup through transitive dependencies; the logic-only CI suite does not eliminate that dependency.
