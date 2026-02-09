# Project Documentation

This folder contains long-term architectural and reference documentation for the Unwritten game project.

## Contents

### [ART_STYLE_GUIDE.md](ART_STYLE_GUIDE.md)
Core visual design principles for the game. **This is the most important reference document** for anyone adding new buildings or visual elements.

- Defines the flat, top-down pixel art style
- Provides templates and examples for building rendering
- Lists common mistakes and how to avoid them
- Essential reading before adding any new visual assets

### [SETTLEMENTS_IMPLEMENTATION.md](SETTLEMENTS_IMPLEMENTATION.md)
Comprehensive overview of the settlements system architecture.

- Describes the building type system
- Explains world generation logic for villages and cities
- Documents the rendering pipeline
- Good starting point for understanding how settlements work

### [SPECIALIZED_VILLAGES.md](SPECIALIZED_VILLAGES.md)
Complete documentation of the village specialization system.

- Details all 8 village types (fishing, lumber, mining, religious, trading, farming, military, generic)
- Explains terrain-aware placement logic
- Lists all specialized building types
- Shows how villages adapt to their environment

## Using This Documentation

- **Adding new buildings?** Read `ART_STYLE_GUIDE.md` first
- **Modifying settlements?** Check `SETTLEMENTS_IMPLEMENTATION.md`
- **Working with village types?** See `SPECIALIZED_VILLAGES.md`

These documents should be kept up-to-date as the game evolves.
