enqueueTask(async () => {

  async function load(path, url) {
    let file = await VFS.lookup(path, 'file');
    let buffer = await loadFile(url);
    return file.open().writeAll(buffer);
  }

  async function lazyload(path, url) {
    let file = await VFS.lookup(path, 'file');
    file.mount(null, 'netfs', url);
  }

  async function define(path, content) {
    let file = await VFS.lookup(path, 'file');
    return file.open().writeAll(content);
  }

  await VFS.mkdir("/home");
  await VFS.mkdir("/bin");

  await define('/bin/clear', function () {
    document.body.innerHTML = '<p></p>';
  });

  await define('/bin/pwd', function (env, _arg, lib) {
    return lib.puts(env.WORKING_DIRECTORY + "\n");
  });

  await define('/bin/cat', async function (lib, args, lib) {
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

  await lazyload('/bin/echo', 'js/bin/echo.js');
  await lazyload('/bin/markdown', 'js/bin/markdown.js');

  (await VFS.mkdir('/home/blog')).mount(null, 'netfs', 'blog/manifest');
  await lazyload('/home/me', 'js/resume.js');

  await Promise.all([load('/bin/ls', 'js/bin/ls.js'), load('/bin/bash', 'js/bin/bash.js')]);

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
      await lib.puts("Permission Denied: You browser does not allow the window to be closed.\n");
    }
  }

  init();
});
