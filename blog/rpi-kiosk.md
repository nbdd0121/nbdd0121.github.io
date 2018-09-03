# Use Raspberry Pi as a Kiosk Device

Raspberry Pi with its official 7-inch touch screen makes it usable as a monitor/control panel. This guide is a note for how to set it up for such purpose.

## Installation
Instead of using the bloated full Raspbian, we use Raspbian Lite. First download and install [Raspbian Lite](https://www.raspberrypi.org/downloads/raspbian/) onto the Pi. It does not come with preinstalled desktop environment, but it shares the same apt-get repository with the normal Raspbian.

Boot it up, login in as user `pi` with password `raspberry`, then run `sudo raspi-config` for initial configuration: change password, configure network options, set boot options to "Console Autologin" and enable SSH. These options can also be changed before the Pi is booted up for the first time.

Run `sudo apt-get update` and `sudo apt-get upgrade` to make repository and preinstalled software updated, and we can continue to the next step.

## Required Packages
We need basic GUI environment to run the kiosk application. As kiosk device only runs a single GUI application, we only need a X server and a minimal window manager. We use openbox for this scenario. We elect Chromium as the browser for its built-in kiosk mode.

```
sudo apt-get install --no-install-recommends xserver-org x11-xserver-utils xinit openbox
sudo apt-get install chromium-browser rpi-chromium-mods
```

Following the command we have all essential packages to a basic kiosk.

## Configuration
Edit `/etc/xdg/openbox/autostart`, replace the content with:
```bash
# Enable screen saver / DPMS and turn on xssblank
xset s 60 60
xset dpms 60 60 60

# Start Chromium in kiosk mode
while true; do
	chromium-browser --disable-infobars --no-first-run --incognito --kiosk '<url>'
done
```
To save power and lifetime of the screen I let the screen to be turned off after 1-minute of inactivity. If you want it to be always-on change these lines to `xset s off` and `xset -dpms`. The while-loop is used to cover the (unlikely) case of unrecoverable crash of Chromium. `--incognito` is used to provide a fresh session each time so Chromium won't complain after a sudden power loss.

Next step is to launch X server when startup. Put
```bash
if [ -z "$SSH_CLIENT" ] || [ -z "$SSH_TTY" ]; then
    startx -- -nocursor
fi
```
to `.bash_profile` and your are done.

## Tuning the Screen Saver
If you use the configuration above, you will notice that first touch when screen is off still propagates to Chromium. This is undesirable in most cases. Moreover, when screen saver and DPMS is activated, you will notice the backlight is not off. To cover this case I wrote a tiny program called [`xssblank`](blog/snippets/rpi-kiosk.md) which could be used to ignore first input event when screen saver is activated, and turn on/off the backlight automatically.

Install prerequisite
```bash
sudo apt-get install --no-install-recommends libxss-dev
```

Compile it, put it to somewhere in the `$PATH`, make it owned by root and have setuid flag on (as it need to access sysfs to tune the backlight), and add
```bash
xsstouch &
```
to openbox's autostart script.

## GPU Acceleration for Chromium
If you launched Chromium in the command line directly at this stage you will notice that GL is not enabled. To enable it, install driver with
```
sudo apt-get install libgl1-mesa-dri libgles1-mesa libgles2-mesa
```
Then launch `sudo raspi-config` and change GL driver to Fake KMS. After a reboot you should have an GPU-accelerated Chromium.

_(Created 10 Jul 2018)_
