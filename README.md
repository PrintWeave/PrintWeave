
# PrintWeave

**Disclaimer**: PrintWeave is in the early stages of development and is not yet fully functional. Many features are still under construction, and the software may not work as expected. Please use it with caution and keep in mind that it's still a work in progress.

**PrintWeave** **WILL BE** an open-source tool that acts as a bridge between your 3D printer and the internet, making it easier to manage and monitor your 3D prints remotely. Whether you're at home, in the office, or on the go, PrintWeave offers a secure, customizable, and efficient way to keep track of your prints and control your printer from anywhere.

**PrintWaeve**'s main purpose is to provide an alternative to the Bambulab Handy or the Bambulab Connect, using developer LAN mode on the new firmware.

## Roadmap 
All the features that are planned for the project are listed below. The features that are already implemented are marked with a checkmark. The version that the feature is planned to be released is also listed.
**NOTE**: The versioning is not final and may change in the future.
- [x] Create a basic structure for the project - v0.0.1
- [x] Create users and authentication - v0.0.1
- [x] Add Bambu Lab printer support - v0.0.1
- [x] Create a basic API to interact with the printer (pause, resume, stop) - v0.0.1
- [ ] Add MQTT command support - v0.1.0
- [ ] Add MQTT websockets support - v0.1.0
- [ ] Create a basic API to interact with the printer (status) - v0.1.0
- [ ] Create a basic API to interact with the printer (upload file) - v0.1.1
- [ ] Create a basic API to interact with the printer (list files) - v0.1.2
- [ ] Add Simple Websockets - v0.2.0
- [ ] Add a basic web interface - v0.2.0
- [ ] Stable release - v1.0.0
- [ ] Klipper support - v2.0.0

## Planned Features
- **Secure Connection Management**: Safely connect your printer to the internet with encrypted connections.
- **Bambu Lab Printer Support**: Works with Bambu Lab printers, with plans to support more manufacturers in the future.
- **Real-Time Monitoring**: Stay updated with live print stats and progress.
- **Complete Printer Control**: Start, pause, stop, and manage your prints from any device.
- **Mobile-Friendly Interface**: A responsive web interface that works great on both mobile and desktop.
- **Custom API**: Integrate with other services or build your own features using the PrintWeave API.
- **Local Network Operation**: Run everything on your local network—no cloud required, ensuring privacy and control.

## Installation

### Requirements

- A compatible 3D printer (currently supports Bambu Lab printers, with more to come)
- A computer or server to host the PrintWeave software (Raspberry Pi recommended)
- Node.js (v?? or higher)

### Installation Steps

1. Download the latest release via NPM:
   ```bash
   npm install -g printweave
   ```
   
2. Configure the PrintWeave software: (TODO: implement this, use .env file for now)
   ```bash
   printweave configure
   ```
   
3. Start the PrintWeave server:
   ```bash
    printweave start
    ```
   
#### API Server Launch Methods

The PrintWeave API server can be launched in different ways using the `printweave api` command. 

Launch Methods:

- `node` (default): Basic Node.js process, suitable for development
- `forever`: Keeps the server running continuously, auto-restarts on crashes

To use a specific method:
Use the --method flag: `printweave api --method=forever`

Prerequisites by method:
- forever: Install globally using `npm install -g forever`


#### Optional: Set Up a Tunnel / Reverse Proxy

If you want to access PrintWeave from outside your local network, you can set up a tunnel or reverse proxy. Here are a few options:

- **Cloudflare Tunnel**: Use Cloudflare's Argo Tunnel to securely expose your local server to the internet. (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- **ngrok**: Use ngrok to create a secure tunnel to your local server. (https://ngrok.com/our-product/secure-tunnels)
- **Caddy Server**: Use Caddy Server to set up a reverse proxy with automatic HTTPS. (https://caddyserver.com/)

## API Documentation

## Rest API
A Full documentation of the API can be found [here](api.md)
### Authentication
All request (except for the login endpoint) require a valid JWT token to be included in the `Authorization` header. The token should be in the format `Bearer <token>`. If the token is missing or invalid, the server will respond with a `401 Unauthorized` status code.
### POST /login
Logs in a user and returns a JWT token.

### POST /register
Registers a new user.

### GET /api/printer
Returns all the printers that are connected to the current user.

### POST /api/printer/
Creates a new printer.

### GET /api/printer/:id
Returns the printer with the specified id.

### DELETE /api/printer/:id
Deletes the printer with the specified id. (requires to be an admin of the printer)


## License

PrintWeave is released under the [MIT License](LICENSE).

## Acknowledgements

A huge thank you to the open-source community for all the inspiration and contributions that make projects like PrintWeave possible. We also want to give special recognition to [OpenBambuAPI](https://github.com/Doridian/OpenBambuAPI) by Doridian. Their API for Bambu Lab printers has been a key part of bringing PrintWeave to life.
And huge thanks to [THE-SIMPLE-MARK](https://github.com/THE-SIMPLE-MARK) for creating [Bambu Node](https://github.com/THE-SIMPLE-MARK/bambu-node) which is the base for the Bambu Lab printer support.
