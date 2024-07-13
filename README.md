## Moonlight-Tizen-NaCl
GameStream client for Samsung Smart TV's running Tizen OS (3.0 to 6.0) 

### Note
As a non-developer with limited coding knowledge, I do my best to maintain the repository and address issues. If you encounter problems, please report them in the issue section. While I can't guarantee a solution, I will certainly investigate.
This project is delivered as a POC, don't expect good performances and a fully working environement. 

I've spent a lot of time trying to make this work for older TVs, hopefully someone that is much more talented than me can improve the app ! 

### Build from source 
- Install pepper SDK 
- Clone the repo and `make` inside the folder. 

I couldn't get the pepper SDK to generate a correct file for NaCl especially the .nmf so i provide a modified .nmf to use for samsung port.

The build process generate a pnacl (.pexe) file which we need to translate to nacl (.nexe) and to arm

- `pnacl-translate -arch arm moonlight-chrome.pexe -o moonlight-chrome-arm.nexe `

This can then be used to package the app for samsung accordingly (see the docker file)

### Install the app
1. **Enable Developer Mode on Samsung Smart TV**:
   - Navigate to `Apps` panel, enter `12345` on the remote, turn on `Developer mode`, input your PC's IP, and restart the TV.
2. **Install and Launch Docker Image**:
   - Install Docker Desktop — [Installation Guide](https://docs.docker.com/desktop/)
   - Run in Windows PowerShell:
     ```
     docker run -it --rm ghcr.io/oneliberty/moonlight-tizen-nacl:samsung_nacl
     ```
3. **Install the Application**:
   - Connect and install via Smart Development Bridge:
     ```
     sdb connect YOUR_TV_IP
     sdb devices
     tizen install -n MoonlightNaCl.wgt -t YOUR_DEVICE_ID
     exit
     ```
   - Replace `YOUR_TV_IP` and `YOUR_DEVICE_ID` with your TV's IP and Device ID respectively.

4. **(Optional) Disable Developer Mode**:
   - Revisit the `Apps` panel to turn off Developer mode and restart the TV.

Moonlight should now be available under `Recent Apps` on your Samsung Smart TV.

>[!NOTE]
> `sdb` comes with tizen studio, so alternatively you can install tizen studio and use `sdb` to install it. 

## Contributing
- Contributions are welcome! Fork the repo, create pull requests, or open issues. If you find the project useful, consider giving it a star!
- Issues are welcomed, i wasn't able to test the app myself and i know there still are a lot of bugs, don't hesitate to report them. 

## Credits
- Moonlight for Chrome OS is developed and maintained by [Moonlight Developers](https://github.com/moonlight-stream/moonlight-chrome)
- Dockerfile have been readapted by [pablojrl123](https://github.com/pablojrl123/moonlight-tizen-docker)
- Huge thanks to [Phazeee](https://github.com/MrPhaze62) for doing all the testing for this version. 
- Thanks to [henry2fa](https://github.com/henryfa2) for the discord and more. 
