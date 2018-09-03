async function main(env, args, lib) {
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
    let suggestions = [];
    for (let path of paths) {
      let dir = await lib.fopen(path);
      if (!dir) continue;
      for (let item of await dir.list()) {
        if (item.startsWith(prefix)) {
          if ((await lib.fopen(path + "/" + item)).isDirectory()) {
            suggestions.push(item + "/");
          } else {
            suggestions.push(item);
          }
        }
      }
    }
    return suggestions;
  }

  function commonPrefix(a, b, ...rest) {
    if (b === undefined) return a;
    let len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] != b[i]) {
        return commonPrefix(a.substr(0, i), ...rest);
      }
    }
    return commonPrefix(a.substr(0, len), ...rest);
  }

  function readLine() {
    return new Promise((resolve, reject) => {
      function tryReadLine() {
        printPrompt();
        let prev = '';
        lib.historyNextLine(async function (key, inputbox) {
          if (key != 'tab')
            return;
          let input = inputbox.value;
          if (input == '')
            return;
          let argIndex = input.lastIndexOf(' ') + 1;
          let prevArgs = input.substr(0, argIndex);
          let arg = input.substr(argIndex);
          let pathIndex = arg.lastIndexOf('/') + 1;
          let path = arg.substr(0, pathIndex);
          let filename = arg.substr(pathIndex);

          let pathList = argIndex == 0 && pathIndex == 0 ? env.PATH.split(";") : [path || './'];
          let suggestions = await getAllPossibleChoices(pathList, filename);

          if (suggestions.length === 0) return;
          if (suggestions.length === 1) {
            inputbox.value = prevArgs + path + suggestions[0];
            return;
          }

          let prefix = commonPrefix(...suggestions);
          if (prefix === filename) {
            if (prev !== filename) {
              prev = filename;
              return;
            }

            /* Print out all possible alternative */
            (async () => {
              await lib.puts(input + "\n");
              for (let item of suggestions) {
                await lib.puts(item + "  ");
              }
              await lib.puts("\n");
              tryReadLine();
            })();
          } else {
            inputbox.value = prevArgs + path + prefix;
          }
        }).then(resolve, reject);
      }
      tryReadLine();
    });
  }

  // Main loop
  while (true) {
    let line = await readLine();
    // EOF
    if (line === '') {
      await lib.puts('exit\n');
      return;
    }

    // Process arguments
    let args = line.trim().split(" ");
    for (let i = 0; i < args.length; i++) {
      if (args[i] == "") {
        args.splice(i, 1);
        i--;
      }
    }
    if (args.length == 0) continue;
    switch (args[0]) {
      case 'exit':
      case 'logout': return;
      case 'cd':
        if (!args[1]) {
          env.WORKING_DIRECTORY = env.HOME;
        } else {
          try {
            await lib.chdir(args[1]);
          } catch (ex) {
            await lib.puts(`cd: ${args[1]}: ${ex.message}\n`);
          }
        }
        break;
      default:
        try {
          await lib.exec(args[0], args);
        } catch (e) {
          await lib.puts(args[0] + ": " + e.message + "\n");
        }
        break;
    }
  }
}
