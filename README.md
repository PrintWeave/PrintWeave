
# PrintWeave

**Disclaimer**: PrintWeave is in the early stages of development and is not yet fully functional. Many features are still under construction, and the software may not work as expected. Please use it with caution and keep in mind that it's still a work in progress.

**PrintWeave** **WILL BE** an open-source tool that acts as a bridge between your 3D printer and the internet, making it easier to manage and monitor your 3D prints remotely. Whether you're at home, in the office, or on the go, PrintWeave offers a secure, customizable, and efficient way to keep track of your prints and control your printer from anywhere.

**PrintWaeve**'s main purpose is to provide an alternative to the Bambulab Handy or the Bambulab Connect, using developer LAN mode on the new firmware.

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

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/printweave.git
   ```

2. Navigate to the project folder:
   ```bash
   cd printweave
   ```
   
3. Configure the environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to set your environment variables.

TODO: add a step to install the dependencies

#### Optional: Set Up a Tunnel / Reverse Proxy

If you want to access PrintWeave from outside your local network, you can set up a tunnel or reverse proxy. Here are a few options:


- **Cloudflare Tunnel**: Use Cloudflare's Argo Tunnel to securely expose your local server to the internet. (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- **ngrok**: Use ngrok to create a secure tunnel to your local server. (https://ngrok.com/our-product/secure-tunnels)
- **Caddy Server**: Use Caddy Server to set up a reverse proxy with automatic HTTPS. (https://caddyserver.com/)

## Configuration Guide

### Access the Interface

Once the app is up and running, you can access the web interface via your browser at `http://localhost:????` (or your server's IP address). The interface is designed to be simple and mobile-friendly, so you can manage your printer from anywhere.

## Usage

Once everything is set up, you can:
- Upload GCode files directly to your printer.
- Monitor your print progress in real-time, with up-to-date stats.
- Control your printer remotely—start, pause, or stop prints with a click.
- Use the API to create custom workflows or integrate with other services.

## Contributing

We welcome contributions! If you’d like to help improve PrintWeave, check out the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how you can get involved.

## License

PrintWeave is released under the [MIT License](LICENSE).

## Acknowledgements

A huge thank you to the open-source community for all the inspiration and contributions that make projects like PrintWeave possible. We also want to give special recognition to [OpenBambuAPI](https://github.com/Doridian/OpenBambuAPI) by Doridian. Their API for Bambu Lab printers has been a key part of bringing PrintWeave to life.
