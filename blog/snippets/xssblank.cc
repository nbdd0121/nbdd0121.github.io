/*
 * A minimal screen saver made for touch kiosk. All it does is to discard the first event which wakes up the screen
 * from the screen saver. Simply set the desired screen saver and DPMS options using xset, and run this program.
 *
 * This program comes with backlight control for RPi touchscreen, remove/modify it to fit your need.
 */

#include <err.h>
#include <cstdlib>
#include <vector>
#include <fstream>

#include <X11/Xlib.h>
#include <X11/extensions/scrnsaver.h>

static Display* display;

static void close_display() {
    if (display != NULL)
        XCloseDisplay(display);
}

[[noreturn]]
static int on_x_error(Display *display, XErrorEvent *event) {
    char buf[1024];
    XGetErrorText(display, event->error_code, buf, sizeof(buf));
    errx(1, "X Error: %s", buf);
}

static void wait_for_input(Display *display) {
    XEvent event;
    // Wait until we received a input event
    while (!XNextEvent(display, &event)) {
        if (event.type == KeyPress || event.type == ButtonPress) {
            return;
        }
    }
}

static void unblank(Display *display, Window window) {
    // Ungrab Inputs
    XUngrabKeyboard(display, CurrentTime);
    XUngrabPointer(display, CurrentTime);

    // Destroy window
    XDestroyWindow(display, window);
}

static bool blank(Display *display, int screen, Window& window) {
    Window root = RootWindow(display, screen);

    // Create a fullscreen window with black background and override redirect
    XSetWindowAttributes attributes;
    attributes.override_redirect = 1;
    attributes.background_pixel = BlackPixel(display, screen);
    window = XCreateWindow(display, root, 0, 0, DisplayWidth(display, screen), DisplayHeight(display, screen), 0,
                    DefaultDepth(display, screen), CopyFromParent, DefaultVisual(display, screen),
                    CWOverrideRedirect | CWBackPixel, &attributes);

    // Make the window visible and place it at the top
    XMapRaised(display, window);

    // Grab mouse input
    if (!XGrabPointer(display, root, False, ButtonPressMask | ButtonReleaseMask | PointerMotionMask, GrabModeAsync,
                GrabModeAsync, None, None, CurrentTime) == GrabSuccess) {
        return false;
    }

    // Grab keyboard input
    if (!XGrabKeyboard(display, root, True, GrabModeAsync, GrabModeAsync, CurrentTime) == GrabSuccess) {
        return false;
    }

    return true;
}

void turn_off_backlight() {
    std::ofstream file;
    file.open("/sys/class/backlight/rpi_backlight/bl_power");
    file << "1";
    file.close();
}

void turn_on_backlight() {
    std::ofstream file;
    file.open("/sys/class/backlight/rpi_backlight/bl_power");
    file << "0";
    file.close();
}

void blank_and_wait(Display *display) {
    // For each screen, blank it
    int num_screen = ScreenCount(display);
    if (num_screen == 0) return;

    std::vector<Window> windows;
    windows.reserve(num_screen);

    bool success = true;
    for (int i = 0; i < num_screen; i++) {
        Window window;
        // We must succeed in every single blank() call.
        if (!blank(display, i, window)) {
            success = false;
            break;
        }
        windows.push_back(window);
    }

    // Flush our operations
    XSync(display, False);

    // If we successfully grabbed all inputs, wait for the event
    if (success) {
        turn_off_backlight();
        wait_for_input(display);
        turn_on_backlight();
    }

    // In case we fail, or we have received an event, unblank everything
    for (auto window: windows)
        unblank(display, window);
}

int main(int argc, char **argv) {
    // Open the display
    display = XOpenDisplay(NULL);
    if (!display) {
        errx(1, "Cannot open display\n");
    }

    // Make sure display is always closed properly
    atexit(close_display);

    // Check for the presense of screen saver extension
    int event_base;
    int error_base;
    if (!XScreenSaverQueryExtension(display, &event_base, &error_base))
        errx(1, "Screen saver extension not present");

    // Register error handler
    XSetErrorHandler(on_x_error);

    // Select screen saver input
    XScreenSaverSelectInput(display, DefaultRootWindow(display), ScreenSaverNotifyMask);

    // Main loop, keep waiting for screen saver on event
    XEvent event;
    while(!XNextEvent(display, &event)) {
        if (((XScreenSaverNotifyEvent *)&event)->state == ScreenSaverOn) {
            blank_and_wait(display);
        }
    }

    return 0;
}

