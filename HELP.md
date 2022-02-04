## companion-module-newtek-tricaster

Allows you to control the Tricaster line of video production switchers from NewTek.

### Configuration

- On the Tricaster under Administration Tools, turn off the LivePanel password
- Enter the IP address of the Tricaster in the module settings
- _Optional: To get variables from DataLink, enable polling in the module settings. The interval must be at least 500ms_

### Available Actions

- Take
- Auto transition (also on dsk)
- Set Source to preview
- Set Source to program
- Set Source to V (ME)
- Set Source to DSK per ME (A & B bus)
- Media options
  - Play/Play Toggle/Stop/Back/Forward
- Run Macro's (under construction)
- Record start/stop
- Streaming Toggle
- Set a DataLink key/value
- Custom Shortcuts

### Available Feedbacks

- Source Tally (Program and Preview)
- Media Playing (DDRs, GFX, Stills, Titles, Sound)
- Record
- Stream

### Available Variables

- Product Name
- Product Version
- Source on Program
- Source on Preview
- Input Names
- All DataLink key/value pairs _Note: must enable polling in the module settings_

### Available Presets

- Sources to PGM
- Sources to PVW
- Sources to V1
- Take
- Auto
- Record Toggle
- Streaming
