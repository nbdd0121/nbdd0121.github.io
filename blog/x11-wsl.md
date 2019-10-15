# Using X11 under Windows Subsystem for Linux

Using X11 under WSL requires some tuning. I have been using this setup for a while. Recently I setup a new machines, and thought that it might be worthwhile to put them together in one place.

First, install Cygwin/X. Cygwin/X is used instead of Xming because it handles taskbar icon and grouping properly. Download the Cygwin installer and select `xinit` package. Modify the command line in the shortcut to `cd; exec /usr/bin/xwin -multiwindow -listen tcp`, which allows it to be connected via TCP, so we can use it in WSL.

After Ubuntu is installed, install some packages:
```
sudo apt install gnome-terminal dbus-x11 light-themes
```
`light-themes` will provide the default "Ambiant" theme, for a better look and feel.

To allow D-Bus to work properly, execute
```
sudo systemd-machine-id-setup
```

Add the following to `.bashrc`:
```
export DISPLAY=localhost:0.0
export NO_AT_BRIDGE=1
```

By default the font rendering will look terrible. We want to revert FreeType engine to v35, and enable sub-pixel rendering:
* Execute
  ```
  sudo ln -s ../conf.avail/10-sub-pixel-rgb.conf /etc/fonts/conf.d
  ```
* Add the following to `.bashrc`
  ```
  export FREETYPE_PROPERTIES="truetype:interpreter-version=35 cff:no-stem-darkening=1 autofitter:warping=1"
  ```

_(Created 14 Oct 2019)_
