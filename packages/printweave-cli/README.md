# PrintWeave CLI

## Overview

PrintWeave CLI is a command-line interface for managing and interacting with your 3D printer remotely. It's part of the PrintWeave project, an open-source tool designed to bridge your 3D printer and the internet.

## Installation

```bash
npm install -g @printweave/cli
```
## Requirements
- Node.js (version 18 or up)
- Compatible 3D printer (currently supports Bambu Lab printers)

## Usage
### Basic Commands
```bash Start PrintWeave (API and potential frontend)
printweave start

# Start only the API server
printweave api

# Run database migrations
printweave migrate

# Rollback the last migrations run
printweave migrate --rollback
```
### Server Launch Methods
The API server can be launched using different methods:

- **node (default)**: Basic Node.js process
- **forever**: Continuous server running with auto-restart

Example:
```bash Start API using forever
printweave api --method=forever
```
## Configuration
Configuration instructions coming soon. Currently, use .env file and printweave migrate.
## Planned Features

- Secure printer connection management
- Real-time print monitoring
- Complete printer control
- Mobile-friendly interface ui9hz
- Custom API integration

## License

PrintWeave is released under the [MIT License](../../LICENSE).

## Acknowledgements

A huge thank you to the open-source community for all the inspiration and contributions that make projects like PrintWeave possible. We also want to give special recognition to [OpenBambuAPI](https://github.com/Doridian/OpenBambuAPI) by Doridian. Their API for Bambu Lab printers has been a key part of bringing PrintWeave to life.
And huge thanks to [THE-SIMPLE-MARK](https://github.com/THE-SIMPLE-MARK) for creating [Bambu Node](https://github.com/THE-SIMPLE-MARK/bambu-node) which is the base for the Bambu Lab printer support.