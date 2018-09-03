enqueueTask(async () => {

  await VFS.mkdir("/home");
  await VFS.mkdir("/bin");

  let file = await VFS.open("/bin/clear", 'file');
  await file.writeAll(function () {
    document.body.innerHTML = '<p></p>';
  });

  file = await VFS.open("/bin/pwd", 'file');
  await file.writeAll(function (env, _arg, lib) {
    return lib.puts(env.WORKING_DIRECTORY + "\n");
  });

  file = await VFS.open("/bin/cat", 'file');
  await file.writeAll(async function (lib, args, lib) {
    if (args.length < 2) args[1] = '/dev/stdin';
    var current = await lib.fopen(args[1]);
    if (current == null) {
      return lib.puts("cat: " + args[1] + ": No such file or directory\n");
    } else if (current.isDirectory()) {
      return lib.puts("cat: " + args[1] + ": Is a directory\n");
    } else if (!current.canRead()) {
      return lib.puts("cat: " + args[1] + ": Permission denied\n");
    } else {
      let buffer = new Uint8Array(2048);
      let len;
      while ((len = (await current.read(buffer))[0]) !== 0) {
        await lib.puts(buffer.subarray(0, len));
      }
    }
  });

  await Promise.all([
    VFS.load('/bin/ls', 'js/bin/ls.js'),
    VFS.load('/bin/bash', 'js/bin/bash.js'),
    VFS.load('/bin/echo', 'js/bin/echo.js')
  ]);

  (await VFS.lookup('/bin/markdown', 'file')).mount(null, 'netfs', 'js/bin/markdown.js');
  (await VFS.mkdir('/home/blog')).mount(null, 'netfs', 'blog/manifest');

  function cmdFromHash(hash) {
    // Remove prefix #
    hash = hash.substr(1);
    // For now deal with markdown files only
    if (!hash.endsWith('.md')) return null;
    return ['markdown', hash];
  }

  async function init() {
    var env = {
      PATH: "/bin/",
      HOME: "/home/",
      WORKING_DIRECTORY: "/home/"
    };

    let lib = new CLib(env);
    await lib.puts("Gary Guo <gary@garyguo.net>\nCopyright (c) 2014 - 2018, Gary Guo. All rights reserved.\n");

    let firstCommand = cmdFromHash(location.hash);
    if (firstCommand) {
      await lib.puts('\x1b[1;34m~ \x1b[1;31m$ \x1b[0m' + firstCommand.join(' '));
      try {
        await lib.exec(firstCommand[0], firstCommand);
      } catch (ex) {
        await lib.puts(`${firstCommand[0]}: ${ex.message}`);
      }
    }

    file = await VFS.open("/bin/bash");
    while (true) {
      await file.exec(env, ["/bin/bash"]);
      window.close();
      await stdout.writeAll("Permission Denied: You browser does not allow the window to be closed.\n");
    }
  }

  init();
});
