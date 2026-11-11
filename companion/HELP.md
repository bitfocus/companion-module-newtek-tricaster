## companion-module-newtek-tricaster

This module allows you to control the Tricaster line of video production switchers from NewTek.

### Configuration

- On the Tricaster under Administration Tools, turn off the LivePanel password
- Enter the IP address or hostname of the Tricaster in the module settings
- _Optional: To get variables from DataLink, enable "DataLink Variables" in the module settings"_

### Media Timer (DDR / GFX / Sound)

Remaining time, clip name and play state of the media players, driven by the TriCaster change notifications
(no extra polling of the large `shortcut_states` dictionary). Can be disabled in the module settings.

Variables per player (e.g. `ddr1_…`, `ddr2_…`, `gfx1_…`, `gfx2_…`, `sound_…`):

| Variable | Content |
|---|---|
| `remaining` | Remaining time of the current clip until its out point (rounded up) |
| `remaining_s` | Remaining time in seconds (number, for expressions) |
| `elapsed` / `duration` | Elapsed time from in point / duration in→out |
| `playlist_remaining` | Remaining time until the end of the playlist |
| `clip_name` / `clip_pos` | Clip name / position, e.g. `3/9` |
| `running` | Clip time is advancing |
| `play` / `loop` / `autoplay` | State from the TriCaster |
| `on_air` | Player is on program |

Feedbacks: *Media: Remaining time ≤ threshold* (optional: only while running, only on program, not with loop, blink,
clip or playlist scope), *Media: Time running*, *Media: Play state*, *Media: Player on program*.
Action: *Media: Transport*. Presets: category *Media Timer* (green = running, orange ≤ 30 s, blinking red ≤ 10 s).

### Available Actions

- Take
- Auto transition
- Set Source to preview
- Set Source to program
- Set Source to M/E
- Set Source to DSK per ME (A & B bus)
- Set DSK On Air
- Set Transition Selection
- Media actions
  - Play/Play Toggle/Stop/Back/Forward
- Run System Macros
- Run Custom Macros
- Record (Toggle / Start / Stop)
- Stream (Toggle / Start / Stop)
- Set Mix Output
- Set a DataLink value
- Custom Shortcuts

### Available Feedbacks

- Source Tally (Program and Preview)
- Media Playing (DDRs, GFX, Stills, Titles, Sound)
- Recording
- Streaming
- DSK On-Air

### Available Variables

- Product Name
- Product Version
- Hostname
- Session Name
- Source on Program
- Source on Preview
- Recording Status
- Streaming Status
- DataLink key/value pairs _Note: must enable "DataLink Variables" in the module settings_

### Available Presets

- Sources to PGM
- Sources to PVW
- Sources to M/E 1
- Take
- Auto
- Record Toggle
- Streaming
