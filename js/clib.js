class CLib {
  constructor(env) {
    this.env = env;
    this.stdout = VFS.tty.open();
    this.stdin = VFS.tty.open();
  }

  _getFullPath(path) {
    if (path[0] != "/") {
      return this.env.WORKING_DIRECTORY + path;
    }
    return path;
  }

  fopen(path, newFlag) {
    return VFS.open(this._getFullPath(path), newFlag);
  }

  puts(cont) {
    return this.stdout.writeAll(cont);
  }

  /* POSIX */
  async chdir(path) {
    let newPath = VFS.resolve(this._getFullPath(path));
    let file = await VFS.open(newPath);
    if (file == null) throw new Error('No such file or directory');
    if (!file.isDirectory()) throw new Error('Is not a directory');
    this.env.WORKING_DIRECTORY = newPath + (newPath.endsWith('/') ? '' : '/');
  }

  async stat(path) {
    var f = await VFS.lookup(this._getFullPath(path));
    if (f == null) {
      return null;
    }
    var opened = f.open();
    return {
      type: f.type,
      exec: opened.canExec()
    };
  }

  async exec(cmd, args) {
    // Absolute path
    if (cmd[0] === "/") {
      let file = await VFS.open(cmd);
      if (file == null) {
        throw new Error('command not found');
      }
      if (file.isDirectory()) {
        throw new Error('Is a directory');
      } else if (!file.canExec()) {
        throw new Error('Permission denied');
      } else {
        return file.exec(this.env, args);
      }
    }

    let errorMsg = false;
    let paths = this.env.PATH.split(";");
    // If / is included in the command, then also lookup from current working directory
    // This allows ./cmd to work but not cmd (if . is not included in the path)
    if (cmd.indexOf('/') !== -1) paths.unshift(this.env.WORKING_DIRECTORY);

    for (let path of paths) {
      if (path[0] !== '/') path = this.env.WORKING_DIRECTORY + path;
      let file = await VFS.open(path + '/' + cmd);
      if (file === null) continue;
      if (file.isDirectory()) {
        errorMsg = "Is a directory";
      } else if (!file.canExec()) {
        errorMsg = "Permission denied"
      } else {
        return file.exec(this.env, args);
      }
    }

    throw new Error(errorMsg || 'command not found');
  }
}

CLib.prototype.historyNextLine = async function (specKey) {
  if (!this.HNLHistory) {
    this.HNLHistory = [];
  }
  let history = this.HNLHistory;
  let id = history.length;

  // We rely on the fact that this call will setup inputbox immediately
  let promise = this.stdin.read(2048, 'string');
  let inputbox = document.getElementById('inputbox');

  inputbox.addEventListener('keydown', (e) => {
    let key;
    switch (e.which) {
      case 38:
        key = "up";
        break;
      case 40:
        key = "down";
        break;
      case 9:
        key = "tab";
        break;
      default:
        return;
    }
    if (key == "up") {
      if (id == 0) {
        return;
      }
      if (id == history.length) {
        inputBackup = inputbox.value;
      }
      id--;
      inputbox.value = history[id];
    } else if (key == "down") {
      if (id == history.length) {
        return;
      }
      id++;
      if (id == history.length) {
        inputbox.value = inputBackup;
      } else {
        inputbox.value = history[id];
      }
    } else {
      specKey && specKey(key, inputbox);
    }
    e.preventDefault();
  });

  let [, val] = await promise;
  if (history[history.length - 1] != val) {
    history.push(val);
    id = history.length;
    if (history.length > 20) {
      history.splice(0, history.length - 20);
      id = 20;
    }
  }
  return val;
}
