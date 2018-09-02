async function main(env, args, lib) {
  return new Promise((resolve, reject) => {
    var builtinFunc = {
      exit: function exit(args) {
        resolve();
        return new Promise(() => {});
      },
      logout: function exit(args) {
        resolve();
        return new Promise(() => {});
      },
      cd: async function cd(args) {
        if (!args[1]) {
          env.WORKING_DIRECTORY = env.HOME;
        } else {
          try {
            await lib.chdir(args[1]);
          } catch (ex) {
            return lib.puts("cd: " + args[1] + ": " + ex.message);
          }
        }
      }
    };

    function simplifyPath(path) {
      if (path == env.HOME) {
        return "~";
      } else if (path.startsWith(env.HOME)) {
        return "~/" + path.substr(env.HOME.length);
      } else {
        return path;
      }
    }

    function printPrompt(dir) {
      return lib.puts("\033[1;34m" + simplifyPath(env.WORKING_DIRECTORY)
        + " \033[1;31m$ \033[0m");
    }

    async function getAllPossibleChoices(paths, prefix) {
      var pc = [];
      for (var i = 0; i < paths.length; i++) {
        var f = await lib.fopen(paths[i]);
        if (!f)
          continue;
        var list = await f.list();
        for (var j = 0; j < list.length; j++) {
          if (list[j].indexOf(prefix) == 0) {
            if ((await lib.fopen(paths[i] + "/" + list[j])).isDirectory()) {
              pc.push(list[j] + "/");
            } else {
              pc.push(list[j]);
            }
          }
        }
      }
      return pc;
    }

    function commonPrefix(a, b) {
      var len = Math.min(a.length, b.length);
      for (var i = 0; i < len; i++) {
        if (a[i] != b[i]) {
          return a.substr(0, i);
        }
      }
      return a.substr(0, len);
    }

    function extractCommon(arr) {
      var common = arr[0];
      for (var i = 1; i < arr.length; i++) {
        common = commonPrefix(common, arr[i]);
      }
      return common;
    }

    async function execute(arg) {
      if (arg === '') {
        await lib.puts('exit\n');
        await builtinFunc.exit();
      }

      var args = arg.trim().split(" ");
      for (var i = 0; i < args.length; i++) {
        if (args[i] == "") {
          args.splice(i, 1);
          i--;
        }
      }
      if (args.length == 0) {
        return readAndExec();
      }
      if (builtinFunc[args[0]]) {
        await builtinFunc[args[0]](args);
        return readAndExec();
      }
      try {
        await lib.exec(args[0], args, readAndExec);
        return readAndExec();
      } catch (e) {
        await lib.puts(args[0] + ": " + e + "\n");
        return readAndExec();
      }
    }

    function readAndExec() {
      printPrompt();
      var prev = "";
      lib.historyNextLine(async function (key, element) {
        if (key != "tab")
          return;
        var currentInput = element.value;
        if (currentInput == "")
          return;
        var currentArgIndex = currentInput.lastIndexOf(" ") + 1;
        if (currentArgIndex == 0 && currentInput.lastIndexOf("/") == -1) {
          var pc = await getAllPossibleChoices(env.PATH.split(";"), currentInput);
          if (pc.length == 0) {
          } else if (pc.length == 1) {
            element.value = pc[0];
          } else {
            var ext = extractCommon(pc);
            if (ext == currentInput) {
              if (prev != currentInput) {
                prev = currentInput;
                return;
              }
              /* Print out all possible alternative */
              async function p() {
                await lib.puts(currentInput + "\n");
                for (var i = 0; i < pc.length; i++) {
                  await lib.puts(pc[i] + "  ");
                }
                await lib.puts("\n");
                readAndExec();
              }
              p();
            } else {
              element.value = ext;
            }
          }
        } else {
          var prefix = currentInput.substr(0, currentArgIndex);
          var arg = currentInput.substr(currentArgIndex);
          var pathId = arg.lastIndexOf("/") + 1;
          var path = arg.substr(0, pathId);
          var file = arg.substr(pathId);
          var pc = await getAllPossibleChoices([path], file);
          if (pc.length == 0) {
          } else if (pc.length == 1) {
            element.value = prefix + path + pc[0];
          } else {
            var ext = extractCommon(pc);
            if (ext == file) {
              if (prev != currentInput) {
                prev = currentInput;
                return;
              }
              /* Print out all possible alternative */
              async function p() {
                await lib.puts(currentInput + "\n");
                for (var i = 0; i < pc.length; i++) {
                  await lib.puts(pc[i] + "  ");
                }
                await lib.puts("\n");
                readAndExec(currentInput);
              }
              p();
            } else {
              element.value = prefix + path + ext;
            }
          }
        }

      }).then(execute);
    }
    readAndExec();
  });
}
